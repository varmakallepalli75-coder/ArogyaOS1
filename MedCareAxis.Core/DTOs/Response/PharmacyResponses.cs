namespace MedCareAxis.Core.DTOs.Response;

public class MedicineResponse
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Manufacturer { get; set; }
    public string? Composition { get; set; }
    public string? Strength { get; set; }
    public decimal GSTPercent { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal SalePrice { get; set; }
    public decimal MRP { get; set; }
    public int CurrentStock { get; set; }
    public int MinimumStock { get; set; }
    public int ReorderLevel { get; set; }
    public bool IsActive { get; set; }
    public bool IsScheduledDrug { get; set; }
    public bool IsLowStock { get; set; }
    public int BatchCount { get; set; }
    public int NearExpiryBatches { get; set; }
}

public class MedicineBatchResponse
{
    public Guid Id { get; set; }
    public Guid MedicineId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime ManufactureDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int Quantity { get; set; }
    public int RemainingQuantity { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal SalePrice { get; set; }
    public string? SupplierName { get; set; }
    public bool IsExpired { get; set; }
    public int DaysToExpiry { get; set; }
}

public class StockTransactionResponse
{
    public Guid Id { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int BalanceAfter { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public DateTime TransactionDate { get; set; }
}

public class PharmacyOrderListResponse
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientUHID { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime OrderedAt { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal FinalAmount { get; set; }
    public string? DispenedBy { get; set; }
    public DateTime? DispensedAt { get; set; }
    public int ItemCount { get; set; }
}

public class PharmacyOrderDetailResponse : PharmacyOrderListResponse
{
    public List<PharmacyOrderItemResponse> Items { get; set; } = new();
}

public class PharmacyOrderItemResponse
{
    public Guid Id { get; set; }
    public Guid MedicineId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public Guid? BatchId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal GSTPercent { get; set; }
    public decimal GSTAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public bool IsDispensed { get; set; }
}
