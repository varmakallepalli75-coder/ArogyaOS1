using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Infrastructure.Services;
using ArogyaOS.API.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArogyaOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[SubscriptionCheck]
public class AppointmentController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
    }

    [HttpGet("today")]
    public async Task<IActionResult> GetToday([FromQuery] Guid? doctorId)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _appointmentService.GetTodayAsync(hospitalId, doctorId);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateTime? date,
        [FromQuery] Guid? doctorId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _appointmentService.GetAllAsync(hospitalId, date, doctorId, page, pageSize);
        return Ok(result);
    }

    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetByPatient(
        Guid patientId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _appointmentService.GetByPatientAsync(patientId, hospitalId, page, pageSize);
        return Ok(result);
    }

    [HttpGet("my/journey")]
    public async Task<IActionResult> GetMyJourney()
    {
        var hospitalId = GetHospitalId();
        var patientId = GetPatientId();
        if (patientId == Guid.Empty) return Unauthorized();
        var result = await _appointmentService.GetTodayJourneyAsync(patientId, hospitalId);
        return Ok(result);
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyAppointments(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = GetHospitalId();
        var patientId = GetPatientId();
        if (patientId == Guid.Empty) return Unauthorized();
        var result = await _appointmentService.GetByPatientAsync(patientId, hospitalId, page, pageSize);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAppointmentRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _appointmentService.CreateAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateAppointmentStatusRequest request)
    {
        var hospitalId = GetHospitalId();
        var result = await _appointmentService.UpdateStatusAsync(id, request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id}/collect-fee")]
    public async Task<IActionResult> CollectFee(Guid id, [FromBody] CollectFeeRequest request)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _appointmentService.CollectFeeAsync(id, request.PaymentMode, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id}/checkin")]
    public async Task<IActionResult> CheckIn(Guid id)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _appointmentService.UpdateStatusAsync(id,
            new ArogyaOS.Core.DTOs.Request.UpdateAppointmentStatusRequest { Status = 1 }, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    private Guid GetHospitalId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == "hospitalId");
        if (claim == null || string.IsNullOrEmpty(claim.Value)) return Guid.Empty;
        return Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }

    private Guid GetPatientId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == "patientId");
        if (claim == null || string.IsNullOrEmpty(claim.Value)) return Guid.Empty;
        return Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}
