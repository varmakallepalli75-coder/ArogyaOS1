namespace ArogyaOS.Core.DTOs.Response;

public class BillResponse
{
    public Guid Id { get; set; }
    public string BillNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientUHID { get; set; } = string.Empty;
    public string PatientMobile { get; set; } = string.Empty;
    public string? DoctorName { get; set; }
    public string BillType { get; set; } = string.Empty;
    public List<BillItemResponse> Items { get; set; } = new();
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal DiscountPercent { get; set; }
    public string? DiscountReason { get; set; }
    public decimal GstAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DueAmount { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    public string PaymentMode { get; set; } = string.Empty;

    // Advance deposit info (populated for IPD bills)
    public decimal AdvanceDeposited { get; set; }
    public decimal AdvanceAdjusted { get; set; }
    public decimal AdvanceAvailable { get; set; }

    public string InsuranceType { get; set; } = string.Empty;
    public decimal InsuranceCoveredAmount { get; set; }
    public string? Notes { get; set; }
    public List<PaymentResponse> Payments { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class BillItemResponse
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public string ItemType { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal GstPercent { get; set; }
    public decimal GstAmount { get; set; }
    public decimal TotalPrice { get; set; }
}

public class PaymentResponse
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMode { get; set; } = string.Empty;
    public string? TransactionReference { get; set; }
    public DateTime PaidAt { get; set; }
}

public class BillListResponse
{
    public Guid Id { get; set; }
    public string BillNumber { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string PatientUHID { get; set; } = string.Empty;
    public string BillType { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DueAmount { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    public string PaymentMode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
