using MedCareAxis.Core.Interfaces;
using MedCareAxis.Core.Enums;

namespace MedCareAxis.Core.Entities;

public class Bill : BaseEntity, ITenantEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Details ───────────────────────────────────────
    public string BillNumber { get; set; } = string.Empty; // e.g. BILL-2024-00001
    public Guid PatientId { get; set; }
    public Guid? OPDVisitId { get; set; }
    public Guid? AdmissionId { get; set; }
    public DateTime BillDate { get; set; } = DateTime.UtcNow;
    public BillStatus Status { get; set; } = BillStatus.Draft;
    public PatientType PatientType { get; set; }

    // ─── Amounts ───────────────────────────────────────
    public decimal SubTotal { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxableAmount { get; set; }
    public decimal GSTAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DueAmount => TotalAmount - PaidAmount;
    public decimal? RefundAmount { get; set; }

    // ─── Insurance ─────────────────────────────────────
    public InsuranceType InsuranceType { get; set; } = InsuranceType.None;
    public string? InsurancePolicyNumber { get; set; }
    public string? InsuranceAuthCode { get; set; }
    public decimal? InsuranceClaimAmount { get; set; }
    public decimal? InsuranceApprovedAmount { get; set; }
    public string? TPAName { get; set; }

    // ─── Ayushman Bharat ───────────────────────────────
    public bool IsAyushman { get; set; } = false;
    public string? AyushmanCardNumber { get; set; }
    public string? AyushmanClaimId { get; set; }
    public decimal? AyushmanApprovedAmount { get; set; }

    // ─── Notes ─────────────────────────────────────────
    public string? Notes { get; set; }
    public string? GeneratedBy { get; set; }
    public DateTime? GeneratedAt { get; set; }

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public Patient? Patient { get; set; }
    public OPDVisit? OPDVisit { get; set; }
    public Admission? Admission { get; set; }
    public ICollection<BillItem> Items { get; set; }
        = new List<BillItem>();
    public ICollection<Payment> Payments { get; set; }
        = new List<Payment>();
}

public class BillItem : BaseEntity
{
    public Guid BillId { get; set; }
    public ServiceCategory Category { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? ServiceCode { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal GSTPercent { get; set; }
    public decimal GSTAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public Bill? Bill { get; set; }
}

public class Payment : BaseEntity, ITenantEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Details ───────────────────────────────────────
    public string PaymentNumber { get; set; } = string.Empty; // e.g. PAY-2024-00001
    public Guid BillId { get; set; }
    public Guid PatientId { get; set; }
    public decimal Amount { get; set; }
    public PaymentMode PaymentMode { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

    // ─── Reference ─────────────────────────────────────
    public string? TransactionId { get; set; }         // UPI/Card transaction ID
    public string? ChequeNumber { get; set; }
    public string? BankName { get; set; }
    public string? RazorpayPaymentId { get; set; }

    // ─── Status ────────────────────────────────────────
    public bool IsRefund { get; set; } = false;
    public string? ReceivedBy { get; set; }
    public string? Notes { get; set; }

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public Bill? Bill { get; set; }
    public Patient? Patient { get; set; }
}