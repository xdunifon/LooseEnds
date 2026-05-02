using LooseEnds.Api.Common;
using LooseEnds.Database;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace LooseEnds.Api.Services;

public interface IRoundService
{
    Task AnswerAsync(string gameCode, string playerId, int responseId, string answer);
    Task VoteAsync(string gameCode, string playerId, int responseId);
}

public class RoundService(GameContext context, IHubContext<GameHub> hub) : BaseService(context), IRoundService
{
    /// <summary>
    /// Submits an answer for a given response. Validates that the response belongs to the player 
    /// and that the round is still accepting answers.
    /// </summary>
    /// <param name="gameCode"></param>
    /// <param name="playerId"></param>
    /// <param name="responseId"></param>
    /// <param name="answer"></param>
    /// <returns></returns>
    public async Task AnswerAsync(string gameCode, string playerId, int responseId, string answer)
    {
        var response = await _context.PlayerResponses
            .Include(r => r.Prompt)
                .ThenInclude(p => p.Round)
            .FirstOrDefaultAsync(r => r.Id == responseId && r.PlayerId == playerId)
            ?? throw GameExceptions.InvalidAnswer();

        if (!response.Prompt.Round.AnswerDueUtc.HasValue || response.Prompt.Round.AnswerDueUtc.Value < DateTime.UtcNow)
        {
            throw GameExceptions.InvalidAnswer();
        }

        response.Answer = answer.Trim();
        response.SubmittedUtc = DateTime.UtcNow;

        await SaveContextAsync();

        await hub.Clients.Group(gameCode).SendAsync(GameEvents.PlayerSubmitted, playerId);

        // check if all players have submitted and end round if so
    }

    /// <summary>
    /// Casts a vote for a given response. Validates that the response does not belong to the player
    /// and that the round is still accepting votes.
    /// </summary>
    /// <param name="gameCode"></param>
    /// <param name="playerId"></param>
    /// <param name="responseId"></param>
    /// <returns></returns>
    public async Task VoteAsync(string gameCode, string playerId, int responseId)
    {
        // There is technically a "bug" here where a user could call this endpoint for both voting options
        // Probably worth tightening up in the future, but doesn't really break anything for now

        var response = await _context.PlayerResponses
            .Include(r => r.Prompt)
                .ThenInclude(p => p.Round)
            .Include(r => r.Votes)
            .FirstOrDefaultAsync(r => r.Id == responseId && r.PlayerId != playerId && r.Prompt.Round.VotingRoundPromptId == r.Prompt.Id)
            ?? throw GameExceptions.InvalidVote();

        if (!response.Prompt.VoteDueUtc.HasValue || response.Prompt.VoteDueUtc.Value < DateTime.UtcNow)
        {
            throw GameExceptions.InvalidVote();
        }

        response.AddVote(playerId);
        await SaveContextAsync();

        await hub.Clients.Group(gameCode).SendAsync(GameEvents.PlayerVoted, playerId);
    }
}
