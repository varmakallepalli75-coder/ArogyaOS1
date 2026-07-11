using MedCareAxis.API.Extensions;
using MedCareAxis.API.Filters;
using MedCareAxis.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedCareAxis.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[SubscriptionCheck]
public class ReportController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportController(IReportService reportService)
    {
        _reportService = reportService;
    }

    // GET /api/report/summary?from=2026-05-01&to=2026-05-31
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _reportService.GetSummaryAsync(hospitalId, from, to);
        return Ok(result);
    }

    // GET /api/report/appointments?from=...&to=...&doctorId=...&status=...
    [HttpGet("appointments")]
    public async Task<IActionResult> GetAppointments(
        [FromQuery] DateTime from, [FromQuery] DateTime to,
        [FromQuery] string? doctorId, [FromQuery] string? status)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _reportService.GetAppointmentsAsync(hospitalId, from, to, doctorId, status);
        return Ok(result);
    }

    // GET /api/report/opd?from=...&to=...
    [HttpGet("opd")]
    public async Task<IActionResult> GetOPD([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _reportService.GetOPDAsync(hospitalId, from, to);
        return Ok(result);
    }

    // GET /api/report/billing?from=...&to=...
    [HttpGet("billing")]
    public async Task<IActionResult> GetBilling([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _reportService.GetBillingAsync(hospitalId, from, to);
        return Ok(result);
    }

    // GET /api/report/trend?from=...&to=...
    [HttpGet("trend")]
    public async Task<IActionResult> GetTrend([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        // Cap at 90 days to avoid too many queries
        if ((to - from).TotalDays > 90)
            to = from.AddDays(90);
        var result = await _reportService.GetDailyTrendAsync(hospitalId, from, to);
        return Ok(result);
    }

    private Guid GetHospitalId() => User.GetHospitalId();
}
