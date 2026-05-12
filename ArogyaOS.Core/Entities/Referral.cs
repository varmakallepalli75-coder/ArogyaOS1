using ArogyaOS.Core.Enums;

namespace ArogyaOS.Core.Entities;

public class PatientReferral
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // ─── Hospitals ─────────────────────────────────────
    public Guid FromHospitalId { get; set; }
    public Guid ToHospitalId { get; set; }
    public Hospital FromHospital { get; set; } = null!;
    public Hospital ToHospital { get; set; } = null!;

    // ─── Patient ───────────────────────────────────────
    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    public Guid? ReceivedPatientId { get; set; }   // patient ID at receiving hospital

    // ─── Doctors ───────────────────────────────────────
    public string ReferringDoctorName { get; set; } = string.Empty;
    public string? ReceivingDoctorName { get; set; }

    // ─── Referral Details ──────────────────────────────
    public ReferralStatus Status { get; set; } = ReferralStatus.Sent;
    public ReferralUrgency Urgency { get; set; } = ReferralUrgency.Routine;
    public string Reason { get; set; } = string.Empty;
    public string? ClinicalNotes { get; set; }
    public string? DeclineReason { get; set; }
    public string? OutcomeNotes { get; set; }
    public bool PatientConsent { get; set; }

    // ─── Snapshot (JSON) ───────────────────────────────
    public string PatientSnapshot { get; set; } = string.Empty;
    public string? AttachedReports { get; set; }  // JSON: brief summaries

    // ─── Timestamps ────────────────────────────────────
    public DateTime ReferredAt { get; set; } = DateTime.UtcNow;
    public DateTime? AcceptedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
