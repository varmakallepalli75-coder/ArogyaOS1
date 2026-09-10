using MedCareAxis.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace MedCareAxis.API.Filters;

/// <summary>
/// Applied to hospital-facing endpoints to enforce active subscription.
/// SuperAdmin and Patient roles bypass this check.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class SubscriptionCheckAttribute : Attribute, IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var user = context.HttpContext.User;

        // Only identities that never belong to a hospital bypass subscription enforcement
        var role = user.Claims.FirstOrDefault(c => c.Type == "role")?.Value
                ?? user.Claims.FirstOrDefault(c => c.Type.EndsWith("/role"))?.Value;

        if (role is "SuperAdmin" or "Patient")
        {
            await next();
            return;
        }

        var hospitalIdClaim = user.Claims.FirstOrDefault(c => c.Type == "hospitalId")?.Value;
        if (!Guid.TryParse(hospitalIdClaim, out var hospitalId))
        {
            context.Result = new ObjectResult(new { success = false, message = "Hospital identity is missing or invalid.", code = "INVALID_HOSPITAL_CONTEXT" }) { StatusCode = 403 };
            return;
        }

        var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
        var sub = await db.Subscriptions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.HospitalId == hospitalId);

        if (sub == null)
        {
            context.Result = new ObjectResult(new { success = false, message = "No active subscription was found for this hospital.", code = "SUBSCRIPTION_REQUIRED" }) { StatusCode = 402 };
            return;
        }

        // Allow a 3-day grace period after expiry
        if (sub.EndDate.Date.AddDays(3) < DateTime.UtcNow.Date)
        {
            context.Result = new ObjectResult(new
            {
                success = false,
                message = $"Your subscription expired on {sub.EndDate:dd MMM yyyy}. Please renew to continue using MedCareAxis.",
                code = "SUBSCRIPTION_EXPIRED",
                expiredOn = sub.EndDate
            })
            { StatusCode = 402 };
            return;
        }

        await next();
    }
}
