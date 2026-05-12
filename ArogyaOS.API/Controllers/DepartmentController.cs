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
public class DepartmentController : ControllerBase
{
    private readonly IDepartmentService _departmentService;

    public DepartmentController(IDepartmentService departmentService)
    {
        _departmentService = departmentService;
    }

    // ─── GET api/department ───────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _departmentService.GetAllAsync(hospitalId);
        return Ok(result);
    }

    // ─── POST api/department ──────────────────────────
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateDepartmentRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _departmentService
            .CreateAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── GET api/department/doctors ───────────────────
    [HttpGet("doctors")]
    public async Task<IActionResult> GetDoctors(
        [FromQuery] Guid? departmentId)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _departmentService
            .GetDoctorsAsync(hospitalId, departmentId);
        return Ok(result);
    }

    // ─── GET api/department/doctors/{id} ──────────────
    [HttpGet("doctors/{id}")]
    public async Task<IActionResult> GetDoctorById(Guid id)
    {
        var hospitalId = GetHospitalId();
        var result = await _departmentService
            .GetDoctorByIdAsync(id, hospitalId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    // ─── POST api/department/doctors ──────────────────
    [HttpPost("doctors")]
    public async Task<IActionResult> CreateDoctor(
        [FromBody] CreateDoctorRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _departmentService
            .CreateDoctorAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── PUT api/department/doctors/{id} ─────────────
    [HttpPut("doctors/{id}")]
    public async Task<IActionResult> UpdateDoctor(
        Guid id, [FromBody] UpdateDoctorRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _departmentService
            .UpdateDoctorAsync(id, request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── PUT api/department/doctors/{id}/availability ─
    [HttpPut("doctors/{id}/availability")]
    public async Task<IActionResult> UpdateAvailability(
        Guid id, [FromBody] bool isAvailable)
    {
        var hospitalId = GetHospitalId();
        var result = await _departmentService
            .UpdateDoctorAvailabilityAsync(id, isAvailable, hospitalId);
        if (!result.Success) return BadRequest(result);
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