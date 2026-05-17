using MedCareAxis.Core.Enums;

namespace MedCareAxis.Core.Entities;

public class Appointment : BaseEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Details ───────────────────────────────────────
    public string AppointmentNumber { get; set; } = string.Empty; // e.g. APT-2024-00001
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid DepartmentId { get; set; }
    public DateTime AppointmentDateTime { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;
    public ConsultationType ConsultationType { get; set; }
    public PriorityLevel Priority { get; set; } = PriorityLevel.Normal;

    // ─── Token ─────────────────────────────────────────
    public string? TokenNumber { get; set; }
    public bool IsWalkIn { get; set; } = false;

    // ─── Clinical ──────────────────────────────────────
    public string? ChiefComplaint { get; set; }
    public string? Notes { get; set; }

    // ─── Cancellation ──────────────────────────────────
    // Journey Timestamps
    public DateTime? CheckedInAt { get; set; }
    public DateTime? ConsultationStartedAt { get; set; }
    public DateTime? PrescriptionReadyAt { get; set; }
    public DateTime? CompletedAt { get; set; }

        public string? CancelledReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancelledBy { get; set; }

    // ─── Consultation Fee ──────────────────────────────
    public decimal ConsultationFee { get; set; }
    public bool IsFeeCollected { get; set; } = false;
    public string? FeePaymentMode { get; set; }        // Cash, Card, UPI
    public string? FeeReceiptNumber { get; set; }
    public DateTime? FeeCollectedAt { get; set; }

    // ─── Booking ───────────────────────────────────────
    public string? BookedBy { get; set; }
    public bool IsOnline { get; set; } = false;        // Booked via patient portal

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public Patient? Patient { get; set; }
    public Doctor? Doctor { get; set; }
    public Department? Department { get; set; }
    public OPDVisit? OPDVisit { get; set; }
}

public class OPDVisit : BaseEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Details ───────────────────────────────────────
    public string VisitNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid? AppointmentId { get; set; }
    public DateTime VisitDateTime { get; set; } = DateTime.UtcNow;
    public PatientType PatientType { get; set; } = PatientType.OPD;

    // ─── Vitals ────────────────────────────────────────
    public decimal? WeightKg { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? BMI { get; set; }
    public string? BloodPressure { get; set; }         // e.g. 120/80
    public int? PulseRate { get; set; }
    public decimal? Temperature { get; set; }
    public int? SpO2 { get; set; }
    public int? RespiratoryRate { get; set; }
    public string? BloodGlucose { get; set; }

    // ─── Clinical Notes ────────────────────────────────
    public string? ChiefComplaint { get; set; }
    public string? HistoryOfPresentIllness { get; set; }
    public string? ClinicalFindings { get; set; }
    public string? Diagnosis { get; set; }
    public string? ICD10Code { get; set; }
    public string? Advice { get; set; }
    public string? FollowUpDate { get; set; }
    public bool IsFollowUp { get; set; } = false;

    // ─── Fees ──────────────────────────────────────────
    public decimal ConsultationFee { get; set; }
    public bool IsBilled { get; set; } = false;

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public Patient? Patient { get; set; }
    public Doctor? Doctor { get; set; }
    public Appointment? Appointment { get; set; }
    public Prescription? Prescription { get; set; }
    public ICollection<LabOrder> LabOrders { get; set; }
        = new List<LabOrder>();

}