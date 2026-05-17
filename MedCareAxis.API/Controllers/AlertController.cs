using MedCareAxis.API.Filters;
using MedCareAxis.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedCareAxis.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[SubscriptionCheck]
public class AlertController : ControllerBase
{
    private readonly IAlertService _alertService;

    public AlertController(IAlertService alertService)
    {
        _alertService = alertService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAlerts()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == "hospitalId");
        if (claim == null || !Guid.TryParse(claim.Value, out var hospitalId))
            return Unauthorized();

        var result = await _alertService.GetAlertsAsync(hospitalId);
        return Ok(result);
    }
}
