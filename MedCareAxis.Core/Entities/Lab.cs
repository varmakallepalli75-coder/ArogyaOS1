using MedCareAxis.Core.Enums;

namespace MedCareAxis.Core.Entities;

public class LabTest : BaseEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Details ───────────────────────────────────────
    public string Code { get; set; } = string.Empty;       // e.g. CBC, LFT, RFT
    public string Name { get; set; } = string.Empty;       // e.g. Complete Blood Count
    public string? Department { get; set; }                // Haematology, Biochemistry
    public SampleType SampleType { get; set; }
    public string? Description { get; set; }
    public int? TurnAroundTimeHours { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsOutsourced { get; set; } = false;

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public ICollection<LabTestParameter> Parameters { get; set; }
        = new List<LabTestParameter>();
}

public class LabTestParameter : BaseEntity
{
    public Guid LabTestId { get; set; }
    public string ParameterName { get; set; } = string.Empty;  // e.g. Haemoglobin
    public string? Unit { get; set; }                           // e.g. g/dL
    public string? NormalRangeMale { get; set; }               // e.g. 13.0-17.0
    public string? NormalRangeFemale { get; set; }
    public string? NormalRangeChild { get; set; }
    public string? Method { get; set; }
    public int SortOrder { get; set; } = 0;
    public LabTest? LabTest { get; set; }
}

public class LabOrder : BaseEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Details ───────────────────────────────────────
    public string OrderNumber { get; set; } = string.Empty;    // e.g. LAB-2024-00001
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid? OPDVisitId { get; set; }
    public Guid? AdmissionId { get; set; }
    public DateTime OrderedAt { get; set; } = DateTime.UtcNow;
    public LabOrderStatus Status { get; set; } = LabOrderStatus.Ordered;
    public PriorityLevel Priority { get; set; } = PriorityLevel.Normal;
    public string? ClinicalNotes { get; set; }
    public bool IsBilled { get; set; } = false;

    // ─── Sample ────────────────────────────────────────
    public DateTime? SampleCollectedAt { get; set; }
    public string? SampleCollectedBy { get; set; }
    public string? SampleBarcode { get; set; }

    // ─── Report ────────────────────────────────────────
    public DateTime? ReportedAt { get; set; }
    public string? ReportedBy { get; set; }
    public string? ReportUrl { get; set; }
    public string? TechnicianNotes { get; set; }
    public bool IsAbnormal { get; set; } = false;

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public Patient? Patient { get; set; }
    public Doctor? Doctor { get; set; }
    public OPDVisit? OPDVisit { get; set; }
    public Admission? Admission { get; set; }
    public ICollection<LabOrderItem> Items { get; set; }
        = new List<LabOrderItem>();
}

public class LabOrderItem : BaseEntity
{
    public Guid LabOrderId { get; set; }
    public Guid LabTestId { get; set; }
    public LabOrderStatus Status { get; set; } = LabOrderStatus.Ordered;
    public decimal Price { get; set; }

    // ─── Navigation ────────────────────────────────────
    public LabOrder? LabOrder { get; set; }
    public LabTest? LabTest { get; set; }
    public ICollection<LabResult> Results { get; set; }
        = new List<LabResult>();
}

public class LabResult : BaseEntity
{
    public Guid LabOrderItemId { get; set; }
    public Guid LabTestParameterId { get; set; }
    public string? Value { get; set; }
    public string? Unit { get; set; }
    public string? NormalRange { get; set; }
    public bool IsAbnormal { get; set; } = false;
    public bool IsHigh { get; set; } = false;
    public bool IsLow { get; set; } = false;
    public string? Notes { get; set; }

    // ─── Navigation ────────────────────────────────────
    public LabOrderItem? LabOrderItem { get; set; }
    public LabTestParameter? LabTestParameter { get; set; }
}