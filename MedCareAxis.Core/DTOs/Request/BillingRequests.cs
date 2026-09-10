using System.ComponentModel.DataAnnotations;

namespace MedCareAxis.Core.DTOs.Request;

public class CreateBillRequest
{
    [Required]
    public Guid PatientId { get; set; }
    public Guid? AppointmentId { get; set; }
    public Guid? DoctorId { get; set; }
    public int BillType { get; set; } = 0;
    [Required, MinLength(1)]
    public List<BillItemRequest> Items { get; set; } = new();
    [Range(typeof(decimal), "0", "999999999")]
    public decimal DiscountAmount { get; set; } = 0;
    [Range(typeof(decimal), "0", "100")]
    public decimal DiscountPercent { get; set; } = 0;
    public string? DiscountReason { get; set; }
    public int PaymentMode { get; set; } = 0;
    public bool IsPaid { get; set; } = false;
    public string? Notes { get; set; }
    public int InsuranceType { get; set; } = 0;
    [Range(typeof(decimal), "0", "999999999")]
    public decimal InsuranceCoveredAmount { get; set; } = 0;
}

public class BillItemRequest
{
    [Required]
    public string Description { get; set; } = string.Empty;
    public int ItemType { get; set; } = 0;
    [Range(typeof(decimal), "0", "999999999")]
    public decimal UnitPrice { get; set; }
    [Range(1, 10000)]
    public int Quantity { get; set; } = 1;
    [Range(typeof(decimal), "0", "100")]
    public decimal GstPercent { get; set; } = 0;
}

public class RecordPaymentRequest
{
    [Required]
    public Guid BillId { get; set; }
    [Range(typeof(decimal), "0.01", "999999999")]
    public decimal Amount { get; set; }
    public int PaymentMode { get; set; } = 0;
    public string? TransactionReference { get; set; }
    public string? Notes { get; set; }
}
