namespace MedCareAxis.Core.DTOs.Request;

public class AddMedicineRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public int Category { get; set; }
    public string? Manufacturer { get; set; }
    public string? Composition { get; set; }
    public string? Strength { get; set; }
    public decimal GSTPercent { get; set; } = 12;
    public decimal PurchasePrice { get; set; }
    public decimal SalePrice { get; set; }
    public decimal MRP { get; set; }
    public int MinimumStock { get; set; } = 10;
    public int ReorderLevel { get; set; } = 20;
    public string? StorageCondition { get; set; }
    public bool IsScheduledDrug { get; set; }
}

public class AddStockRequest
{
    public Guid MedicineId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime ManufactureDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int Quantity { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal SalePrice { get; set; }
    public string? SupplierName { get; set; }
    public string? InvoiceNumber { get; set; }
}

public class CreateDispenseOrderRequest
{
    public Guid PatientId { get; set; }
    public Guid? PrescriptionId { get; set; }
    public Guid? AdmissionId { get; set; }
    public List<DispenseItemRequest> Items { get; set; } = new();
}

public class DispenseItemRequest
{
    public Guid MedicineId { get; set; }
    public int Quantity { get; set; }
}

public class DispenseOrderRequest
{
    public Guid OrderId { get; set; }
    public string? DispensedBy { get; set; }
    public List<DispenseItemFulfillment> Items { get; set; } = new();
}

public class DispenseItemFulfillment
{
    public Guid OrderItemId { get; set; }
    public Guid BatchId { get; set; }
    public int Quantity { get; set; }
}
