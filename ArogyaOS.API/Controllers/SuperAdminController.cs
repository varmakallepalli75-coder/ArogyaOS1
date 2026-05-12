using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Core.Enums;
using ArogyaOS.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArogyaOS.API.Controllers;

// Public endpoint for hospitals to read active announcements + platform settings
[ApiController]
[Route("api/announcements")]
[Authorize]
public class AnnouncementsController : ControllerBase
{
    private readonly ISuperAdminService _sa;
    public AnnouncementsController(ISuperAdminService sa) => _sa = sa;

    [HttpGet]
    public async Task<IActionResult> GetActive()
    {
        var result = await _sa.GetAnnouncementsAsync(activeOnly: true);
        return Ok(result);
    }
}

[ApiController]
[Route("api/platform")]
[Authorize]
public class PlatformController : ControllerBase
{
    private readonly ISuperAdminService _sa;
    public PlatformController(ISuperAdminService sa) => _sa = sa;

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var result = await _sa.GetSettingsAsync();
        return Ok(result);
    }
}

[ApiController]
[Route("api/super-admin")]
[Authorize(Roles = "SuperAdmin")]
public class SuperAdminController : ControllerBase
{
    private readonly ISuperAdminService _superAdminService;
    private readonly ILogger<SuperAdminController> _logger;

    public SuperAdminController(
        ISuperAdminService superAdminService,
        ILogger<SuperAdminController> logger)
    {
        _superAdminService = superAdminService;
        _logger = logger;
    }

    // ─── GET api/super-admin/dashboard ───────────────
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        _logger.LogInformation("SuperAdmin dashboard accessed by {User}", GetSuperAdminId());
        var result = await _superAdminService.GetDashboardAsync();
        return Ok(result);
    }

    // ─── GET api/super-admin/hospitals ───────────────
    [HttpGet("hospitals")]
    public async Task<IActionResult> GetHospitals(
        [FromQuery] string? search,
        [FromQuery] HospitalStatus? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _superAdminService
            .GetAllHospitalsAsync(search, status, page, pageSize);
        return Ok(result);
    }

    // ─── GET api/super-admin/hospitals/{id} ──────────
    [HttpGet("hospitals/{id}")]
    public async Task<IActionResult> GetHospital(Guid id)
    {
        var result = await _superAdminService.GetHospitalByIdAsync(id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    // ─── POST api/super-admin/hospitals ──────────────
    [HttpPost("hospitals")]
    public async Task<IActionResult> OnboardHospital(
        [FromBody] RegisterHospitalRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        _logger.LogInformation("SuperAdmin onboarding hospital: {Name}", request.HospitalName);
        var result = await _superAdminService.OnboardHospitalAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── PUT api/super-admin/hospitals/{id}/status ───
    [HttpPut("hospitals/{id}/status")]
    public async Task<IActionResult> UpdateHospitalStatus(
        Guid id,
        [FromBody] UpdateHospitalStatusRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        _logger.LogWarning("SuperAdmin changing hospital {Id} status to {Status}",
            id, request.Status);
        var result = await _superAdminService
            .UpdateHospitalStatusAsync(id, request.Status, request.Reason);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── POST api/super-admin/hospitals/{id}/reset-password
    [HttpPost("hospitals/{id}/reset-password")]
    public async Task<IActionResult> ResetHospitalPassword(
        Guid id,
        [FromBody] ResetHospitalPasswordRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        _logger.LogWarning("SuperAdmin resetting password for hospital {Id}", id);
        var result = await _superAdminService
            .ResetHospitalPasswordAsync(id, request.NewPassword);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── PUT api/super-admin/hospitals/{id}/subscription
    [HttpPut("hospitals/{id}/subscription")]
    public async Task<IActionResult> UpdateSubscription(
        Guid id,
        [FromBody] UpdateSubscriptionRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _superAdminService
            .UpdateSubscriptionAsync(id, request.Plan);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── PATCH api/super-admin/hospitals/{id}/modules
    [HttpPatch("hospitals/{id}/modules")]
    public async Task<IActionResult> UpdateModules(
        Guid id,
        [FromBody] UpdateModulesRequest request)
    {
        var result = await _superAdminService.UpdateModulesAsync(id, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── GET api/super-admin/analytics ───────────────
    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics()
    {
        var result = await _superAdminService.GetAnalyticsAsync();
        return Ok(result);
    }

    // ─── GET api/super-admin/announcements ───────────
    [HttpGet("announcements")]
    public async Task<IActionResult> GetAnnouncements([FromQuery] bool activeOnly = false)
    {
        var result = await _superAdminService.GetAnnouncementsAsync(activeOnly);
        return Ok(result);
    }

    [HttpPost("announcements")]
    public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementRequest req)
    {
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "superadmin";
        var result = await _superAdminService.CreateAnnouncementAsync(req.Title, req.Body, req.Type, req.ExpiresAt, email);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("announcements/{id}/toggle")]
    public async Task<IActionResult> ToggleAnnouncement(Guid id)
    {
        var result = await _superAdminService.ToggleAnnouncementAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpDelete("announcements/{id}")]
    public async Task<IActionResult> DeleteAnnouncement(Guid id)
    {
        var result = await _superAdminService.DeleteAnnouncementAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    // ─── GET api/super-admin/payments ────────────────
    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments([FromQuery] Guid? hospitalId, [FromQuery] int limit = 100)
    {
        var result = await _superAdminService.GetPaymentsAsync(hospitalId, limit);
        return Ok(result);
    }

    [HttpPost("payments")]
    public async Task<IActionResult> RecordPayment([FromBody] RecordSubPaymentRequest req)
    {
        var result = await _superAdminService.RecordPaymentAsync(req.HospitalId, req.Amount, req.PaymentMode, req.Notes);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ─── GET api/super-admin/health ──────────────────
    [HttpGet("health")]
    public async Task<IActionResult> GetHealthScores()
    {
        var result = await _superAdminService.GetHealthScoresAsync();
        return Ok(result);
    }

    // ─── GET api/super-admin/renewals ────────────────
    [HttpGet("renewals")]
    public async Task<IActionResult> GetRenewals([FromQuery] int days = 30)
    {
        var result = await _superAdminService.GetRenewalsAsync(days);
        return Ok(result);
    }

    // ─── GET/PUT api/super-admin/settings ────────────
    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var result = await _superAdminService.GetSettingsAsync();
        return Ok(result);
    }

    [HttpPut("settings")]
    public async Task<IActionResult> SaveSettings([FromBody] ArogyaOS.Core.DTOs.Response.PlatformSettingsResponse settings)
    {
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "superadmin";
        var result = await _superAdminService.SaveSettingsAsync(settings, email);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ─── GET api/super-admin/audit-logs ──────────────
    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null)
    {
        var result = await _superAdminService.GetPlatformAuditLogsAsync(page, pageSize, search);
        return Ok(result);
    }

    private string GetSuperAdminId()
    {
        return User.Claims
            .FirstOrDefault(c => c.Type ==
                System.Security.Claims.ClaimTypes.NameIdentifier)
            ?.Value ?? "unknown";
    }
}

public class CreateAnnouncementRequest
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Type { get; set; } = "Info";
    public DateTime? ExpiresAt { get; set; }
}

public class RecordSubPaymentRequest
{
    public Guid HospitalId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = "Cash";
    public string? Notes { get; set; }
}
