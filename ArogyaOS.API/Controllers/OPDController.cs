using ArogyaOS.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArogyaOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OPDController : ControllerBase
{
    private readonly IOPDService _opdService;

    public OPDController(IOPDService opdService)
    {
        _opdService = opdService;
    }

    [HttpPost("consultation")]
    public async Task<IActionResult> SaveConsultation(
        [FromBody] SaveConsultationRequest request)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _opdService
            .SaveConsultationAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("consultation/{appointmentId}")]
    public async Task<IActionResult> GetConsultation(Guid appointmentId)
    {
        var hospitalId = GetHospitalId();
        var result = await _opdService
            .GetByAppointmentAsync(appointmentId, hospitalId);
        if (!result.Success) return NotFound(result);
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