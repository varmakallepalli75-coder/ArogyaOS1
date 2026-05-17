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
public class LabController : ControllerBase
{
    private readonly ILabService _labService;

    public LabController(ILabService labService) { _labService = labService; }

    // GET /api/lab/tests?search=
    [HttpGet("tests")]
    public async Task<IActionResult> GetTests([FromQuery] string? search)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var result = await _labService.GetTestsAsync(hospitalId, search);
        return Ok(result);
    }

    // POST /api/lab/tests
    [HttpPost("tests")]
    public async Task<IActionResult> CreateTest([FromBody] CreateLabTestRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var result = await _labService.CreateTestAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // GET /api/lab/orders?status=&search=&date=&page=1&pageSize=20
    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders(
        [FromQuery] int? status,
        [FromQuery] string? search,
        [FromQuery] DateTime? date,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        LabOrderStatus? labStatus = status.HasValue ? (LabOrderStatus)status.Value : null;

        var result = await _labService.GetOrdersAsync(hospitalId, labStatus, search, date, page, pageSize);
        return Ok(result);
    }

    // GET /api/lab/orders/patient/{patientId}
    [HttpGet("orders/patient/{patientId}")]
    public async Task<IActionResult> GetByPatient(
        Guid patientId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _labService.GetByPatientAsync(patientId, hospitalId, page, pageSize);
        return Ok(result);
    }

    // GET /api/lab/orders/{id}
    [HttpGet("orders/{id}")]
    public async Task<IActionResult> GetOrderById(Guid id)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var result = await _labService.GetOrderByIdAsync(id, hospitalId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    // POST /api/lab/orders
    [HttpPost("orders")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateLabOrderRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var result = await _labService.CreateOrderAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // POST /api/lab/orders/collect-sample
    [HttpPost("orders/collect-sample")]
    public async Task<IActionResult> CollectSample([FromBody] CollectSampleRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var result = await _labService.CollectSampleAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // POST /api/lab/orders/results
    [HttpPost("orders/results")]
    public async Task<IActionResult> EnterResults([FromBody] EnterResultsRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var result = await _labService.EnterResultsAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // POST /api/lab/orders/report
    [HttpPost("orders/report")]
    public async Task<IActionResult> ReportOrder([FromBody] ReportLabOrderRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var result = await _labService.ReportOrderAsync(request, hospitalId);
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
