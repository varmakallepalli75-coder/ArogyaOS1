using MedCareAxis.Core.Interfaces;
using MedCareAxis.Core.Enums;

namespace MedCareAxis.Core.Entities;

public class PatientDeposit : BaseEntity, ITenantEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Links ─────────────────────────────────────────
    public Guid PatientId { get; set; }
    public Guid? AdmissionId { get; set; }       // null for OPD advance

    // ─── Receipt ───────────────────────────────────────
    public string ReceiptNumber { get; set; } = string.Empty;  // DEP-20250101-0001
    public decimal Amount { get; set; }
    public PaymentMode PaymentMode { get; set; }
    public string? TransactionId { get; set; }
    public string? ChequeNumber { get; set; }
    public string? BankName { get; set; }
    public string? Notes { get; set; }
    public string? CollectedBy { get; set; }
    public DateTime DepositDate { get; set; } = DateTime.UtcNow;

    // ─── Adjustment against bill ───────────────────────
    public bool IsAdjusted { get; set; } = false;
    public decimal AdjustedAmount { get; set; } = 0;
    public Guid? AdjustedAgainstBillId { get; set; }
    public DateTime? AdjustedAt { get; set; }

    // ─── Refund ────────────────────────────────────────
    public bool IsRefunded { get; set; } = false;
    public decimal RefundedAmount { get; set; } = 0;
    public PaymentMode? RefundMode { get; set; }
    public string? RefundTransactionId { get; set; }
    public string? RefundNotes { get; set; }
    public DateTime? RefundedAt { get; set; }
    public string? RefundedBy { get; set; }

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public Patient? Patient { get; set; }
    public Admission? Admission { get; set; }
}
