using MedCareAxis.API.Filters;
using MedCareAxis.Core.DTOs.Request;
using MedCareAxis.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace MedCareAxis.API.Controllers;

[ApiController]
[Route("api/referral")]
[Authorize]
[SubscriptionCheck]
public class ReferralController : ControllerBase
{
    private readonly IReferralService _referral;

    public ReferralController(IReferralService referral) => _referral = referral;

    private Guid HospitalId => Guid.TryParse(User.FindFirstValue("hospitalId"), out var id) ? id : Guid.Empty;

    // ─── POST api/referral ────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Send([FromBody] CreateReferralRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var hospitalId = HospitalId;
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _referral.SendAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── GET api/referral/inbox ───────────────────────
    [HttpGet("inbox")]
    public async Task<IActionResult> GetInbox(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = HospitalId;
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _referral.GetInboxAsync(hospitalId, status, page, pageSize);
        return Ok(result);
    }

    // ─── GET api/referral/sent ────────────────────────
    [HttpGet("sent")]
    public async Task<IActionResult> GetSent(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = HospitalId;
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _referral.GetSentAsync(hospitalId, status, page, pageSize);
        return Ok(result);
    }

    // ─── GET api/referral/inbox/count ─────────────────
    [HttpGet("inbox/count")]
    public async Task<IActionResult> GetInboxCount()
    {
        var hospitalId = HospitalId;
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _referral.GetInboxCountAsync(hospitalId);
        return Ok(result);
    }

    // ─── GET api/referral/hospitals ───────────────────
    [HttpGet("hospitals")]
    public async Task<IActionResult> GetHospitals()
    {
        var hospitalId = HospitalId;
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _referral.GetHospitalsAsync(hospitalId);
        return Ok(result);
    }

    // ─── GET api/referral/{id} ────────────────────────
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var hospitalId = HospitalId;
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _referral.GetByIdAsync(id, hospitalId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    // ─── PUT api/referral/{id}/accept ─────────────────
    [HttpPut("{id}/accept")]
    public async Task<IActionResult> Accept(Guid id, [FromBody] AcceptReferralRequest request)
    {
        var hospitalId = HospitalId;
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _referral.AcceptAsync(id, request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── PUT api/referral/{id}/decline ────────────────
    [HttpPut("{id}/decline")]
    public async Task<IActionResult> Decline(Guid id, [FromBody] DeclineReferralRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var hospitalId = HospitalId;
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _referral.DeclineAsync(id, request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── PUT api/referral/{id}/complete ───────────────
    [HttpPut("{id}/complete")]
    public async Task<IActionResult> Complete(Guid id, [FromBody] CompleteReferralRequest request)
    {
        var hospitalId = HospitalId;
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _referral.CompleteAsync(id, request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── PUT api/referral/{id}/cancel ─────────────────
    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var hospitalId = HospitalId;
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _referral.CancelAsync(id, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
