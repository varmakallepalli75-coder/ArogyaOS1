using ArogyaOS.API.Filters;
using ArogyaOS.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Linq;

namespace ArogyaOS.API.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize]
[SubscriptionCheck]
public class AuditController : ControllerBase
{
    private readonly IAuditService _audit;

    public AuditController(IAuditService audit) => _audit = audit;

    private Guid HospitalId => Guid.Parse(User.FindFirstValue("hospitalId")!);

    private bool IsAdmin
    {
        get
        {
            // JWT middleware remaps 'role' claim to ClaimTypes.Role
            var role = User.FindFirstValue(ClaimTypes.Role)
                    ?? User.Claims.FirstOrDefault(c => c.Type == "role")?.Value
                    ?? "";
            return role is "HospitalAdmin" or "SuperAdmin";
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null)
    {
        if (!IsAdmin) return Forbid();
        var hospitalId = HospitalId;
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _audit.GetLogsAsync(hospitalId, page, pageSize, search);
        return Ok(result);
    }
}
