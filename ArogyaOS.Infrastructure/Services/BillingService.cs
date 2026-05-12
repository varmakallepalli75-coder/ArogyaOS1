using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Core.DTOs.Response;
using ArogyaOS.Core.Entities;
using ArogyaOS.Core.Enums;
using ArogyaOS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArogyaOS.Infrastructure.Services;

public interface IBillingService
{
    Task<ApiResponse<BillResponse>> CreateBillAsync(CreateBillRequest request, Guid hospitalId);
    Task<ApiResponse<PagedResponse<BillListResponse>>> GetAllAsync(Guid hospitalId, DateTime? date, string? search, int page, int pageSize);
    Task<ApiResponse<BillResponse>> GetByIdAsync(Guid id, Guid hospitalId);
    Task<ApiResponse<BillResponse>> RecordPaymentAsync(RecordPaymentRequest request, Guid hospitalId);
    Task<ApiResponse<PagedResponse<BillListResponse>>> GetByPatientAsync(Guid patientId, Guid hospitalId, int page, int pageSize);
}

public class BillingService : IBillingService
{
    private readonly AppDbContext _context;
    private readonly IAuditService _audit;

    public BillingService(AppDbContext context, IAuditService audit)
    {
        _context = context;
        _audit = audit;
    }

    public async Task<ApiResponse<BillResponse>> CreateBillAsync(CreateBillRequest request, Guid hospitalId)
    {
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == request.PatientId && p.HospitalId == hospitalId);
        if (patient == null)
            return ApiResponse<BillResponse>.Fail("Patient not found");

        var count = await _context.Bills.Where(b => b.HospitalId == hospitalId).CountAsync();
        var billNumber = $"BILL-{DateTime.Now:yyyyMMdd}-{(count + 1):D4}";

        var subTotal = request.Items.Sum(i => i.UnitPrice * i.Quantity);
        var discountAmount = request.DiscountAmount > 0
            ? request.DiscountAmount
            : (subTotal * request.DiscountPercent / 100);
        var gstAmount = request.Items.Sum(i => i.UnitPrice * i.Quantity * i.GstPercent / 100);
        var totalAmount = subTotal - discountAmount + gstAmount - request.InsuranceCoveredAmount;

        var bill = new Bill
        {
            HospitalId = hospitalId,
            BillNumber = billNumber,
            PatientId = request.PatientId,
            BillDate = DateTime.UtcNow,
            Status = BillStatus.Generated,
            SubTotal = subTotal,
            DiscountAmount = discountAmount,
            DiscountPercent = request.DiscountPercent,
            GSTAmount = gstAmount,
            TotalAmount = totalAmount,
            PaidAmount = request.IsPaid ? totalAmount : 0,
            InsuranceType = (InsuranceType)request.InsuranceType,
            InsuranceClaimAmount = request.InsuranceCoveredAmount,
            Notes = request.Notes,
            GeneratedAt = DateTime.UtcNow
        };

        _context.Bills.Add(bill);

        foreach (var item in request.Items)
        {
            _context.BillItems.Add(new BillItem
            {
                BillId = bill.Id,
                Description = item.Description,
                Category = ServiceCategory.Consultation,
                UnitPrice = item.UnitPrice,
                Quantity = item.Quantity,
                GSTPercent = item.GstPercent,
                GSTAmount = item.UnitPrice * item.Quantity * item.GstPercent / 100,
                TotalAmount = item.UnitPrice * item.Quantity
            });
        }

        if (request.IsPaid && totalAmount > 0)
        {
            var payCount = await _context.Payments.Where(p => p.HospitalId == hospitalId).CountAsync();
            _context.Payments.Add(new Payment
            {
                HospitalId = hospitalId,
                BillId = bill.Id,
                PatientId = request.PatientId,
                PaymentNumber = $"PAY-{DateTime.Now:yyyyMMdd}-{(payCount + 1):D4}",
                Amount = totalAmount,
                PaymentMode = (PaymentMode)request.PaymentMode,
                PaymentDate = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        await _audit.LogAsync(hospitalId, "Bill", bill.Id.ToString(), AuditAction.Create,
            $"Bill {billNumber} created for patient {patient.FullName} — ₹{totalAmount:F2}");

        return await GetByIdAsync(bill.Id, hospitalId);
    }

    public async Task<ApiResponse<PagedResponse<BillListResponse>>> GetAllAsync(
        Guid hospitalId, DateTime? date, string? search, int page, int pageSize)
    {
        var query = _context.Bills
            .Include(b => b.Patient)
            .Where(b => b.HospitalId == hospitalId);

        if (date.HasValue)
            query = query.Where(b => b.BillDate.Date == date.Value.Date);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(b =>
                b.BillNumber.Contains(search) ||
                (b.Patient != null && (
                    b.Patient.FirstName.Contains(search) ||
                    b.Patient.LastName.Contains(search) ||
                    b.Patient.UHID.Contains(search) ||
                    b.Patient.MobileNumber.Contains(search))));

        var total = await query.CountAsync();
        var bills = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = bills.Select(b => new BillListResponse
        {
            Id = b.Id,
            BillNumber = b.BillNumber,
            PatientName = b.Patient?.FullName ?? "",
            PatientUHID = b.Patient?.UHID ?? "",
            BillType = b.Status.ToString(),
            TotalAmount = b.TotalAmount,
            PaidAmount = b.PaidAmount,
            DueAmount = b.DueAmount,
            PaymentStatus = b.PaidAmount >= b.TotalAmount ? "Paid" :
                b.PaidAmount > 0 ? "PartiallyPaid" : "Pending",
            PaymentMode = "",
            CreatedAt = b.CreatedAt
        }).ToList();

        return ApiResponse<PagedResponse<BillListResponse>>.Ok(
            new PagedResponse<BillListResponse>
            {
                Items = result,
                TotalCount = total,
                Page = page,
                PageSize = pageSize
            });
    }

    public async Task<ApiResponse<BillResponse>> GetByIdAsync(Guid id, Guid hospitalId)
    {
        var bill = await _context.Bills
            .Include(b => b.Patient)
            .Include(b => b.Items)
            .Include(b => b.Payments)
            .FirstOrDefaultAsync(b => b.Id == id && b.HospitalId == hospitalId);

        if (bill == null)
            return ApiResponse<BillResponse>.Fail("Bill not found");

        var response = MapBill(bill);

        // Attach deposit summary for IPD bills
        if (bill.AdmissionId.HasValue)
        {
            var deposits = await _context.PatientDeposits
                .Where(d => d.HospitalId == hospitalId && d.AdmissionId == bill.AdmissionId && !d.IsDeleted)
                .ToListAsync();
            response.AdvanceDeposited  = deposits.Sum(d => d.Amount);
            response.AdvanceAdjusted   = deposits.Sum(d => d.AdjustedAmount);
            response.AdvanceAvailable  = response.AdvanceDeposited - response.AdvanceAdjusted - deposits.Sum(d => d.RefundedAmount);
        }

        return ApiResponse<BillResponse>.Ok(response);
    }

    public async Task<ApiResponse<BillResponse>> RecordPaymentAsync(
        RecordPaymentRequest request, Guid hospitalId)
    {
        var bill = await _context.Bills
            .Include(b => b.Patient)
            .Include(b => b.Items)
            .Include(b => b.Payments)
            .FirstOrDefaultAsync(b => b.Id == request.BillId && b.HospitalId == hospitalId);

        if (bill == null)
            return ApiResponse<BillResponse>.Fail("Bill not found");

        if (bill.DueAmount <= 0)
            return ApiResponse<BillResponse>.Fail("Bill is already fully paid");

        var amount = Math.Min(request.Amount, bill.DueAmount);
        var payCount = await _context.Payments.Where(p => p.HospitalId == hospitalId).CountAsync();

        _context.Payments.Add(new Payment
        {
            HospitalId = hospitalId,
            BillId = bill.Id,
            PatientId = bill.PatientId,
            PaymentNumber = $"PAY-{DateTime.Now:yyyyMMdd}-{(payCount + 1):D4}",
            Amount = amount,
            PaymentMode = (PaymentMode)request.PaymentMode,
            TransactionId = request.TransactionReference,
            Notes = request.Notes,
            PaymentDate = DateTime.UtcNow
        });

        bill.PaidAmount += amount;
        if (bill.PaidAmount >= bill.TotalAmount)
            bill.Status = BillStatus.Paid;
        bill.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _audit.LogAsync(hospitalId, "Bill", bill.Id.ToString(), AuditAction.Update,
            $"Payment of ₹{amount:N2} recorded via {(PaymentMode)request.PaymentMode} for bill {bill.BillNumber}");

        return ApiResponse<BillResponse>.Ok(MapBill(bill), "Payment recorded successfully!");
    }

    private static BillResponse MapBill(Bill b) => new()
    {
        Id = b.Id,
        BillNumber = b.BillNumber,
        PatientId = b.PatientId,
        PatientName = b.Patient?.FullName ?? "",
        PatientUHID = b.Patient?.UHID ?? "",
        PatientMobile = b.Patient?.MobileNumber ?? "",
        BillType = b.Status.ToString(),
        Items = b.Items.Select(i => new BillItemResponse
        {
            Id = i.Id,
            Description = i.Description,
            ItemType = i.Category.ToString(),
            UnitPrice = i.UnitPrice,
            Quantity = i.Quantity,
            GstPercent = i.GSTPercent,
            GstAmount = i.GSTAmount,
            TotalPrice = i.TotalAmount
        }).ToList(),
        SubTotal = b.SubTotal,
        DiscountAmount = b.DiscountAmount,
        DiscountPercent = b.DiscountPercent,
        GstAmount = b.GSTAmount,
        TotalAmount = b.TotalAmount,
        PaidAmount = b.PaidAmount,
        DueAmount = b.DueAmount,
        PaymentStatus = b.PaidAmount >= b.TotalAmount ? "Paid" :
            b.PaidAmount > 0 ? "PartiallyPaid" : "Pending",
        PaymentMode = "",
        InsuranceType = b.InsuranceType.ToString(),
        InsuranceCoveredAmount = b.InsuranceClaimAmount ?? 0,
        Notes = b.Notes,
        Payments = b.Payments.Select(p => new PaymentResponse
        {
            Id = p.Id,
            Amount = p.Amount,
            PaymentMode = p.PaymentMode.ToString(),
            TransactionReference = p.TransactionId,
            PaidAt = p.PaymentDate
        }).ToList(),
        CreatedAt = b.CreatedAt
    };


    public async Task<ApiResponse<PagedResponse<BillListResponse>>> GetByPatientAsync(
        Guid patientId, Guid hospitalId, int page, int pageSize)
    {
        var query = _context.Bills
            .Include(b => b.Patient)
            .Where(b => b.HospitalId == hospitalId && b.PatientId == patientId)
            .OrderByDescending(b => b.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BillListResponse
            {
                Id = b.Id,
                BillNumber = b.BillNumber,
                PatientName = b.Patient != null ? b.Patient.FullName : "",
                PatientUHID = b.Patient != null ? b.Patient.UHID : "",
                TotalAmount = b.TotalAmount,
                PaidAmount = b.PaidAmount,
                DueAmount = b.DueAmount,
                PaymentStatus = b.PaidAmount >= b.TotalAmount ? "Paid" : b.PaidAmount > 0 ? "PartiallyPaid" : "Pending",
                BillType = b.PatientType.ToString(),
                CreatedAt = b.CreatedAt
            }).ToListAsync();

        return ApiResponse<PagedResponse<BillListResponse>>.Ok(
            new PagedResponse<BillListResponse>
            {
                Items = items,
                TotalCount = total,
                Page = page,
                PageSize = pageSize
            });
    }

}
