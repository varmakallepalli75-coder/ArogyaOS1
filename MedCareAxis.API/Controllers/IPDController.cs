using MedCareAxis.API.Filters;
using MedCareAxis.Core.DTOs.Request;
using MedCareAxis.Core.Enums;
using MedCareAxis.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedCareAxis.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[SubscriptionCheck]
public class IPDController : ControllerBase
{
    private readonly IIPDService _ipdService;

    public IPDController(IIPDService ipdService) { _ipdService = ipdService; }

    // GET /api/ipd?status=0&search=&page=1&pageSize=20
    [HttpGet]
    public async Task<IActionResult> GetAdmissions(
        [FromQuery] int? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        AdmissionStatus? admissionStatus = status.HasValue
            ? (AdmissionStatus)status.Value
            : null;

        var result = await _ipdService.GetAdmissionsAsync(hospitalId, admissionStatus, search, page, pageSize);
        return Ok(result);
    }

    // GET /api/ipd/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetAdmissionById(Guid id)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var result = await _ipdService.GetAdmissionByIdAsync(id, hospitalId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    // POST /api/ipd/admit
    [HttpPost("admit")]
    public async Task<IActionResult> AdmitPatient([FromBody] AdmitPatientRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var result = await _ipdService.AdmitPatientAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // POST /api/ipd/vitals
    [HttpPost("vitals")]
    public async Task<IActionResult> RecordVitals([FromBody] RecordVitalsRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var result = await _ipdService.RecordVitalsAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // POST /api/ipd/discharge
    [HttpPost("discharge")]
    public async Task<IActionResult> DischargePatient([FromBody] DischargePatientRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var result = await _ipdService.DischargePatientAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // GET /api/ipd/wards
    [HttpGet("wards")]
    public async Task<IActionResult> GetWards()
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var result = await _ipdService.GetWardsAsync(hospitalId);
        return Ok(result);
    }

    // GET /api/ipd/beds/available?wardId=xxx
    [HttpGet("beds/available")]
    public async Task<IActionResult> GetAvailableBeds([FromQuery] Guid wardId)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var result = await _ipdService.GetAvailableBedsAsync(wardId, hospitalId);
        return Ok(result);
    }

    // POST /api/ipd/wards
    [HttpPost("wards")]
    public async Task<IActionResult> CreateWard([FromBody] CreateWardRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var result = await _ipdService.CreateWardAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // POST /api/ipd/beds
    [HttpPost("beds")]
    public async Task<IActionResult> CreateBed([FromBody] CreateBedRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var result = await _ipdService.CreateBedAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    private Guid GetHospitalId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == "hospitalId");
        if (claim == null || string.IsNullOrEmpty(claim.Value)) return Guid.Empty;
        return Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}
