using ArogyaOS.Core.Enums;

namespace ArogyaOS.Core.Entities;

public class Subscription : BaseEntity
{
    // ─── Plan Details ──────────────────────────────────
    public Guid HospitalId { get; set; }
    public SubscriptionPlan Plan { get; set; } = SubscriptionPlan.Trial;
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Trial;

    // ─── Dates ─────────────────────────────────────────
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime? LastRenewalDate { get; set; }
    public DateTime? NextRenewalDate { get; set; }

    // ─── Pricing ───────────────────────────────────────
    public decimal MonthlyAmount { get; set; }
    public decimal? DiscountPercent { get; set; }
    public decimal FinalAmount { get; set; }
    public string Currency { get; set; } = "INR";

    // ─── Features ──────────────────────────────────────
    public bool HasOPD { get; set; } = true;
    public bool HasIPD { get; set; } = false;
    public bool HasLab { get; set; } = false;
    public bool HasRadiology { get; set; } = false;
    public bool HasPharmacy { get; set; } = false;
    public bool HasBilling { get; set; } = true;
    public bool HasHR { get; set; } = false;
    public bool HasReports { get; set; } = false;
    public bool HasPatientPortal { get; set; } = false;
    public bool HasAPI { get; set; } = false;
    public int MaxUsers { get; set; } = 5;
    public int MaxPatients { get; set; } = 500;
    public int MaxBeds { get; set; } = 50;

    // ─── Payment ───────────────────────────────────────
    public string? RazorpaySubscriptionId { get; set; }
    public string? RazorpayPaymentId { get; set; }
    public string? Notes { get; set; }

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public ICollection<SubscriptionPayment> Payments { get; set; }
        = new List<SubscriptionPayment>();
}

public class SubscriptionPayment : BaseEntity
{
    public Guid SubscriptionId { get; set; }
    public Guid HospitalId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaidOn { get; set; }
    public string? RazorpayPaymentId { get; set; }
    public string? InvoiceNumber { get; set; }
    public PaymentMode PaymentMode { get; set; }
    public string? Notes { get; set; }
    public Subscription? Subscription { get; set; }
}