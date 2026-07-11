using MedCareAxis.Core.Interfaces;
using MedCareAxis.Core.Enums;

namespace MedCareAxis.Core.Entities;

public class OTRoom : BaseEntity, ITenantEntity
{
    public Guid HospitalId { get; set; }
    public string Name { get; set; } = string.Empty;        // e.g. "OT-1", "Main OT"
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public Hospital? Hospital { get; set; }
    public ICollection<OTSchedule> Schedules { get; set; } = new List<OTSchedule>();
}

public class OTSchedule : BaseEntity, ITenantEntity
{
    public Guid HospitalId { get; set; }

    // ─── Room & Patient ────────────────────────────────
    public Guid OTRoomId { get; set; }
    public Guid PatientId { get; set; }
    public Guid? AdmissionId { get; set; }          // linked IPD admission (optional)

    // ─── Surgical Team ─────────────────────────────────
    public Guid SurgeonId { get; set; }
    public Guid? AnesthetistId { get; set; }
    public string? AssistantSurgeons { get; set; }  // comma-separated names
    public string? ScrubNurses { get; set; }        // comma-separated names

    // ─── Surgery Details ───────────────────────────────
    public string SurgeryType { get; set; } = string.Empty;
    public string? Diagnosis { get; set; }
    public AnesthesiaType AnesthesiaType { get; set; } = AnesthesiaType.General;
    public PriorityLevel Priority { get; set; } = PriorityLevel.Normal;

    // ─── Timing ────────────────────────────────────────
    public DateTime ScheduledDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public int DurationMinutes { get; set; } = 60;
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }

    // ─── Status ────────────────────────────────────────
    public OperationStatus Status { get; set; } = OperationStatus.Scheduled;

    // ─── Pre-op Checklist ──────────────────────────────
    public bool ConsentSigned { get; set; } = false;
    public bool BloodGroupConfirmed { get; set; } = false;
    public bool AnesthesiaAssessmentDone { get; set; } = false;
    public bool FastingConfirmed { get; set; } = false;
    public bool InvestigationsReviewed { get; set; } = false;

    // ─── Notes ─────────────────────────────────────────
    public string? PreOpNotes { get; set; }
    public string? SurgicalNotes { get; set; }
    public string? PostOpNotes { get; set; }

    // ─── Navigation ────────────────────────────────────
    public OTRoom? OTRoom { get; set; }
    public Patient? Patient { get; set; }
    public Doctor? Surgeon { get; set; }
    public Doctor? Anesthetist { get; set; }
    public Admission? Admission { get; set; }
    public Hospital? Hospital { get; set; }
}
