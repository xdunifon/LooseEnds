namespace LooseEnds.Api.Common;

public static class GameExceptions
{
    public static NotFoundException GameNotFound(string gameCode) => new($"Couldn't find game with code {gameCode}");
    public static GameStartedException AlreadyStarted(string gameCode) => new($"Game with code {gameCode} has already started");
    public static ThreePlayersRequiredException InvalidPlayerCount(int min) => new($"At least {min} players are required before starting the game");
    public static InvalidAnswer InvalidAnswer() => new($"You cannot answer this prompt");
    public static InvalidVote InvalidVote() => new($"You cannot vote on this response");
}

public class NotFoundException(string message) : Exception(message) { }
public class GameStartedException(string message) : Exception(message) { }
public class ThreePlayersRequiredException(string message): Exception(message) { }
public class InvalidAnswer(string message): Exception(message) { }
public class InvalidVote(string message): Exception(message) { }
public class Unauthorized(string message): Exception(message) { }
