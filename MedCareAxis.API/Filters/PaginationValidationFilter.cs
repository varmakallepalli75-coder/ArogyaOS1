using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace MedCareAxis.API.Filters;

public sealed class PaginationValidationFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        foreach (var key in context.ActionArguments.Keys.ToList())
        {
            if (key.Equals("page", StringComparison.OrdinalIgnoreCase) && context.ActionArguments[key] is int page && page < 1)
            {
                context.Result = new BadRequestObjectResult(new { success = false, message = "page must be at least 1." });
                return;
            }
            if (key.Equals("pageSize", StringComparison.OrdinalIgnoreCase) && context.ActionArguments[key] is int pageSize)
            {
                if (pageSize < 1) { context.Result = new BadRequestObjectResult(new { success = false, message = "pageSize must be at least 1." }); return; }
                context.ActionArguments[key] = Math.Min(pageSize, 100);
            }
            if (key.Equals("limit", StringComparison.OrdinalIgnoreCase) && context.ActionArguments[key] is int limit)
                context.ActionArguments[key] = Math.Clamp(limit, 1, 100);
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}
