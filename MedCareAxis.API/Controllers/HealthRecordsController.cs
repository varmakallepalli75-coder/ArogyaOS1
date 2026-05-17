using MedCareAxis.Core.DTOs.Request;
using MedCareAxis.Core.DTOs.Response;
using MedCareAxis.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace MedCareAxis.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HealthRecordsController : ControllerBase
{
    private readonly IHealthRecordsService _service;

    public HealthRecordsController(IHealthRecordsService service)
    {
        _service = service;
    }

    private string MobileNumber =>
        User.FindFirstValue("mobileNumber")
        ?? User.FindFirstValue(ClaimTypes.Email)
        ?? "";

    private List<Guid> LinkedPatientIds
    {
        get
        {
            var raw = User.FindFirstValue("linkedPatientIds") ?? "";
            if (string.IsNullOrWhiteSpace(raw)) return new();
            return raw.Split('|', StringSplitOptions.RemoveEmptyEntries)
                      .Select(s => Guid.TryParse(s, out var g) ? g : Guid.Empty)
                      .Where(g => g != Guid.Empty)
                      .ToList();
        }
    }

    // GET api/health-records/linked-hospitals
    [HttpGet("linked-hospitals")]
    public async Task<IActionResult> GetLinkedHospitals()
    {
        var patientIds = LinkedPatientIds;
        if (!patientIds.Any()) return BadRequest(ApiResponse<object>.Fail("No linked patient records in token."));
        var result = await _service.GetLinkedHospitalsAsync(MobileNumber, patientIds);
        return Ok(result);
    }

    // GET api/health-records/prescriptions
    [HttpGet("prescriptions")]
    public async Task<IActionResult> GetPrescriptions()
    {
        var patientIds = LinkedPatientIds;
        if (!patientIds.Any()) return BadRequest(ApiResponse<object>.Fail("No linked records."));
        var result = await _service.GetAllPrescriptionsAsync(patientIds);
        return Ok(result);
    }

    // GET api/health-records/visits
    [HttpGet("visits")]
    public async Task<IActionResult> GetVisits()
    {
        var patientIds = LinkedPatientIds;
        if (!patientIds.Any()) return BadRequest(ApiResponse<object>.Fail("No linked records."));
        var result = await _service.GetAllVisitsAsync(patientIds);
        return Ok(result);
    }

    // GET api/health-records/admissions
    [HttpGet("admissions")]
    public async Task<IActionResult> GetAdmissions()
    {
        var patientIds = LinkedPatientIds;
        if (!patientIds.Any()) return BadRequest(ApiResponse<object>.Fail("No linked records."));
        var result = await _service.GetAllAdmissionsAsync(patientIds);
        return Ok(result);
    }

    // GET api/health-records/labs
    [HttpGet("labs")]
    public async Task<IActionResult> GetLabOrders()
    {
        var patientIds = LinkedPatientIds;
        if (!patientIds.Any()) return BadRequest(ApiResponse<object>.Fail("No linked records."));
        var result = await _service.GetAllLabOrdersAsync(patientIds);
        return Ok(result);
    }

    // GET api/health-records/timeline
    [HttpGet("timeline")]
    public async Task<IActionResult> GetTimeline()
    {
        var patientIds = LinkedPatientIds;
        if (!patientIds.Any()) return BadRequest(ApiResponse<object>.Fail("No linked records."));
        var result = await _service.GetHealthTimelineAsync(patientIds);
        return Ok(result);
    }

    // GET api/health-records/documents
    [HttpGet("documents")]
    public async Task<IActionResult> GetDocuments()
    {
        var result = await _service.GetMyDocumentsAsync(MobileNumber);
        return Ok(result);
    }

    // GET api/health-records/documents/{id}
    [HttpGet("documents/{id:guid}")]
    public async Task<IActionResult> GetDocument(Guid id)
    {
        var result = await _service.GetDocumentWithFileAsync(MobileNumber, id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    // POST api/health-records/documents
    [HttpPost("documents")]
    public async Task<IActionResult> UploadDocument([FromBody] UploadDocumentRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _service.UploadDocumentAsync(MobileNumber, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // DELETE api/health-records/documents/{id}
    [HttpDelete("documents/{id:guid}")]
    public async Task<IActionResult> DeleteDocument(Guid id)
    {
        var result = await _service.DeleteDocumentAsync(MobileNumber, id);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }
}
