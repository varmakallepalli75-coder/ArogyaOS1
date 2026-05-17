using MedCareAxis.Core.Enums;

namespace MedCareAxis.Core.Entities;

public class Ward : BaseEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Details ───────────────────────────────────────
    public string Code { get; set; } = string.Empty;      // e.g. ICU-A, GEN-B
    public string Name { get; set; } = string.Empty;      // e.g. ICU Ward A
    public WardType WardType { get; set; }
    public Guid DepartmentId { get; set; }
    public int Floor { get; set; }
    public string? WardInCharge { get; set; }
    public string? ContactExtension { get; set; }
    public bool IsActive { get; set; } = true;

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public Department? Department { get; set; }
    public ICollection<Bed> Beds { get; set; }
        = new List<Bed>();
}

public class Bed : BaseEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Details ───────────────────────────────────────
    public string BedNumber { get; set; } = string.Empty; // e.g. A-101
    public Guid WardId { get; set; }
    public BedStatus Status { get; set; } = BedStatus.Available;
    public string? BedType { get; set; }                  // General, Private, ICU
    public decimal ChargePerDay { get; set; }

    // ─── Features ──────────────────────────────────────
    public bool HasOxygen { get; set; } = false;
    public bool HasMonitor { get; set; } = false;
    public bool HasVentilator { get; set; } = false;
    public bool HasCallBell { get; set; } = false;

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public Ward? Ward { get; set; }
    public ICollection<Admission> Admissions { get; set; }
        = new List<Admission>();
}