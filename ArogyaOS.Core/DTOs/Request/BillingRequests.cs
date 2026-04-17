using System.ComponentModel.DataAnnotations;

namespace ArogyaOS.Core.DTOs.Request;

public class CreateBillRequest
{
    [Required]
    public Guid PatientId { get; set; }
    public Guid? AppointmentId { get; set; }
    public Guid? DoctorId { get; set; }
    public int BillType { get; set; } = 0;
    public List<BillItemRequest> Items { get; set; } = new();
    public decimal DiscountAmount { get; set; } = 0;
    public decimal DiscountPercent { get; set; } = 0;
    public string? DiscountReason { get; set; }
    public int PaymentMode { get; set; } = 0;
    public bool IsPaid { get; set; } = false;
    public string? Notes { get; set; }
    public int InsuranceType { get; set; } = 0;
    public decimal InsuranceCoveredAmount { get; set; } = 0;
}

public class BillItemRequest
{
    [Required]
    public string Description { get; set; } = string.Empty;
    public int ItemType { get; set; } = 0;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal GstPercent { get; set; } = 0;
}

public class RecordPaymentRequest
{
    [Required]
    public Guid BillId { get; set; }
    public decimal Amount { get; set; }
    public int PaymentMode { get; set; } = 0;
    public string? TransactionReference { get; set; }
    public string? Notes { get; set; }
}
