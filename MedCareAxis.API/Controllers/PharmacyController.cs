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
public class PharmacyController : ControllerBase
{
    private readonly IPharmacyService _pharmacyService;

    public PharmacyController(IPharmacyService pharmacyService)
    {
        _pharmacyService = pharmacyService;
    }

    // ─── Medicines ─────────────────────────────────────────────────────────────

    [HttpGet("medicines")]
    public async Task<IActionResult> GetMedicines(
        [FromQuery] string? search,
        [FromQuery] bool? lowStockOnly,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _pharmacyService.GetMedicinesAsync(hospitalId, search, lowStockOnly, page, pageSize);
        return Ok(result);
    }

    [HttpGet("medicines/{id}")]
    public async Task<IActionResult> GetMedicineById(Guid id)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _pharmacyService.GetMedicineByIdAsync(id, hospitalId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("medicines")]
    public async Task<IActionResult> AddMedicine([FromBody] AddMedicineRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _pharmacyService.AddMedicineAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── Stock ─────────────────────────────────────────────────────────────────

    [HttpPost("stock")]
    public async Task<IActionResult> AddStock([FromBody] AddStockRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _pharmacyService.AddStockAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("medicines/{id}/batches")]
    public async Task<IActionResult> GetBatches(Guid id)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _pharmacyService.GetBatchesAsync(id, hospitalId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    // ─── Orders ────────────────────────────────────────────────────────────────

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders(
        [FromQuery] PharmacyOrderStatus? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _pharmacyService.GetOrdersAsync(hospitalId, status, search, page, pageSize);
        return Ok(result);
    }

    [HttpGet("orders/{id}")]
    public async Task<IActionResult> GetOrderById(Guid id)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _pharmacyService.GetOrderByIdAsync(id, hospitalId);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("orders")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateDispenseOrderRequest request)
    {
        if (IsExternal()) return StatusCode(403, new { success = false, message = "External partners cannot create dispense orders." });
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _pharmacyService.CreateOrderAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("orders/dispense")]
    public async Task<IActionResult> DispenseOrder([FromBody] DispenseOrderRequest request)
    {
        if (IsExternal()) return StatusCode(403, new { success = false, message = "External partners cannot dispense medicines." });
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _pharmacyService.DispenseOrderAsync(request, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── Transactions ──────────────────────────────────────────────────────────

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] Guid? medicineId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _pharmacyService.GetTransactionsAsync(hospitalId, medicineId, page, pageSize);
        return Ok(result);
    }

    // ─── Prescriptions Queue ───────────────────────────────────────────────────

    [HttpGet("prescriptions")]
    public async Task<IActionResult> GetPendingPrescriptions([FromQuery] string? search)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _pharmacyService.GetPendingPrescriptionsAsync(hospitalId, search);
        return Ok(result);
    }

    [HttpPost("prescriptions/{id}/dispense")]
    public async Task<IActionResult> MarkDispensed(Guid id)
    {
        if (IsExternal()) return StatusCode(403, new { success = false, message = "External partners cannot dispense medicines." });
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();
        var result = await _pharmacyService.MarkPrescriptionDispensedAsync(id, hospitalId);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private Guid GetHospitalId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == "hospitalId");
        if (claim == null || string.IsNullOrEmpty(claim.Value)) return Guid.Empty;
        return Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }

    private bool IsExternal() =>
        string.Equals(User.Claims.FirstOrDefault(c => c.Type == "isExternal")?.Value,
            "True", StringComparison.OrdinalIgnoreCase);
}
