using MedCareAxis.API.Extensions;
using MedCareAxis.API.Filters;
using MedCareAxis.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace MedCareAxis.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SupportController : ControllerBase
{
    private readonly ISupportService _support;
    public SupportController(ISupportService support) => _support = support;

    // Hospital raises a ticket
    [HttpPost]
    [SubscriptionCheck]
    public async Task<IActionResult> Create([FromBody] CreateTicketRequest request)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var name   = User.FindFirstValue(ClaimTypes.Name) ?? "Staff";
        var result = await _support.CreateTicketAsync(request, hospitalId, userId, name);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // Hospital lists their own tickets
    [HttpGet]
    [SubscriptionCheck]
    public async Task<IActionResult> GetMine()
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        return Ok(await _support.GetHospitalTicketsAsync(hospitalId));
    }

    // Hospital views a specific ticket
    [HttpGet("{id}")]
    [SubscriptionCheck]
    public async Task<IActionResult> GetOne(Guid id)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _support.GetTicketAsync(id, hospitalId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    // Hospital replies to a ticket
    [HttpPost("{id}/reply")]
    [SubscriptionCheck]
    public async Task<IActionResult> Reply(Guid id, [FromBody] ReplyTicketRequest request)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var name   = User.FindFirstValue(ClaimTypes.Name) ?? "Staff";
        var result = await _support.ReplyAsync(id, request, userId, name, false, hospitalId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ─── Super Admin endpoints ─────────────────────────────────────────────────

    [HttpGet("admin/all")]
    public async Task<IActionResult> AdminGetAll([FromQuery] string? status)
    {
        if (!IsSuperAdmin()) return Forbid();
        return Ok(await _support.GetAllTicketsAsync(status));
    }

    [HttpPost("admin/{id}/reply")]
    public async Task<IActionResult> AdminReply(Guid id, [FromBody] ReplyTicketRequest request)
    {
        if (!IsSuperAdmin()) return Forbid();
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var result = await _support.ReplyAsync(id, request, userId, "MedCareAxis Support", true, null);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("admin/{id}/status")]
    public async Task<IActionResult> AdminUpdateStatus(Guid id, [FromBody] UpdateStatusRequest request)
    {
        if (!IsSuperAdmin()) return Forbid();
        var result = await _support.UpdateStatusAsync(id, request.Status);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    private Guid GetHospitalId() => User.GetHospitalId();

    private bool IsSuperAdmin()
    {
        var role = User.Claims.FirstOrDefault(c => c.Type == "role")?.Value
                ?? User.Claims.FirstOrDefault(c => c.Type.EndsWith("/role"))?.Value;
        return role == "SuperAdmin";
    }
}

public class UpdateStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
