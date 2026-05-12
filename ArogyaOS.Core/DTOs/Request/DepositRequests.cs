using ArogyaOS.Core.Enums;

namespace ArogyaOS.Core.DTOs.Request;

public class CollectDepositRequest
{
    public Guid PatientId { get; set; }
    public Guid? AdmissionId { get; set; }
    public decimal Amount { get; set; }
    public PaymentMode PaymentMode { get; set; }
    public string? TransactionId { get; set; }
    public string? ChequeNumber { get; set; }
    public string? BankName { get; set; }
    public string? Notes { get; set; }
}

public class RefundDepositRequest
{
    public Guid DepositId { get; set; }
    public decimal RefundAmount { get; set; }
    public PaymentMode RefundMode { get; set; }
    public string? RefundTransactionId { get; set; }
    public string? RefundNotes { get; set; }
}

public class AdjustDepositRequest
{
    public Guid AdmissionId { get; set; }
    public Guid BillId { get; set; }
    public decimal AdjustAmount { get; set; }
}
