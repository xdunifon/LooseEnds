using LooseEnds.Database.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace LooseEnds.Database;

public class GameContext(DbContextOptions<GameContext> options) : DbContext(options)
{
    private static readonly JsonSerializerOptions s_readOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public DbSet<GameSession> GameSessions { get; set; }
    public DbSet<Player> Players { get; set; }
    public DbSet<PlayerResponse> PlayerResponses { get; set; }
    public DbSet<PlayerVote> PlayerVotes { get; set; }
    public DbSet<Prompt> Prompts { get; set; }
    public DbSet<Round> Rounds { get; set; }
    public DbSet<RoundPrompt> RoundPrompts { get; set; }
    public DbSet<DefaultResponse> DefaultResponses { get; set; }

    public static void SeedData(DbContext context)
    {
        SeedPrompts(context);
        SeedDefaultResponses(context);

        context.SaveChanges();
    }

    private static void SeedPrompts(DbContext context)
    {
        var seedPrompts = ReadJson<Prompt>("data/prompts.json");
        if (seedPrompts == null) return;

        foreach (var p in seedPrompts)
        {
            if (!context.Set<Prompt>().Any(existing => existing.Content == p.Content))
            {
                context.Set<Prompt>().Add(p);
            }
        }
    }

    private static void SeedDefaultResponses(DbContext context)
    {
        var answers = ReadJson<DefaultResponse>("data/defaultAnswers.json");
        if (answers == null) return;

        foreach(var p in answers)
        {
            if (!context.Set<DefaultResponse>().Any(existing => existing.Content == p.Content))
            {
                context.Set<DefaultResponse>().Add(p);
            }
        }
    }

    private static List<T>? ReadJson<T>(string filePath)
    {
        using var stream = File.OpenRead(filePath);
        var data = JsonSerializer.Deserialize<List<T>>(stream, s_readOptions);

        return data;
    }
}