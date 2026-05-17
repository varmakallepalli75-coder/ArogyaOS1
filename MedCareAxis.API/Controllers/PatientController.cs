using MedCareAxis.Core.DTOs.Request;
using MedCareAxis.Core.DTOs.Response;
using MedCareAxis.Infrastructure.Services;
using MedCareAxis.API.Filters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedCareAxis.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[SubscriptionCheck]
public class PatientController : ControllerBase
{
    private readonly IPatientService _patientService;

    public PatientController(IPatientService patientService)
    {
        _patientService = patientService;
    }

    // ─── GET api/patient ──────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _patientService
            .GetAllAsync(hospitalId, search, page, pageSize);
        return Ok(result);
    }

    // ─── GET api/patient/{id} ─────────────────────────
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var hospitalId = GetHospitalId();
        var result = await _patientService
            .GetByIdAsync(id, hospitalId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    // ─── POST api/patient ─────────────────────────────
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreatePatientRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _patientService
            .CreateAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── PUT api/patient/{id} ─────────────────────────
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdatePatientRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var hospitalId = GetHospitalId();
        var result = await _patientService
            .UpdateAsync(id, request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── GET api/patient/search ───────────────────────
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _patientService
            .SearchAsync(q, hospitalId);
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
    // ─── GET api/patient/my-profile ───────────────────
[HttpGet("my-profile")]
public async Task<IActionResult> GetMyProfile()
{
    var patientId = GetPatientId();
    if (patientId == Guid.Empty) return Unauthorized();
    var hospitalId = GetHospitalId();
    var result = await _patientService
        .GetByIdAsync(patientId, hospitalId);
    if (!result.Success) return NotFound(result);
    return Ok(result);
}





private Guid GetPatientId()
{
    var claim = User.Claims
        .FirstOrDefault(c => c.Type == "patientId");
    if (claim == null || string.IsNullOrEmpty(claim.Value))
        return Guid.Empty;
    return Guid.TryParse(claim.Value, out var id)
        ? id : Guid.Empty;
}
}