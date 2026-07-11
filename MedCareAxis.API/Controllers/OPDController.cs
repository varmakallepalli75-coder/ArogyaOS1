using MedCareAxis.Infrastructure.Services;
using MedCareAxis.API.Extensions;
using MedCareAxis.API.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedCareAxis.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[SubscriptionCheck]
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

    [HttpGet("patient/{patientId}/history")]
    public async Task<IActionResult> GetPatientHistory(
        Guid patientId, [FromQuery] int limit = 5)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _opdService.GetPatientHistoryAsync(patientId, hospitalId, limit);
        return Ok(result);
    }

    [HttpGet("my/history")]
    public async Task<IActionResult> GetMyHistory([FromQuery] int limit = 50)
    {
        var patientId  = GetPatientId();
        var hospitalId = GetHospitalId();
        if (patientId == Guid.Empty || hospitalId == Guid.Empty) return Unauthorized();
        var result = await _opdService.GetPatientHistoryAsync(patientId, hospitalId, limit);
        return Ok(result);
    }

    private Guid GetHospitalId() => User.GetHospitalId();

    private Guid GetPatientId() => User.GetPatientId();
}