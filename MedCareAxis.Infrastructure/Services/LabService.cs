using MedCareAxis.Core.DTOs.Request;
using MedCareAxis.Core.DTOs.Response;
using MedCareAxis.Core.Entities;
using MedCareAxis.Core.Enums;
using MedCareAxis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MedCareAxis.Infrastructure.Services;

public interface ILabService
{
    Task<ApiResponse<List<LabTestResponse>>> GetTestsAsync(Guid hospitalId, string? search);
    Task<ApiResponse<LabTestResponse>> CreateTestAsync(CreateLabTestRequest request, Guid hospitalId);
    Task<ApiResponse<PagedResponse<LabOrderListResponse>>> GetOrdersAsync(Guid hospitalId, LabOrderStatus? status, string? search, DateTime? date, int page, int pageSize);
    Task<ApiResponse<LabOrderDetailResponse>> GetOrderByIdAsync(Guid id, Guid hospitalId);
    Task<ApiResponse<LabOrderListResponse>> CreateOrderAsync(CreateLabOrderRequest request, Guid hospitalId);
    Task<ApiResponse<LabOrderListResponse>> CollectSampleAsync(CollectSampleRequest request, Guid hospitalId);
    Task<ApiResponse<LabOrderDetailResponse>> EnterResultsAsync(EnterResultsRequest request, Guid hospitalId);
    Task<ApiResponse<LabOrderDetailResponse>> ReportOrderAsync(ReportLabOrderRequest request, Guid hospitalId);
    Task<ApiResponse<PagedResponse<LabOrderListResponse>>> GetByPatientAsync(Guid patientId, Guid hospitalId, int page, int pageSize);
}

public class LabService : ILabService
{
    private readonly AppDbContext _context;
    private readonly IAuditService _audit;

    public LabService(AppDbContext context, IAuditService audit)
    {
        _context = context;
        _audit = audit;
    }

    // ─── Tests ─────────────────────────────────────────────────────────────

    public async Task<ApiResponse<List<LabTestResponse>>> GetTestsAsync(Guid hospitalId, string? search)
    {
        var query = _context.LabTests
            .Include(t => t.Parameters)
            .Where(t => t.HospitalId == hospitalId && t.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(t =>
                t.Name.Contains(search) ||
                t.Code.Contains(search));

        var tests = await query
            .OrderBy(t => t.Name)
            .ToListAsync();

        var result = tests.Select(MapTest).ToList();
        return ApiResponse<List<LabTestResponse>>.Ok(result);
    }

    public async Task<ApiResponse<LabTestResponse>> CreateTestAsync(CreateLabTestRequest request, Guid hospitalId)
    {
        var exists = await _context.LabTests
            .AnyAsync(t => t.HospitalId == hospitalId && t.Code == request.Code);

        if (exists)
            return ApiResponse<LabTestResponse>.Fail($"A lab test with code '{request.Code}' already exists.");

        var test = new LabTest
        {
            HospitalId = hospitalId,
            Code = request.Code,
            Name = request.Name,
            Department = request.Department,
            SampleType = (SampleType)request.SampleType,
            Description = request.Description,
            TurnAroundTimeHours = request.TurnAroundTimeHours,
            Price = request.Price,
            IsOutsourced = request.IsOutsourced,
            IsActive = true
        };

        _context.LabTests.Add(test);

        foreach (var p in request.Parameters)
        {
            _context.LabTestParameters.Add(new LabTestParameter
            {
                LabTestId = test.Id,
                ParameterName = p.ParameterName,
                Unit = p.Unit,
                NormalRangeMale = p.NormalRangeMale,
                NormalRangeFemale = p.NormalRangeFemale,
                NormalRangeChild = p.NormalRangeChild,
                Method = p.Method,
                SortOrder = p.SortOrder
            });
        }

        await _context.SaveChangesAsync();

        // Reload with parameters
        var saved = await _context.LabTests
            .Include(t => t.Parameters)
            .FirstAsync(t => t.Id == test.Id);

        return ApiResponse<LabTestResponse>.Ok(MapTest(saved), "Lab test created successfully.");
    }

    // ─── Orders ────────────────────────────────────────────────────────────

    public async Task<ApiResponse<PagedResponse<LabOrderListResponse>>> GetOrdersAsync(
        Guid hospitalId, LabOrderStatus? status, string? search, DateTime? date, int page, int pageSize)
    {
        var query = _context.LabOrders
            .Include(o => o.Patient)
            .Include(o => o.Doctor)
            .Include(o => o.Items)
            .Where(o => o.HospitalId == hospitalId);

        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);

        if (date.HasValue)
            query = query.Where(o => o.OrderedAt.Date == date.Value.Date);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(o =>
                o.OrderNumber.Contains(search) ||
                (o.Patient != null && (
                    o.Patient.FirstName.Contains(search) ||
                    o.Patient.LastName.Contains(search) ||
                    o.Patient.UHID.Contains(search) ||
                    o.Patient.MobileNumber.Contains(search))));

        var total = await query.CountAsync();

        var orders = await query
            .OrderByDescending(o => o.OrderedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = orders.Select(MapOrderList).ToList();

        return ApiResponse<PagedResponse<LabOrderListResponse>>.Ok(new PagedResponse<LabOrderListResponse>
        {
            Items = result,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ApiResponse<PagedResponse<LabOrderListResponse>>> GetByPatientAsync(
        Guid patientId, Guid hospitalId, int page, int pageSize)
    {
        var query = _context.LabOrders
            .Include(o => o.Patient)
            .Include(o => o.Doctor)
            .Include(o => o.Items)
            .Where(o => o.HospitalId == hospitalId && o.PatientId == patientId)
            .OrderByDescending(o => o.OrderedAt);

        var total = await query.CountAsync();
        var orders = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return ApiResponse<PagedResponse<LabOrderListResponse>>.Ok(new PagedResponse<LabOrderListResponse>
        {
            Items = orders.Select(MapOrderList).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    public async Task<ApiResponse<LabOrderDetailResponse>> GetOrderByIdAsync(Guid id, Guid hospitalId)
    {
        var order = await _context.LabOrders
            .Include(o => o.Patient)
            .Include(o => o.Doctor)
            .Include(o => o.Items)
                .ThenInclude(i => i.LabTest)
                    .ThenInclude(t => t!.Parameters)
            .Include(o => o.Items)
                .ThenInclude(i => i.Results)
                    .ThenInclude(r => r.LabTestParameter)
            .FirstOrDefaultAsync(o => o.Id == id && o.HospitalId == hospitalId);

        if (order == null)
            return ApiResponse<LabOrderDetailResponse>.Fail("Lab order not found.");

        return ApiResponse<LabOrderDetailResponse>.Ok(MapOrderDetail(order));
    }

    public async Task<ApiResponse<LabOrderListResponse>> CreateOrderAsync(CreateLabOrderRequest request, Guid hospitalId)
    {
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == request.PatientId && p.HospitalId == hospitalId);
        if (patient == null)
            return ApiResponse<LabOrderListResponse>.Fail("Patient not found.");

        var doctor = await _context.Doctors
            .FirstOrDefaultAsync(d => d.Id == request.DoctorId && d.HospitalId == hospitalId);
        if (doctor == null)
            return ApiResponse<LabOrderListResponse>.Fail("Doctor not found.");

        if (!request.TestIds.Any())
            return ApiResponse<LabOrderListResponse>.Fail("At least one test must be selected.");

        var tests = await _context.LabTests
            .Where(t => request.TestIds.Contains(t.Id) && t.HospitalId == hospitalId && t.IsActive)
            .ToListAsync();

        if (tests.Count != request.TestIds.Count)
            return ApiResponse<LabOrderListResponse>.Fail("One or more selected tests were not found or are inactive.");

        var count = await _context.LabOrders
            .Where(o => o.HospitalId == hospitalId)
            .CountAsync();

        var orderNumber = $"LAB-{DateTime.Now:yyyyMMdd}-{(count + 1):D4}";

        var order = new LabOrder
        {
            HospitalId = hospitalId,
            OrderNumber = orderNumber,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            AdmissionId = request.AdmissionId,
            OPDVisitId = request.OPDVisitId,
            OrderedAt = DateTime.UtcNow,
            Status = LabOrderStatus.Ordered,
            Priority = (PriorityLevel)request.Priority,
            ClinicalNotes = request.ClinicalNotes
        };

        _context.LabOrders.Add(order);

        foreach (var test in tests)
        {
            _context.LabOrderItems.Add(new LabOrderItem
            {
                LabOrderId = order.Id,
                LabTestId = test.Id,
                Status = LabOrderStatus.Ordered,
                Price = test.Price
            });
        }

        await _context.SaveChangesAsync();

        // Reload for response
        var saved = await _context.LabOrders
            .Include(o => o.Patient)
            .Include(o => o.Doctor)
            .Include(o => o.Items)
            .FirstAsync(o => o.Id == order.Id);

        return ApiResponse<LabOrderListResponse>.Ok(MapOrderList(saved), "Lab order created successfully.");
    }

    public async Task<ApiResponse<LabOrderListResponse>> CollectSampleAsync(CollectSampleRequest request, Guid hospitalId)
    {
        var order = await _context.LabOrders
            .Include(o => o.Patient)
            .Include(o => o.Doctor)
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId && o.HospitalId == hospitalId);

        if (order == null)
            return ApiResponse<LabOrderListResponse>.Fail("Lab order not found.");

        if (order.Status == LabOrderStatus.Cancelled)
            return ApiResponse<LabOrderListResponse>.Fail("Cannot collect sample for a cancelled order.");

        order.Status = LabOrderStatus.SampleCollected;
        order.SampleCollectedAt = DateTime.UtcNow;
        order.SampleBarcode = request.SampleBarcode;
        order.SampleCollectedBy = request.CollectedBy;
        order.UpdatedAt = DateTime.UtcNow;

        // Update all items status
        foreach (var item in order.Items)
        {
            item.Status = LabOrderStatus.SampleCollected;
            item.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return ApiResponse<LabOrderListResponse>.Ok(MapOrderList(order), "Sample collected successfully.");
    }

    public async Task<ApiResponse<LabOrderDetailResponse>> EnterResultsAsync(EnterResultsRequest request, Guid hospitalId)
    {
        var order = await _context.LabOrders
            .Include(o => o.Patient)
            .Include(o => o.Doctor)
            .Include(o => o.Items)
                .ThenInclude(i => i.LabTest)
                    .ThenInclude(t => t!.Parameters)
            .Include(o => o.Items)
                .ThenInclude(i => i.Results)
                    .ThenInclude(r => r.LabTestParameter)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId && o.HospitalId == hospitalId);

        if (order == null)
            return ApiResponse<LabOrderDetailResponse>.Fail("Lab order not found.");

        if (order.Status == LabOrderStatus.Cancelled)
            return ApiResponse<LabOrderDetailResponse>.Fail("Cannot enter results for a cancelled order.");

        bool anyAbnormal = false;

        foreach (var entry in request.Results)
        {
            var item = order.Items.FirstOrDefault(i => i.Id == entry.LabOrderItemId);
            if (item == null) continue;

            // Get normal range from the parameter
            var param = await _context.LabTestParameters
                .FirstOrDefaultAsync(p => p.Id == entry.LabTestParameterId);

            string? normalRange = param?.NormalRangeMale ?? param?.NormalRangeFemale;

            // Find existing result or create new
            var existing = item.Results.FirstOrDefault(r =>
                r.LabOrderItemId == entry.LabOrderItemId &&
                r.LabTestParameterId == entry.LabTestParameterId);

            if (existing != null)
            {
                existing.Value = entry.Value;
                existing.IsAbnormal = entry.IsAbnormal;
                existing.IsHigh = entry.IsHigh;
                existing.IsLow = entry.IsLow;
                existing.Notes = entry.Notes;
                existing.NormalRange = normalRange;
                existing.Unit = param?.Unit;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.LabResults.Add(new LabResult
                {
                    LabOrderItemId = entry.LabOrderItemId,
                    LabTestParameterId = entry.LabTestParameterId,
                    Value = entry.Value,
                    Unit = param?.Unit,
                    NormalRange = normalRange,
                    IsAbnormal = entry.IsAbnormal,
                    IsHigh = entry.IsHigh,
                    IsLow = entry.IsLow,
                    Notes = entry.Notes
                });
            }

            if (entry.IsAbnormal) anyAbnormal = true;

            // Update item status
            item.Status = LabOrderStatus.ResultAvailable;
            item.UpdatedAt = DateTime.UtcNow;
        }

        order.Status = LabOrderStatus.ResultAvailable;
        order.IsAbnormal = anyAbnormal;
        order.TechnicianNotes = request.TechnicianNotes;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Reload fresh
        return await GetOrderByIdAsync(order.Id, hospitalId);
    }

    public async Task<ApiResponse<LabOrderDetailResponse>> ReportOrderAsync(ReportLabOrderRequest request, Guid hospitalId)
    {
        var order = await _context.LabOrders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId && o.HospitalId == hospitalId);

        if (order == null)
            return ApiResponse<LabOrderDetailResponse>.Fail("Lab order not found.");

        if (order.Status == LabOrderStatus.Cancelled)
            return ApiResponse<LabOrderDetailResponse>.Fail("Cannot report a cancelled order.");

        order.Status = LabOrderStatus.Reported;
        order.ReportedAt = DateTime.UtcNow;
        order.ReportedBy = request.ReportedBy;
        order.TechnicianNotes = request.TechnicianNotes;
        order.UpdatedAt = DateTime.UtcNow;

        // Update all items
        var items = await _context.LabOrderItems
            .Where(i => i.LabOrderId == order.Id)
            .ToListAsync();

        foreach (var item in items)
        {
            item.Status = LabOrderStatus.Reported;
            item.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        await _audit.LogAsync(hospitalId, "LabOrder", order.Id.ToString(), AuditAction.Update,
            $"Lab order reported by {request.ReportedBy}");

        return await GetOrderByIdAsync(order.Id, hospitalId);
    }

    // ─── Mappers ───────────────────────────────────────────────────────────

    private static LabTestResponse MapTest(LabTest t) => new()
    {
        Id = t.Id,
        Code = t.Code,
        Name = t.Name,
        Department = t.Department,
        SampleType = t.SampleType.ToString(),
        Description = t.Description,
        TurnAroundTimeHours = t.TurnAroundTimeHours,
        Price = t.Price,
        IsActive = t.IsActive,
        IsOutsourced = t.IsOutsourced,
        Parameters = t.Parameters
            .OrderBy(p => p.SortOrder)
            .Select(p => new LabTestParameterResponse
            {
                Id = p.Id,
                ParameterName = p.ParameterName,
                Unit = p.Unit,
                NormalRangeMale = p.NormalRangeMale,
                NormalRangeFemale = p.NormalRangeFemale,
                NormalRangeChild = p.NormalRangeChild,
                Method = p.Method,
                SortOrder = p.SortOrder
            }).ToList()
    };

    private static LabOrderListResponse MapOrderList(LabOrder o) => new()
    {
        Id = o.Id,
        OrderNumber = o.OrderNumber,
        PatientId = o.PatientId,
        PatientName = o.Patient?.FullName ?? string.Empty,
        PatientUHID = o.Patient?.UHID ?? string.Empty,
        DoctorName = o.Doctor?.FullName ?? string.Empty,
        OrderedAt = o.OrderedAt,
        Status = o.Status.ToString(),
        Priority = o.Priority.ToString(),
        IsAbnormal = o.IsAbnormal,
        TestCount = o.Items.Count,
        TotalAmount = o.Items.Sum(i => i.Price),
        SampleCollectedAt = o.SampleCollectedAt,
        ReportedAt = o.ReportedAt
    };

    private static LabOrderDetailResponse MapOrderDetail(LabOrder o) => new()
    {
        Id = o.Id,
        OrderNumber = o.OrderNumber,
        PatientId = o.PatientId,
        PatientName = o.Patient?.FullName ?? string.Empty,
        PatientUHID = o.Patient?.UHID ?? string.Empty,
        DoctorName = o.Doctor?.FullName ?? string.Empty,
        OrderedAt = o.OrderedAt,
        Status = o.Status.ToString(),
        Priority = o.Priority.ToString(),
        IsAbnormal = o.IsAbnormal,
        TestCount = o.Items.Count,
        TotalAmount = o.Items.Sum(i => i.Price),
        SampleCollectedAt = o.SampleCollectedAt,
        ReportedAt = o.ReportedAt,
        ClinicalNotes = o.ClinicalNotes,
        SampleBarcode = o.SampleBarcode,
        SampleCollectedBy = o.SampleCollectedBy,
        ReportedBy = o.ReportedBy,
        TechnicianNotes = o.TechnicianNotes,
        AdmissionId = o.AdmissionId,
        OPDVisitId = o.OPDVisitId,
        Items = o.Items.Select(i => new LabOrderItemResponse
        {
            Id = i.Id,
            LabTestId = i.LabTestId,
            TestCode = i.LabTest?.Code ?? string.Empty,
            TestName = i.LabTest?.Name ?? string.Empty,
            Status = i.Status.ToString(),
            Price = i.Price,
            Results = i.Results.Select(r => new LabResultResponse
            {
                Id = r.Id,
                LabTestParameterId = r.LabTestParameterId,
                ParameterName = r.LabTestParameter?.ParameterName ?? string.Empty,
                Value = r.Value,
                Unit = r.Unit,
                NormalRange = r.NormalRange,
                IsAbnormal = r.IsAbnormal,
                IsHigh = r.IsHigh,
                IsLow = r.IsLow,
                Notes = r.Notes
            }).ToList()
        }).ToList()
    };
}
