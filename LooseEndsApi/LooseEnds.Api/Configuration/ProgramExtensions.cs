using LooseEnds.Api.Services;
using LooseEnds.Database;
using Microsoft.EntityFrameworkCore;

namespace LooseEnds.Api.Configuration;

public static class ProgramExtensions
{
    public static void ConfigureDatabase(this WebApplicationBuilder builder)
    {
        var key = "GameConnection";
        var connectionString = builder.Configuration.GetConnectionString("GameConnection") 
            ?? throw new Exception($"Couldn't find connection string using key {key}");
        
        // Doing this so I can specify a file system path to prevent it from looking for a server
        if (connectionString.StartsWith("Data Source="))
        {
            var dbPath = connectionString.Replace("Data Source=", "");
            var fullPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, dbPath));
            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

            connectionString = $"Data Source={fullPath}";
        }

        builder.Services.AddDbContext<GameContext>(options => {
            options.UseSqlite(connectionString);
            options.UseSeeding((context, isDev) => GameContext.SeedData(context));
        });
    }

    public static void ConfigureCors(this WebApplicationBuilder builder)
    {
        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy
                    .WithOrigins("http://localhost:3000")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });
    }

    public static void RegisterServices(this WebApplicationBuilder builder)
    {
        builder.Services.AddScoped<ISessionService, SessionService>();
        builder.Services.AddScoped<IPlayerService, PlayerService>();
        builder.Services.AddScoped<IRoundService, RoundService>();
    }
}
