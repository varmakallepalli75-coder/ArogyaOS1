using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Core.DTOs.Response;
using ArogyaOS.Core.Entities;
using ArogyaOS.Core.Enums;
using ArogyaOS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArogyaOS.Infrastructure.Services;

public interface IDepositService
{
    Task<ApiResponse<DepositResponse>> CollectAsync(CollectDepositRequest req, Guid hospitalId, string user);
    Task<ApiResponse<DepositSummaryResponse>> GetSummaryAsync(Guid patientId, Guid? admissionId, Guid hospitalId);
    Task<ApiResponse<DepositResponse>> RefundAsync(RefundDepositRequest req, Guid hospitalId, string user);
    Task<ApiResponse<bool>> AdjustAgainstBillAsync(AdjustDepositRequest req, Guid hospitalId, string user);
    Task<ApiResponse<PagedResponse<DepositResponse>>> GetAllAsync(Guid hospitalId, DateTime? date, string? search, int page, int pageSize);
}

public class DepositService : IDepositService
{
    private readonly AppDbContext _context;
    private readonly IAuditService _audit;

    public DepositService(AppDbContext context, IAuditService audit)
    {
        _context = context;
        _audit = audit;
    }

    public async Task<ApiResponse<DepositResponse>> CollectAsync(CollectDepositRequest req, Guid hospitalId, string user)
    {
        if (req.Amount <= 0)
            return new ApiResponse<DepositResponse> { Success = false, Message = "Amount must be greater than zero" };

        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == req.PatientId && p.HospitalId == hospitalId);
        if (patient == null)
            return new ApiResponse<DepositResponse> { Success = false, Message = "Patient not found" };

        var count = await _context.PatientDeposits.Where(d => d.HospitalId == hospitalId).CountAsync();
        var receiptNumber = $"DEP-{DateTime.Now:yyyyMMdd}-{(count + 1):D4}";

        var deposit = new PatientDeposit
        {
            HospitalId = hospitalId,
            PatientId = req.PatientId,
            AdmissionId = req.AdmissionId,
            ReceiptNumber = receiptNumber,
            Amount = req.Amount,
            PaymentMode = req.PaymentMode,
            TransactionId = req.TransactionId,
            ChequeNumber = req.ChequeNumber,
            BankName = req.BankName,
            Notes = req.Notes,
            CollectedBy = user,
            DepositDate = DateTime.UtcNow,
            CreatedBy = user,
        };

        _context.PatientDeposits.Add(deposit);
        await _context.SaveChangesAsync();

        await _audit.LogAsync(hospitalId, "PatientDeposit", deposit.Id.ToString(), AuditAction.Create,
            $"Advance collected: ₹{req.Amount} ({receiptNumber}) from {patient.FullName}");

        return new ApiResponse<DepositResponse>
        {
            Success = true,
            Data = Map(deposit, patient.FullName, patient.UHID, null)
        };
    }

    public async Task<ApiResponse<DepositSummaryResponse>> GetSummaryAsync(Guid patientId, Guid? admissionId, Guid hospitalId)
    {
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == patientId && p.HospitalId == hospitalId);
        if (patient == null)
            return new ApiResponse<DepositSummaryResponse> { Success = false, Message = "Patient not found" };

        var query = _context.PatientDeposits
            .Include(d => d.Admission)
            .Where(d => d.HospitalId == hospitalId && d.PatientId == patientId && !d.IsDeleted);

        if (admissionId.HasValue)
            query = query.Where(d => d.AdmissionId == admissionId);

        var deposits = await query.OrderByDescending(d => d.DepositDate).ToListAsync();

        var admission = admissionId.HasValue
            ? await _context.Admissions.FirstOrDefaultAsync(a => a.Id == admissionId)
            : null;

        var totalDeposited = deposits.Sum(d => d.Amount);
        var totalAdjusted  = deposits.Sum(d => d.AdjustedAmount);
        var totalRefunded  = deposits.Sum(d => d.RefundedAmount);

        return new ApiResponse<DepositSummaryResponse>
        {
            Success = true,
            Data = new DepositSummaryResponse
            {
                PatientId = patientId,
                PatientName = patient.FullName,
                AdmissionId = admissionId,
                IPDNumber = admission?.IPDNumber,
                TotalDeposited = totalDeposited,
                TotalAdjusted = totalAdjusted,
                TotalRefunded = totalRefunded,
                AvailableBalance = totalDeposited - totalAdjusted - totalRefunded,
                Deposits = deposits.Select(d => Map(d, patient.FullName, patient.UHID, d.Admission?.IPDNumber)).ToList()
            }
        };
    }

    public async Task<ApiResponse<DepositResponse>> RefundAsync(RefundDepositRequest req, Guid hospitalId, string user)
    {
        var deposit = await _context.PatientDeposits
            .Include(d => d.Patient)
            .FirstOrDefaultAsync(d => d.Id == req.DepositId && d.HospitalId == hospitalId && !d.IsDeleted);

        if (deposit == null)
            return new ApiResponse<DepositResponse> { Success = false, Message = "Deposit not found" };

        var available = deposit.Amount - deposit.AdjustedAmount - deposit.RefundedAmount;
        if (req.RefundAmount > available)
            return new ApiResponse<DepositResponse>
            {
                Success = false,
                Message = $"Refund amount ₹{req.RefundAmount} exceeds available balance ₹{available}"
            };

        deposit.IsRefunded = true;
        deposit.RefundedAmount += req.RefundAmount;
        deposit.RefundMode = req.RefundMode;
        deposit.RefundTransactionId = req.RefundTransactionId;
        deposit.RefundNotes = req.RefundNotes;
        deposit.RefundedAt = DateTime.UtcNow;
        deposit.RefundedBy = user;
        deposit.UpdatedAt = DateTime.UtcNow;
        deposit.UpdatedBy = user;

        await _context.SaveChangesAsync();

        await _audit.LogAsync(hospitalId, "PatientDeposit", deposit.Id.ToString(), AuditAction.Update,
            $"Refund processed: ₹{req.RefundAmount} for {deposit.Patient?.FullName}");

        return new ApiResponse<DepositResponse>
        {
            Success = true,
            Data = Map(deposit, deposit.Patient?.FullName ?? "", deposit.Patient?.UHID ?? "", null)
        };
    }

    public async Task<ApiResponse<bool>> AdjustAgainstBillAsync(AdjustDepositRequest req, Guid hospitalId, string user)
    {
        var deposits = await _context.PatientDeposits
            .Where(d => d.HospitalId == hospitalId && d.AdmissionId == req.AdmissionId && !d.IsDeleted)
            .OrderBy(d => d.DepositDate)
            .ToListAsync();

        var bill = await _context.Bills
            .FirstOrDefaultAsync(b => b.Id == req.BillId && b.HospitalId == hospitalId);

        if (bill == null)
            return new ApiResponse<bool> { Success = false, Message = "Bill not found" };

        var totalAvailable = deposits.Sum(d => d.Amount - d.AdjustedAmount - d.RefundedAmount);
        var toAdjust = Math.Min(req.AdjustAmount, totalAvailable);

        if (toAdjust <= 0)
            return new ApiResponse<bool> { Success = false, Message = "No available advance balance to adjust" };

        var remaining = toAdjust;
        foreach (var deposit in deposits)
        {
            if (remaining <= 0) break;
            var available = deposit.Amount - deposit.AdjustedAmount - deposit.RefundedAmount;
            if (available <= 0) continue;

            var adjust = Math.Min(available, remaining);
            deposit.AdjustedAmount += adjust;
            deposit.IsAdjusted = true;
            deposit.AdjustedAgainstBillId = req.BillId;
            deposit.AdjustedAt = DateTime.UtcNow;
            deposit.UpdatedAt = DateTime.UtcNow;
            deposit.UpdatedBy = user;
            remaining -= adjust;
        }

        // Reflect adjustment on the bill
        bill.PaidAmount += toAdjust;
        if (bill.PaidAmount >= bill.TotalAmount)
            bill.Status = BillStatus.Paid;
        else if (bill.PaidAmount > 0)
            bill.Status = BillStatus.PartiallyPaid;

        bill.UpdatedAt = DateTime.UtcNow;
        bill.UpdatedBy = user;

        await _context.SaveChangesAsync();

        await _audit.LogAsync(hospitalId, "Bill", bill.Id.ToString(), AuditAction.Update,
            $"Advance adjusted: ₹{toAdjust} against bill {bill.BillNumber}");

        return new ApiResponse<bool> { Success = true, Data = true, Message = $"₹{toAdjust} advance adjusted against bill" };
    }

    public async Task<ApiResponse<PagedResponse<DepositResponse>>> GetAllAsync(
        Guid hospitalId, DateTime? date, string? search, int page, int pageSize)
    {
        var query = _context.PatientDeposits
            .Include(d => d.Patient)
            .Include(d => d.Admission)
            .Where(d => d.HospitalId == hospitalId && !d.IsDeleted);

        if (date.HasValue)
            query = query.Where(d => d.DepositDate.Date == date.Value.Date);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(d =>
                d.ReceiptNumber.Contains(search) ||
                (d.Patient != null && (
                    d.Patient.FirstName.Contains(search) ||
                    d.Patient.LastName.Contains(search) ||
                    d.Patient.UHID.Contains(search) ||
                    d.Patient.MobileNumber.Contains(search))));

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(d => d.DepositDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new ApiResponse<PagedResponse<DepositResponse>>
        {
            Success = true,
            Data = new PagedResponse<DepositResponse>
            {
                Items = items.Select(d => Map(d, d.Patient?.FullName ?? "", d.Patient?.UHID ?? "", d.Admission?.IPDNumber)).ToList(),
                TotalCount = total,
                Page = page,
                PageSize = pageSize
            }
        };
    }

    private static DepositResponse Map(PatientDeposit d, string patientName, string uhid, string? ipdNumber) =>
        new()
        {
            Id = d.Id,
            ReceiptNumber = d.ReceiptNumber,
            PatientId = d.PatientId,
            PatientName = patientName,
            UHID = uhid,
            AdmissionId = d.AdmissionId,
            IPDNumber = ipdNumber,
            Amount = d.Amount,
            PaymentMode = d.PaymentMode.ToString(),
            TransactionId = d.TransactionId,
            Notes = d.Notes,
            CollectedBy = d.CollectedBy,
            DepositDate = d.DepositDate,
            IsAdjusted = d.IsAdjusted,
            AdjustedAmount = d.AdjustedAmount,
            AdjustedAgainstBillId = d.AdjustedAgainstBillId,
            IsRefunded = d.IsRefunded,
            RefundedAmount = d.RefundedAmount,
            RefundMode = d.RefundMode?.ToString(),
            RefundTransactionId = d.RefundTransactionId,
            RefundNotes = d.RefundNotes,
            RefundedAt = d.RefundedAt,
            RefundedBy = d.RefundedBy,
        };
}
