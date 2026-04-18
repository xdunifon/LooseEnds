using Microsoft.Extensions.Options;
using LooseEnds.Api.Configuration;
using LooseEnds.Api.Common;
using LooseEnds.Database;
using LooseEnds.Database.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using LooseEnds.Api.Dtos.Rounds;
using LooseEnds.Api.Dtos.Players;
using LooseEnds.Api.Dtos.Sessions;

namespace LooseEnds.Api.Services;

public interface ISessionService
{
    Task<SessionStateDto> GetAsync(string gameCode, bool isHost, string userId);
    Task<string> CreateAsync(string gameCode, string hostId);
    Task StartAsync(string gameCode, int roundDurationInSeconds);
    Task NextAsync(string gameCode);
}

public class SessionService(GameContext context, IOptions<GameSettings> options, IHubContext<GameHub> hub) : BaseService(context), ISessionService
{
    private GameSettings Settings => options.Value;

    private static IQueryable<GameSession> FullStateIncludes(IQueryable<GameSession> query) => query
        .Include(s => s.Players)
            .ThenInclude(p => p.Responses)
                .ThenInclude(r => r.Votes)
        .Include(s => s.Rounds)
            .ThenInclude(r => r.RoundPrompts)
                .ThenInclude(rp => rp.PlayerResponses);

    public async Task<SessionStateDto> GetAsync(string gameCode, bool isHost, string userId)
    {
        var game = await FullStateIncludes(_context.GameSessions)
            .Where(s => s.IsActive)
            .FirstOrDefaultAsync(s => s.GameCode == gameCode)
            ?? throw GameExceptions.GameNotFound(gameCode);

        var result = SessionStateDto.FromEntity(game, isHost, userId);
        return result;
    }

    public async Task<string> CreateAsync(string gameCode, string hostId)
    {
        var newGame = new GameSession(hostId, gameCode, Settings.DefaultPromptingDuration);

        _context.GameSessions.Add(newGame);
        await SaveContextAsync();

        return newGame.GameCode;
    }

    public async Task StartAsync(string gameCode, int roundDurationInSeconds)
    {
        var game = _context.GameSessions
            .Include(s => s.Players)
            .Include(s => s.Rounds)
            .Where(s => s.GameCode == gameCode)
            .FirstOrDefault() ?? throw GameExceptions.GameNotFound(gameCode);

        // Validate that the game can start
        if (game.Rounds.Count > 0) throw GameExceptions.AlreadyStarted(gameCode);
        if (game.Players.Count < Settings.MinimumPlayers) throw GameExceptions.InvalidPlayerCount(Settings.MinimumPlayers);

        game.RoundTimer = roundDurationInSeconds;

        // Add bot if player count is odd
        if (game.Players.Count % 2 != 0)
        {
            var botId = Guid.NewGuid().ToString();
            var bot = game.AddPlayer(botId, $"Bot{gameCode}", isBot: true);
        }

        var promptsPerRound = game.Players.Count / 2;
        var numPrompts = Settings.NumberOfRounds * promptsPerRound;
        
        // Order by random and take first n prompts
        // TODO: Generating a random num for every single entry is not very efficient, replace this in the future
        var promptOptions = await _context.Prompts
            .Where(p => p.Active)
            .OrderBy(x => EF.Functions.Random())
            .Take(numPrompts)
            .ToListAsync();

        // Generate rounds
        for(int i = 0; i < Settings.NumberOfRounds; i++)
        {
            var round = game.AddRound(i + 1);
            
            // Order by random guids and take first n players
            var playerOptions = game.Players.OrderBy(x => Guid.NewGuid()).ToList();

            // Generate prompts for round
            for (int j = 0; j < promptsPerRound; j++)
            {
                var selectedPrompt = promptOptions[0];
                promptOptions.RemoveAt(0);

                var roundPrompt = round.AddPrompt(selectedPrompt.Content);

                // Assign two players
                roundPrompt.AssignPlayer(playerOptions[0]);
                roundPrompt.AssignPlayer(playerOptions[1]);
                playerOptions.RemoveRange(0, 2);
            }
        }

        await SaveContextAsync();
    }

    public async Task NextAsync(string gameCode)
    {
        var game = await _context.GameSessions
            .Where(s => s.IsActive)
            .Include(s => s.Rounds)
                .ThenInclude(r => r.RoundPrompts)
                    .ThenInclude(rp => rp.PlayerResponses)
                        .ThenInclude(pr => pr.Votes)
            .FirstOrDefaultAsync(s => s.GameCode == gameCode)
            ?? throw GameExceptions.GameNotFound(gameCode);

        var nextRound = game.GetNextRound();

        // Game over
        if (nextRound == null)
        {
            var players = await _context.Players
                .Include(p => p.Responses)
                    .ThenInclude(r => r.Votes)
                .Where(p => p.SessionId == game.Id)
                .ToListAsync();

            var dto = players.Select(PlayerScoreDto.FromEntity);
            await hub.Clients.Group(gameCode).SendAsync(GameEvents.GameOver, dto);
            return;
        }

        // Start round (prompting)
        if (!nextRound.AnswerDueUtc.HasValue)
        {
            nextRound.AnswerDueUtc = DateTime.UtcNow.AddSeconds(game.RoundTimer + 1);
            await SaveContextAsync();

            var dto = new RoundStartedDto(nextRound.Number, nextRound.AnswerDueUtc.Value);
            await hub.Clients.Group(gameCode).SendAsync(GameEvents.RoundStarted, dto);
            return;
        }

        // Stop prompting
        if (!nextRound.PromptingCompleted)
        {
            nextRound.PromptingCompleted = true;
            await SaveContextAsync();
            await hub.Clients.Group(gameCode).SendAsync(GameEvents.PromptingEnded);
            return;
        }

        // Start voting
        if (!nextRound.VotingRoundPromptId.HasValue)
        {
            var nextPrompt = nextRound.RoundPrompts.First();
            nextRound.VotingRoundPrompt = nextPrompt;
            nextPrompt.VoteDueUtc = DateTime.UtcNow.AddSeconds(Settings.VotingDuration + 1);

            await SaveContextAsync();

            var dto = new VotingStartedDto(
                nextRound.Number, 
                nextPrompt.Id, 
                nextPrompt.VoteDueUtc.Value,
                nextPrompt.PlayerResponses.Select(VoteOptionDto.FromEntity)
            );
            await hub.Clients.Group(gameCode).SendAsync(GameEvents.VotingStarted, dto);
            return;
        }
            
        // End voting for current prompt
        if (nextRound.VotingRoundPrompt != null && !nextRound.VotingRoundPrompt.IsCompleted)
        {
            nextRound.VotingRoundPrompt.IsCompleted = true;
            await SaveContextAsync();

            await hub.Clients.Group(gameCode).SendAsync(GameEvents.VotingEnded);
            return;
        }

        // Get next round prompt to vote on
        var prompt = nextRound.RoundPrompts
            .FirstOrDefault(p => !p.IsCompleted);

        // Round is complete
        if (prompt == null)
        {
            nextRound.VotingRoundPrompt = null;
            nextRound.VotingCompleted = true;
            await SaveContextAsync();

            await hub.Clients.Group(gameCode).SendAsync(GameEvents.RoundEnded);
            return;
        }

        // Move to next prompt
        nextRound.VotingRoundPrompt = prompt;
        prompt.VoteDueUtc = DateTime.UtcNow.AddSeconds(Settings.VotingDuration + 1);
        await SaveContextAsync();

        var vDto = new VotingStartedDto(
                nextRound.Number, 
                prompt.Id, 
                prompt.VoteDueUtc.Value,
                prompt.PlayerResponses.Select(pr => VoteOptionDto.FromEntity(pr))
            );
        await hub.Clients.Group(gameCode).SendAsync(GameEvents.VotingStarted, vDto);
    }
}
