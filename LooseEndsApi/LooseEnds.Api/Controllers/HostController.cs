using LooseEnds.Api.Configuration;
using LooseEnds.Api.Dtos.Sessions;
using LooseEnds.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace LooseEnds.Api.Controllers;

[ApiController]
[Route("game")]
public class HostController(ISessionService service, IHubContext<GameHub> hub) : BaseController
{
    [HttpPost("create")]
    public async Task<IActionResult> Create()
    {
        var gameCode = Guid.NewGuid().ToString().Substring(0, 4).ToUpper();
        var hostId = Guid.NewGuid().ToString();
        await service.CreateAsync(gameCode, hostId);

        return Ok(new
        {
            Token = Auth.CreateToken(gameCode, hostId, $"Host{gameCode}", UserRole.Host),
            HostId = hostId,
            GameCode = gameCode
        });
    }

    [HttpPost("start"), Authorize(Policy = Policies.Host)]
    public async Task<IActionResult> Start(StartGameRequest req)
    {
        var gameCode = GetGameCode();
        var isHost = IsHost();
        var userId = GetUserId();

        await service.StartAsync(gameCode, req.RoundDurationInSeconds);
        var gameState = await service.GetAsync(gameCode, isHost, userId);

        // Remove isHost, userId from this response
        await hub.Clients.Group(gameCode).SendAsync(GameEvents.GameStarted, gameState);

        return Ok();
    }

    [HttpPost("next"), Authorize(Policy = Policies.Host)]
    public async Task<IActionResult> Next()
    {
        var gameCode = GetGameCode();
        await service.NextAsync(gameCode);
        return Ok();
    }
}
