using ArogyaOS.API.Filters;
using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Infrastructure.Data;
using ArogyaOS.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArogyaOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[SubscriptionCheck]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billingService;
    private readonly IPdfService _pdfService;
    private readonly AppDbContext _context;

    public BillingController(IBillingService billingService, IPdfService pdfService, AppDbContext context)
    {
        _billingService = billingService;
        _pdfService     = pdfService;
        _context        = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateTime? date,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _billingService.GetAllAsync(hospitalId, date, search, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var hospitalId = GetHospitalId();
        var result = await _billingService.GetByIdAsync(id, hospitalId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> DownloadPdf(Guid id)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        var bill = await _context.Bills
            .Include(b => b.Items)
            .Include(b => b.Patient)
            .Include(b => b.Hospital)
            .FirstOrDefaultAsync(b => b.Id == id && b.HospitalId == hospitalId);

        if (bill == null) return NotFound();

        var hospital = bill.Hospital
            ?? await _context.Hospitals.FindAsync(hospitalId);

        if (hospital == null) return NotFound();

        var pdfBytes = _pdfService.GenerateBillPdf(bill, hospital);
        return File(pdfBytes, "application/pdf", $"Bill-{bill.BillNumber}.pdf");
    }

    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetByPatient(
        Guid patientId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _billingService.GetByPatientAsync(patientId, hospitalId, page, pageSize);
        return Ok(result);
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyBills(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = GetHospitalId();
        var patientId  = GetPatientId();
        if (patientId == Guid.Empty) return Unauthorized();
        var result = await _billingService.GetByPatientAsync(patientId, hospitalId, page, pageSize);
        return Ok(result);
    }

    [HttpGet("my/{id}/pdf")]
    public async Task<IActionResult> DownloadMyBillPdf(Guid id)
    {
        var patientId  = GetPatientId();
        var hospitalId = GetHospitalId();
        if (patientId == Guid.Empty) return Unauthorized();

        var bill = await _context.Bills
            .Include(b => b.Items)
            .Include(b => b.Patient)
            .Include(b => b.Hospital)
            .FirstOrDefaultAsync(b => b.Id == id && b.PatientId == patientId);

        if (bill == null) return NotFound();

        var hospital = bill.Hospital
            ?? await _context.Hospitals.FindAsync(hospitalId);

        if (hospital == null) return NotFound();

        var pdfBytes = _pdfService.GenerateBillPdf(bill, hospital);
        return File(pdfBytes, "application/pdf", $"Bill-{bill.BillNumber}.pdf");
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBillRequest request)
    {
        if (IsExternal()) return StatusCode(403, new { success = false, message = "External partners cannot create bills." });
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _billingService.CreateBillAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("payment")]
    public async Task<IActionResult> RecordPayment([FromBody] RecordPaymentRequest request)
    {
        if (IsExternal()) return StatusCode(403, new { success = false, message = "External partners cannot record payments." });
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var hospitalId = GetHospitalId();
        var result = await _billingService.RecordPaymentAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    private bool IsExternal() =>
        string.Equals(User.Claims.FirstOrDefault(c => c.Type == "isExternal")?.Value,
            "True", StringComparison.OrdinalIgnoreCase);

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
