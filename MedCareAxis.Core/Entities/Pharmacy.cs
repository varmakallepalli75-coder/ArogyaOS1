using MedCareAxis.Core.Enums;

namespace MedCareAxis.Core.Entities;

public class Medicine : BaseEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Details ───────────────────────────────────────
    public string Code { get; set; } = string.Empty;       // e.g. MED-001
    public string Name { get; set; } = string.Empty;       // Brand name
    public string? GenericName { get; set; }               // Generic name
    public MedicineCategory Category { get; set; }
    public string? Manufacturer { get; set; }
    public string? Composition { get; set; }               // e.g. Paracetamol 500mg
    public string? Strength { get; set; }                  // e.g. 500mg, 10ml
    public string? HSNCode { get; set; }                   // For GST
    public decimal GSTPercent { get; set; } = 12;

    // ─── Pricing ───────────────────────────────────────
    public decimal PurchasePrice { get; set; }
    public decimal SalePrice { get; set; }
    public decimal MRP { get; set; }

    // ─── Stock ─────────────────────────────────────────
    public int CurrentStock { get; set; } = 0;
    public int MinimumStock { get; set; } = 10;            // Alert threshold
    public int ReorderLevel { get; set; } = 20;
    public string? StorageCondition { get; set; }          // e.g. Store below 25°C
    public bool IsActive { get; set; } = true;
    public bool IsScheduledDrug { get; set; } = false;     // Schedule H, X

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public ICollection<MedicineBatch> Batches { get; set; }
        = new List<MedicineBatch>();
    public ICollection<StockTransaction> StockTransactions { get; set; }
        = new List<StockTransaction>();
}

public class MedicineBatch : BaseEntity
{
    public Guid HospitalId { get; set; }
    public Guid MedicineId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime ManufactureDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int Quantity { get; set; }
    public int RemainingQuantity { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal SalePrice { get; set; }
    public string? SupplierName { get; set; }
    public string? InvoiceNumber { get; set; }
    public bool IsExpired => ExpiryDate < DateTime.UtcNow;
    public Medicine? Medicine { get; set; }
}

public class StockTransaction : BaseEntity
{
    public Guid HospitalId { get; set; }
    public Guid MedicineId { get; set; }
    public Guid? BatchId { get; set; }
    public StockTransactionType TransactionType { get; set; }
    public int Quantity { get; set; }
    public int BalanceAfter { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public Medicine? Medicine { get; set; }
}

public class PharmacyOrder : BaseEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Details ───────────────────────────────────────
    public string OrderNumber { get; set; } = string.Empty; // e.g. PHR-2024-00001
    public Guid PatientId { get; set; }
    public Guid? PrescriptionId { get; set; }
    public Guid? AdmissionId { get; set; }
    public DateTime OrderedAt { get; set; } = DateTime.UtcNow;
    public PharmacyOrderStatus Status { get; set; }
        = PharmacyOrderStatus.Pending;

    // ─── Billing ───────────────────────────────────────
    public decimal TotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal GSTAmount { get; set; }
    public decimal FinalAmount { get; set; }
    public bool IsBilled { get; set; } = false;
    public string? DispenedBy { get; set; }
    public DateTime? DispensedAt { get; set; }

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public Patient? Patient { get; set; }
    public Prescription? Prescription { get; set; }
    public ICollection<PharmacyOrderItem> Items { get; set; }
        = new List<PharmacyOrderItem>();
}

public class PharmacyOrderItem : BaseEntity
{
    public Guid PharmacyOrderId { get; set; }
    public Guid MedicineId { get; set; }
    public Guid? BatchId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal GSTPercent { get; set; }
    public decimal GSTAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public bool IsDispensed { get; set; } = false;
    public PharmacyOrder? PharmacyOrder { get; set; }
    public Medicine? Medicine { get; set; }
}