using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Core.DTOs.Response;
using ArogyaOS.Core.Entities;
using ArogyaOS.Core.Enums;
using ArogyaOS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArogyaOS.Infrastructure.Services;

public class PrescriptionQueueResponse
{
    public Guid Id { get; set; }
    public string PrescriptionNumber { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string PatientUHID { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string? Diagnosis { get; set; }
    public DateTime PrescribedOn { get; set; }
    public List<PrescriptionItemQueueResponse> Medicines { get; set; } = new();
}

public class PrescriptionItemQueueResponse
{
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public int Quantity { get; set; }
}

public interface IPharmacyService
{
    Task<ApiResponse<PagedResponse<MedicineResponse>>> GetMedicinesAsync(Guid hospitalId, string? search, bool? lowStockOnly, int page, int pageSize);
    Task<ApiResponse<MedicineResponse>> GetMedicineByIdAsync(Guid id, Guid hospitalId);
    Task<ApiResponse<MedicineResponse>> AddMedicineAsync(AddMedicineRequest request, Guid hospitalId);
    Task<ApiResponse<MedicineBatchResponse>> AddStockAsync(AddStockRequest request, Guid hospitalId);
    Task<ApiResponse<List<MedicineBatchResponse>>> GetBatchesAsync(Guid medicineId, Guid hospitalId);
    Task<ApiResponse<PagedResponse<PharmacyOrderListResponse>>> GetOrdersAsync(Guid hospitalId, PharmacyOrderStatus? status, string? search, int page, int pageSize);
    Task<ApiResponse<PharmacyOrderDetailResponse>> GetOrderByIdAsync(Guid id, Guid hospitalId);
    Task<ApiResponse<PharmacyOrderDetailResponse>> CreateOrderAsync(CreateDispenseOrderRequest request, Guid hospitalId);
    Task<ApiResponse<PharmacyOrderDetailResponse>> DispenseOrderAsync(DispenseOrderRequest request, Guid hospitalId);
    Task<ApiResponse<List<StockTransactionResponse>>> GetTransactionsAsync(Guid hospitalId, Guid? medicineId, int page, int pageSize);
    Task<ApiResponse<List<PrescriptionQueueResponse>>> GetPendingPrescriptionsAsync(Guid hospitalId, string? search);
    Task<ApiResponse<bool>> MarkPrescriptionDispensedAsync(Guid prescriptionId, Guid hospitalId);
}

public class PharmacyService : IPharmacyService
{
    private readonly AppDbContext _context;
    private readonly IAuditService _audit;

    public PharmacyService(AppDbContext context, IAuditService audit)
    {
        _context = context;
        _audit = audit;
    }

    // ─── Medicines ─────────────────────────────────────────────────────────────

    public async Task<ApiResponse<PagedResponse<MedicineResponse>>> GetMedicinesAsync(
        Guid hospitalId, string? search, bool? lowStockOnly, int page, int pageSize)
    {
        var query = _context.Medicines
            .Include(m => m.Batches)
            .Where(m => m.HospitalId == hospitalId);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(m =>
                m.Name.Contains(search) ||
                m.Code.Contains(search) ||
                (m.GenericName != null && m.GenericName.Contains(search)));

        if (lowStockOnly == true)
            query = query.Where(m => m.CurrentStock <= m.MinimumStock);

        var total = await query.CountAsync();

        var medicines = await query
            .OrderBy(m => m.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = medicines.Select(m => MapMedicine(m)).ToList();

        return ApiResponse<PagedResponse<MedicineResponse>>.Ok(
            new PagedResponse<MedicineResponse>
            {
                Items = result,
                TotalCount = total,
                Page = page,
                PageSize = pageSize
            });
    }

    public async Task<ApiResponse<MedicineResponse>> GetMedicineByIdAsync(Guid id, Guid hospitalId)
    {
        var medicine = await _context.Medicines
            .Include(m => m.Batches)
            .FirstOrDefaultAsync(m => m.Id == id && m.HospitalId == hospitalId);

        if (medicine == null)
            return ApiResponse<MedicineResponse>.Fail("Medicine not found");

        return ApiResponse<MedicineResponse>.Ok(MapMedicine(medicine));
    }

    public async Task<ApiResponse<MedicineResponse>> AddMedicineAsync(
        AddMedicineRequest request, Guid hospitalId)
    {
        var exists = await _context.Medicines
            .AnyAsync(m => m.HospitalId == hospitalId && m.Code == request.Code);
        if (exists)
            return ApiResponse<MedicineResponse>.Fail("A medicine with this code already exists");

        var medicine = new Medicine
        {
            HospitalId      = hospitalId,
            Code            = request.Code,
            Name            = request.Name,
            GenericName     = request.GenericName,
            Category        = (MedicineCategory)request.Category,
            Manufacturer    = request.Manufacturer,
            Composition     = request.Composition,
            Strength        = request.Strength,
            GSTPercent      = request.GSTPercent,
            PurchasePrice   = request.PurchasePrice,
            SalePrice       = request.SalePrice,
            MRP             = request.MRP,
            MinimumStock    = request.MinimumStock,
            ReorderLevel    = request.ReorderLevel,
            StorageCondition = request.StorageCondition,
            IsScheduledDrug = request.IsScheduledDrug,
            CurrentStock    = 0,
            IsActive        = true
        };

        _context.Medicines.Add(medicine);
        await _context.SaveChangesAsync();

        return ApiResponse<MedicineResponse>.Ok(MapMedicine(medicine), "Medicine added successfully");
    }

    // ─── Stock / Batches ───────────────────────────────────────────────────────

    public async Task<ApiResponse<MedicineBatchResponse>> AddStockAsync(
        AddStockRequest request, Guid hospitalId)
    {
        var medicine = await _context.Medicines
            .FirstOrDefaultAsync(m => m.Id == request.MedicineId && m.HospitalId == hospitalId);
        if (medicine == null)
            return ApiResponse<MedicineBatchResponse>.Fail("Medicine not found");

        var batch = new MedicineBatch
        {
            HospitalId        = hospitalId,
            MedicineId        = request.MedicineId,
            BatchNumber       = request.BatchNumber,
            ManufactureDate   = request.ManufactureDate,
            ExpiryDate        = request.ExpiryDate,
            Quantity          = request.Quantity,
            RemainingQuantity = request.Quantity,
            PurchasePrice     = request.PurchasePrice,
            SalePrice         = request.SalePrice,
            SupplierName      = request.SupplierName,
            InvoiceNumber     = request.InvoiceNumber
        };

        _context.MedicineBatches.Add(batch);

        medicine.CurrentStock += request.Quantity;

        var newStock = medicine.CurrentStock;
        _context.StockTransactions.Add(new StockTransaction
        {
            HospitalId      = hospitalId,
            MedicineId      = request.MedicineId,
            BatchId         = batch.Id,
            TransactionType = StockTransactionType.Purchase,
            Quantity        = request.Quantity,
            BalanceAfter    = newStock,
            ReferenceNumber = request.InvoiceNumber,
            TransactionDate = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return ApiResponse<MedicineBatchResponse>.Ok(MapBatch(batch, medicine.Name), "Stock added successfully");
    }

    public async Task<ApiResponse<List<MedicineBatchResponse>>> GetBatchesAsync(
        Guid medicineId, Guid hospitalId)
    {
        var medicine = await _context.Medicines
            .FirstOrDefaultAsync(m => m.Id == medicineId && m.HospitalId == hospitalId);
        if (medicine == null)
            return ApiResponse<List<MedicineBatchResponse>>.Fail("Medicine not found");

        var batches = await _context.MedicineBatches
            .Where(b => b.MedicineId == medicineId && b.HospitalId == hospitalId)
            .OrderByDescending(b => b.ExpiryDate)
            .ToListAsync();

        var result = batches.Select(b => MapBatch(b, medicine.Name)).ToList();
        return ApiResponse<List<MedicineBatchResponse>>.Ok(result);
    }

    // ─── Orders ────────────────────────────────────────────────────────────────

    public async Task<ApiResponse<PagedResponse<PharmacyOrderListResponse>>> GetOrdersAsync(
        Guid hospitalId, PharmacyOrderStatus? status, string? search, int page, int pageSize)
    {
        var query = _context.PharmacyOrders
            .Include(o => o.Patient)
            .Include(o => o.Items)
            .Where(o => o.HospitalId == hospitalId);

        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(o =>
                o.OrderNumber.Contains(search) ||
                (o.Patient != null && (
                    o.Patient.FirstName.Contains(search) ||
                    o.Patient.LastName.Contains(search) ||
                    o.Patient.UHID.Contains(search))));

        var total = await query.CountAsync();

        var orders = await query
            .OrderByDescending(o => o.OrderedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = orders.Select(o => MapOrderList(o)).ToList();

        return ApiResponse<PagedResponse<PharmacyOrderListResponse>>.Ok(
            new PagedResponse<PharmacyOrderListResponse>
            {
                Items = result,
                TotalCount = total,
                Page = page,
                PageSize = pageSize
            });
    }

    public async Task<ApiResponse<PharmacyOrderDetailResponse>> GetOrderByIdAsync(
        Guid id, Guid hospitalId)
    {
        var order = await _context.PharmacyOrders
            .Include(o => o.Patient)
            .Include(o => o.Items)
                .ThenInclude(i => i.Medicine)
            .FirstOrDefaultAsync(o => o.Id == id && o.HospitalId == hospitalId);

        if (order == null)
            return ApiResponse<PharmacyOrderDetailResponse>.Fail("Order not found");

        return ApiResponse<PharmacyOrderDetailResponse>.Ok(MapOrderDetail(order));
    }

    public async Task<ApiResponse<PharmacyOrderDetailResponse>> CreateOrderAsync(
        CreateDispenseOrderRequest request, Guid hospitalId)
    {
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == request.PatientId && p.HospitalId == hospitalId);
        if (patient == null)
            return ApiResponse<PharmacyOrderDetailResponse>.Fail("Patient not found");

        var count = await _context.PharmacyOrders
            .Where(o => o.HospitalId == hospitalId)
            .CountAsync();
        var orderNumber = $"PHR-{DateTime.Now:yyyyMMdd}-{(count + 1):D4}";

        var order = new PharmacyOrder
        {
            HospitalId     = hospitalId,
            OrderNumber    = orderNumber,
            PatientId      = request.PatientId,
            PrescriptionId = request.PrescriptionId,
            AdmissionId    = request.AdmissionId,
            OrderedAt      = DateTime.UtcNow,
            Status         = PharmacyOrderStatus.Pending
        };

        decimal totalAmount = 0;
        decimal gstAmount   = 0;
        var orderItems = new List<PharmacyOrderItem>();

        foreach (var item in request.Items)
        {
            var medicine = await _context.Medicines
                .FirstOrDefaultAsync(m => m.Id == item.MedicineId && m.HospitalId == hospitalId);
            if (medicine == null)
                return ApiResponse<PharmacyOrderDetailResponse>.Fail(
                    $"Medicine with id {item.MedicineId} not found");

            var itemGst   = medicine.SalePrice * item.Quantity * medicine.GSTPercent / 100;
            var itemTotal = medicine.SalePrice * item.Quantity;

            totalAmount += itemTotal;
            gstAmount   += itemGst;

            orderItems.Add(new PharmacyOrderItem
            {
                PharmacyOrderId = order.Id,
                MedicineId      = item.MedicineId,
                MedicineName    = medicine.Name,
                Quantity        = item.Quantity,
                UnitPrice       = medicine.SalePrice,
                GSTPercent      = medicine.GSTPercent,
                GSTAmount       = itemGst,
                TotalAmount     = itemTotal,
                IsDispensed     = false
            });
        }

        order.TotalAmount    = totalAmount;
        order.GSTAmount      = gstAmount;
        order.DiscountAmount = 0;
        order.FinalAmount    = totalAmount + gstAmount;

        _context.PharmacyOrders.Add(order);
        _context.PharmacyOrderItems.AddRange(orderItems);
        await _context.SaveChangesAsync();

        return await GetOrderByIdAsync(order.Id, hospitalId);
    }

    public async Task<ApiResponse<PharmacyOrderDetailResponse>> DispenseOrderAsync(
        DispenseOrderRequest request, Guid hospitalId)
    {
        var order = await _context.PharmacyOrders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId && o.HospitalId == hospitalId);

        if (order == null)
            return ApiResponse<PharmacyOrderDetailResponse>.Fail("Order not found");

        if (order.Status == PharmacyOrderStatus.Cancelled)
            return ApiResponse<PharmacyOrderDetailResponse>.Fail("Cannot dispense a cancelled order");

        foreach (var fulfillment in request.Items)
        {
            var orderItem = order.Items.FirstOrDefault(i => i.Id == fulfillment.OrderItemId);
            if (orderItem == null)
                return ApiResponse<PharmacyOrderDetailResponse>.Fail(
                    $"Order item {fulfillment.OrderItemId} not found");

            var batch = await _context.MedicineBatches
                .FirstOrDefaultAsync(b => b.Id == fulfillment.BatchId && b.HospitalId == hospitalId);
            if (batch == null)
                return ApiResponse<PharmacyOrderDetailResponse>.Fail(
                    $"Batch {fulfillment.BatchId} not found");

            if (batch.RemainingQuantity < fulfillment.Quantity)
                return ApiResponse<PharmacyOrderDetailResponse>.Fail(
                    $"Insufficient stock in batch {batch.BatchNumber}. Available: {batch.RemainingQuantity}");

            batch.RemainingQuantity -= fulfillment.Quantity;

            var medicine = await _context.Medicines
                .FirstOrDefaultAsync(m => m.Id == orderItem.MedicineId && m.HospitalId == hospitalId);
            if (medicine != null)
            {
                medicine.CurrentStock -= fulfillment.Quantity;
                var balanceAfter = medicine.CurrentStock;

                _context.StockTransactions.Add(new StockTransaction
                {
                    HospitalId      = hospitalId,
                    MedicineId      = orderItem.MedicineId,
                    BatchId         = fulfillment.BatchId,
                    TransactionType = StockTransactionType.Dispensed,
                    Quantity        = -fulfillment.Quantity,
                    BalanceAfter    = balanceAfter,
                    ReferenceNumber = order.OrderNumber,
                    Notes           = $"Dispensed for order {order.OrderNumber}",
                    TransactionDate = DateTime.UtcNow
                });
            }

            orderItem.IsDispensed = true;
            orderItem.BatchId     = fulfillment.BatchId;
        }

        var allDispensed = order.Items.All(i => i.IsDispensed);
        var anyDispensed = order.Items.Any(i => i.IsDispensed);

        order.Status      = allDispensed ? PharmacyOrderStatus.Dispensed
                          : anyDispensed ? PharmacyOrderStatus.PartiallyDispensed
                          : order.Status;
        order.DispensedAt = DateTime.UtcNow;
        order.DispenedBy  = request.DispensedBy;

        await _context.SaveChangesAsync();

        await _audit.LogAsync(hospitalId, "PharmacyOrder", order.Id.ToString(), AuditAction.Update,
            $"Medicines dispensed for order {order.OrderNumber} by {request.DispensedBy}");

        return await GetOrderByIdAsync(order.Id, hospitalId);
    }

    // ─── Transactions ──────────────────────────────────────────────────────────

    public async Task<ApiResponse<List<StockTransactionResponse>>> GetTransactionsAsync(
        Guid hospitalId, Guid? medicineId, int page, int pageSize)
    {
        var query = _context.StockTransactions
            .Include(t => t.Medicine)
            .Where(t => t.HospitalId == hospitalId);

        if (medicineId.HasValue)
            query = query.Where(t => t.MedicineId == medicineId.Value);

        var transactions = await query
            .OrderByDescending(t => t.TransactionDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = transactions.Select(t => new StockTransactionResponse
        {
            Id              = t.Id,
            MedicineName    = t.Medicine?.Name ?? string.Empty,
            TransactionType = t.TransactionType.ToString(),
            Quantity        = t.Quantity,
            BalanceAfter    = t.BalanceAfter,
            ReferenceNumber = t.ReferenceNumber,
            Notes           = t.Notes,
            TransactionDate = t.TransactionDate
        }).ToList();

        return ApiResponse<List<StockTransactionResponse>>.Ok(result);
    }

    // ─── Mapping helpers ───────────────────────────────────────────────────────

    private static MedicineResponse MapMedicine(Medicine m)
    {
        var nearExpiry = DateTime.UtcNow.AddDays(90);
        return new MedicineResponse
        {
            Id                = m.Id,
            Code              = m.Code,
            Name              = m.Name,
            GenericName       = m.GenericName,
            Category          = m.Category.ToString(),
            Manufacturer      = m.Manufacturer,
            Composition       = m.Composition,
            Strength          = m.Strength,
            GSTPercent        = m.GSTPercent,
            PurchasePrice     = m.PurchasePrice,
            SalePrice         = m.SalePrice,
            MRP               = m.MRP,
            CurrentStock      = m.CurrentStock,
            MinimumStock      = m.MinimumStock,
            ReorderLevel      = m.ReorderLevel,
            IsActive          = m.IsActive,
            IsScheduledDrug   = m.IsScheduledDrug,
            IsLowStock        = m.CurrentStock <= m.MinimumStock,
            BatchCount        = m.Batches.Count,
            NearExpiryBatches = m.Batches.Count(b =>
                b.ExpiryDate < nearExpiry && b.RemainingQuantity > 0)
        };
    }

    private static MedicineBatchResponse MapBatch(MedicineBatch b, string medicineName) => new()
    {
        Id                = b.Id,
        MedicineId        = b.MedicineId,
        MedicineName      = medicineName,
        BatchNumber       = b.BatchNumber,
        ManufactureDate   = b.ManufactureDate,
        ExpiryDate        = b.ExpiryDate,
        Quantity          = b.Quantity,
        RemainingQuantity = b.RemainingQuantity,
        PurchasePrice     = b.PurchasePrice,
        SalePrice         = b.SalePrice,
        SupplierName      = b.SupplierName,
        IsExpired         = b.ExpiryDate < DateTime.UtcNow,
        DaysToExpiry      = (int)(b.ExpiryDate - DateTime.UtcNow).TotalDays
    };

    private static PharmacyOrderListResponse MapOrderList(PharmacyOrder o) => new()
    {
        Id          = o.Id,
        OrderNumber = o.OrderNumber,
        PatientId   = o.PatientId,
        PatientName = o.Patient?.FullName ?? string.Empty,
        PatientUHID = o.Patient?.UHID ?? string.Empty,
        Status      = o.Status.ToString(),
        OrderedAt   = o.OrderedAt,
        TotalAmount = o.TotalAmount,
        FinalAmount = o.FinalAmount,
        DispenedBy  = o.DispenedBy,
        DispensedAt = o.DispensedAt,
        ItemCount   = o.Items.Count
    };

        public async Task<ApiResponse<List<PrescriptionQueueResponse>>> GetPendingPrescriptionsAsync(
        Guid hospitalId, string? search)
    {
        var query = _context.Prescriptions
            .Include(p => p.Patient)
            .Include(p => p.Doctor)
            .Include(p => p.Items)
            .Where(p => p.HospitalId == hospitalId && !p.IsDispensed);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p =>
                (p.Patient != null && p.Patient.FullName.Contains(search)) ||
                p.PrescriptionNumber.Contains(search));

        var prescriptions = await query
            .OrderByDescending(p => p.PrescribedOn)
            .Take(50)
            .ToListAsync();

        var result = prescriptions.Select(p => new PrescriptionQueueResponse
        {
            Id = p.Id,
            PrescriptionNumber = p.PrescriptionNumber,
            PatientName = p.Patient?.FullName ?? "Unknown",
            PatientUHID = p.Patient?.UHID ?? "",
            DoctorName = p.Doctor != null ? $"Dr. {p.Doctor.FirstName} {p.Doctor.LastName}" : "",
            Diagnosis = p.Diagnosis,
            PrescribedOn = p.PrescribedOn,
            Medicines = p.Items.Select(i => new PrescriptionItemQueueResponse
            {
                MedicineName = i.MedicineName,
                Dosage = i.Dosage,
                Frequency = i.Frequency,
                Duration = i.Duration,
                Instructions = i.Instructions,
                Quantity = i.Quantity
            }).ToList()
        }).ToList();

        return ApiResponse<List<PrescriptionQueueResponse>>.Ok(result);
    }

    public async Task<ApiResponse<bool>> MarkPrescriptionDispensedAsync(
        Guid prescriptionId, Guid hospitalId)
    {
        var prescription = await _context.Prescriptions
            .FirstOrDefaultAsync(p => p.Id == prescriptionId && p.HospitalId == hospitalId);

        if (prescription == null)
            return ApiResponse<bool>.Fail("Prescription not found");

        prescription.IsDispensed = true;
        prescription.DispensedOn = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Prescription marked as dispensed");
    }

    private static PharmacyOrderDetailResponse MapOrderDetail(PharmacyOrder o) => new()
    {
        Id          = o.Id,
        OrderNumber = o.OrderNumber,
        PatientId   = o.PatientId,
        PatientName = o.Patient?.FullName ?? string.Empty,
        PatientUHID = o.Patient?.UHID ?? string.Empty,
        Status      = o.Status.ToString(),
        OrderedAt   = o.OrderedAt,
        TotalAmount = o.TotalAmount,
        FinalAmount = o.FinalAmount,
        DispenedBy  = o.DispenedBy,
        DispensedAt = o.DispensedAt,
        ItemCount   = o.Items.Count,
        Items       = o.Items.Select(i => new PharmacyOrderItemResponse
        {
            Id           = i.Id,
            MedicineId   = i.MedicineId,
            MedicineName = i.MedicineName,
            BatchId      = i.BatchId,
            Quantity     = i.Quantity,
            UnitPrice    = i.UnitPrice,
            GSTPercent   = i.GSTPercent,
            GSTAmount    = i.GSTAmount,
            TotalAmount  = i.TotalAmount,
            IsDispensed  = i.IsDispensed
        }).ToList()
    };
}
