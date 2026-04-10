using ArogyaOS.Core.Enums;

namespace ArogyaOS.Core.Entities;

public class Prescription : BaseEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Details ───────────────────────────────────────
    public string PrescriptionNumber { get; set; } = string.Empty; // e.g. RX-2024-00001
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid? OPDVisitId { get; set; }
    public Guid? AdmissionId { get; set; }
    public DateTime PrescribedOn { get; set; } = DateTime.UtcNow;

    // ─── Clinical ──────────────────────────────────────
    public string? Diagnosis { get; set; }
    public string? Notes { get; set; }
    public string? FollowUpInstructions { get; set; }
    public DateTime? FollowUpDate { get; set; }

    // ─── Status ────────────────────────────────────────
    public bool IsDispensed { get; set; } = false;
    public DateTime? DispensedOn { get; set; }

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public Patient? Patient { get; set; }
    public Doctor? Doctor { get; set; }
    public OPDVisit? OPDVisit { get; set; }
    public Admission? Admission { get; set; }
    public ICollection<PrescriptionItem> Items { get; set; }
        = new List<PrescriptionItem>();
}

public class PrescriptionItem : BaseEntity
{
    // ─── Details ───────────────────────────────────────
    public Guid PrescriptionId { get; set; }
    public Guid? MedicineId { get; set; }              // Linked to pharmacy
    public string MedicineName { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public MedicineCategory Category { get; set; }

    // ─── Dosage ────────────────────────────────────────
    public string Dosage { get; set; } = string.Empty; // e.g. 500mg
    public string Frequency { get; set; } = string.Empty; // e.g. 1-0-1, 1-1-1
    public string Duration { get; set; } = string.Empty;  // e.g. 5 days, 1 month
    public int Quantity { get; set; }
    public string? Route { get; set; }                 // Oral, IV, IM, Topical
    public string? Instructions { get; set; }          // After food, Before food
    public string? Notes { get; set; }

    // ─── Status ────────────────────────────────────────
    public bool IsDispensed { get; set; } = false;
    public bool IsSubstitutionAllowed { get; set; } = true;

    // ─── Navigation ────────────────────────────────────
    public Prescription? Prescription { get; set; }
    public Medicine? Medicine { get; set; }
}