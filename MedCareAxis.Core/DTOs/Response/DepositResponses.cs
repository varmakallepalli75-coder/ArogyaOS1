namespace MedCareAxis.Core.DTOs.Response;

public class DepositResponse
{
    public Guid Id { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string UHID { get; set; } = string.Empty;
    public Guid? AdmissionId { get; set; }
    public string? IPDNumber { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public string? Notes { get; set; }
    public string? CollectedBy { get; set; }
    public DateTime DepositDate { get; set; }

    // Adjustment
    public bool IsAdjusted { get; set; }
    public decimal AdjustedAmount { get; set; }
    public Guid? AdjustedAgainstBillId { get; set; }

    // Refund
    public bool IsRefunded { get; set; }
    public decimal RefundedAmount { get; set; }
    public string? RefundMode { get; set; }
    public string? RefundTransactionId { get; set; }
    public string? RefundNotes { get; set; }
    public DateTime? RefundedAt { get; set; }
    public string? RefundedBy { get; set; }

    public decimal AvailableBalance => Amount - AdjustedAmount - RefundedAmount;
}

public class DepositSummaryResponse
{
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid? AdmissionId { get; set; }
    public string? IPDNumber { get; set; }
    public decimal TotalDeposited { get; set; }
    public decimal TotalAdjusted { get; set; }
    public decimal TotalRefunded { get; set; }
    public decimal AvailableBalance { get; set; }
    public List<DepositResponse> Deposits { get; set; } = new();
}
