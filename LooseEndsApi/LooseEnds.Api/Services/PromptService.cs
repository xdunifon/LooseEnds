using LooseEnds.Api.Common;
using LooseEnds.Database;
using LooseEnds.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace LooseEnds.Api.Services;

public interface IPromptService
{
    Task<Prompt?> GetRandomPromptAsync(int[]? excludedPromptIds = null);
}

public class PromptService(GameContext context) : BaseService(context), IPromptService
{
    /// <summary>
    /// Gets a random active prompt, excluding any specified IDs.
    /// </summary>
    /// <param name="excludedPromptIds"></param>
    /// <returns></returns>
    public async Task<Prompt?> GetRandomPromptAsync(int[]? excludedPromptIds)
    {
        var query = _context.Prompts.Where(p => p.Active && !excludedPromptIds.Contains(p.Id));
        
        // Return null if the exclusion list excludes all prompts
        var count = await query.CountAsync();
        if (count == 0) return null;
        
        // Get valid prompt IDs
        var promptIds = await query.Select(p => p.Id).ToArrayAsync();

        // Randomly select
        var rng = new Random();
        var selectedId = promptIds.ElementAt(rng.Next(0, promptIds.Length));

        return await _context.Prompts.FindAsync(selectedId);
    }
}
