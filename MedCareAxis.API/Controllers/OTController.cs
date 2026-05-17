using MedCareAxis.API.Filters;
using MedCareAxis.Core.DTOs.Request;
using MedCareAxis.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedCareAxis.API.Controllers;

[ApiController]
[Route("api/ot")]
[Authorize]
[SubscriptionCheck]
public class OTController : ControllerBase
{
    private readonly IOTService _ot;
    public OTController(IOTService ot) { _ot = ot; }

    // ─── Rooms ──────────────────────────────────────────────────────────────

    // GET /api/ot/rooms
    [HttpGet("rooms")]
    public async Task<IActionResult> GetRooms()
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        return Ok(await _ot.GetRoomsAsync(hospitalId));
    }

    // POST /api/ot/rooms
    [HttpPost("rooms")]
    public async Task<IActionResult> CreateRoom([FromBody] CreateOTRoomRequest req)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var user = GetUser();
        var result = await _ot.CreateRoomAsync(req, hospitalId, user);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // PUT /api/ot/rooms/{id}/toggle
    [HttpPut("rooms/{id}/toggle")]
    public async Task<IActionResult> ToggleRoom(Guid id)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        return Ok(await _ot.ToggleRoomAsync(id, hospitalId));
    }

    // ─── Schedules ──────────────────────────────────────────────────────────

    // GET /api/ot?date=2025-05-05&status=Scheduled&page=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetSchedules(
        [FromQuery] DateTime? date,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        return Ok(await _ot.GetSchedulesAsync(hospitalId, date, status, page, pageSize));
    }

    // GET /api/ot/today
    [HttpGet("today")]
    public async Task<IActionResult> GetToday()
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        return Ok(await _ot.GetTodaySchedulesAsync(hospitalId));
    }

    // GET /api/ot/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _ot.GetScheduleByIdAsync(id, hospitalId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    // POST /api/ot
    [HttpPost]
    public async Task<IActionResult> Schedule([FromBody] ScheduleOTRequest req)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var user = GetUser();
        var result = await _ot.ScheduleOTAsync(req, hospitalId, user);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // PUT /api/ot/{id}/status
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOTStatusRequest req)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var user = GetUser();
        var result = await _ot.UpdateStatusAsync(id, req, hospitalId, user);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // PUT /api/ot/{id}/checklist
    [HttpPut("{id}/checklist")]
    public async Task<IActionResult> UpdateChecklist(Guid id, [FromBody] UpdateOTChecklistRequest req)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var user = GetUser();
        var result = await _ot.UpdateChecklistAsync(id, req, hospitalId, user);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // DELETE /api/ot/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var user = GetUser();
        var result = await _ot.CancelScheduleAsync(id, hospitalId, user);
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
