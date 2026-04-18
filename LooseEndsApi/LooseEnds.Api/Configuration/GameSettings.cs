namespace LooseEnds.Api.Configuration;

public class GameSettings
{
    public int NumberOfRounds { get; set; }
    public int DefaultPromptingDuration { get; set; }
    public int VotingDuration { get; set; }
    public int MinimumPlayers { get; set; }

    public static void Configure(WebApplicationBuilder builder)
    {
        builder.Services.Configure<GameSettings>(
            builder.Configuration.GetSection("GameSettings")
        );
    }
}
