using ArogyaOS.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArogyaOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _dashboardService.GetStatsAsync(hospitalId);
        return Ok(result);
    }

    private Guid GetHospitalId()
    {
        var claim = User.Claims
            .FirstOrDefault(c => c.Type == "hospitalId");
        if (claim == null || string.IsNullOrEmpty(claim.Value))
            return Guid.Empty;
        return Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}