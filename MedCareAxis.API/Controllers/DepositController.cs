using MedCareAxis.API.Filters;
using MedCareAxis.Core.DTOs.Request;
using MedCareAxis.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedCareAxis.API.Controllers;

[ApiController]
[Route("api/deposits")]
[Authorize]
[SubscriptionCheck]
public class DepositController : ControllerBase
{
    private readonly IDepositService _deposits;
    public DepositController(IDepositService deposits) { _deposits = deposits; }

    // GET /api/deposits?date=&search=&page=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateTime? date,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        return Ok(await _deposits.GetAllAsync(hospitalId, date, search, page, pageSize));
    }

    // GET /api/deposits/summary/{patientId}?admissionId=
    [HttpGet("summary/{patientId}")]
    public async Task<IActionResult> GetSummary(Guid patientId, [FromQuery] Guid? admissionId)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _deposits.GetSummaryAsync(patientId, admissionId, hospitalId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    // POST /api/deposits/collect
    [HttpPost("collect")]
    public async Task<IActionResult> Collect([FromBody] CollectDepositRequest req)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var user = GetUser();
        var result = await _deposits.CollectAsync(req, hospitalId, user);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // POST /api/deposits/refund
    [HttpPost("refund")]
    public async Task<IActionResult> Refund([FromBody] RefundDepositRequest req)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var user = GetUser();
        var result = await _deposits.RefundAsync(req, hospitalId, user);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // POST /api/deposits/adjust
    [HttpPost("adjust")]
    public async Task<IActionResult> Adjust([FromBody] AdjustDepositRequest req)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var user = GetUser();
        var result = await _deposits.AdjustAgainstBillAsync(req, hospitalId, user);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    private Guid GetHospitalId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == "hospitalId");
        if (claim == null || string.IsNullOrEmpty(claim.Value)) return Guid.Empty;
        return Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }

    private string GetUser() =>
        User.Claims.FirstOrDefault(c => c.Type == "email")?.Value ??
        User.Identity?.Name ?? "system";
}
