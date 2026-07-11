using MedCareAxis.Core.Interfaces;
using MedCareAxis.Core.Enums;

namespace MedCareAxis.Core.Entities;

public class Admission : BaseEntity, ITenantEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Details ───────────────────────────────────────
    public string IPDNumber { get; set; } = string.Empty;  // e.g. IPD-2024-00001
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid WardId { get; set; }
    public Guid BedId { get; set; }
    public AdmissionStatus Status { get; set; } = AdmissionStatus.Active;

    // ─── Admission ─────────────────────────────────────
    public DateTime AdmissionDateTime { get; set; } = DateTime.UtcNow;
    public string? AdmissionDiagnosis { get; set; }
    public string? AdmissionNotes { get; set; }
    public PriorityLevel Priority { get; set; } = PriorityLevel.Normal;
    public PatientType PatientType { get; set; } = PatientType.IPD;
    public bool IsEmergency { get; set; } = false;

    // ─── Discharge ─────────────────────────────────────
    public DateTime? DischargeDateTime { get; set; }
    public DischargeType? DischargeType { get; set; }
    public string? FinalDiagnosis { get; set; }
    public string? DischargeSummary { get; set; }
    public string? DischargeInstructions { get; set; }
    public string? FollowUpAdvice { get; set; }
    public DateTime? FollowUpDate { get; set; }
    public Guid? DischargedByDoctorId { get; set; }

    // ─── Referral ──────────────────────────────────────
    public bool IsReferred { get; set; } = false;
    public string? ReferredFrom { get; set; }
    public string? ReferredBy { get; set; }

    // ─── Insurance ─────────────────────────────────────
    public InsuranceType InsuranceType { get; set; } = InsuranceType.None;
    public string? InsuranceAuthCode { get; set; }
    public decimal? ApprovedAmount { get; set; }

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public Patient? Patient { get; set; }
    public Doctor? Doctor { get; set; }
    public Ward? Ward { get; set; }
    public Bed? Bed { get; set; }
    public ICollection<AdmissionVitals> Vitals { get; set; }
        = new List<AdmissionVitals>();
    public ICollection<Prescription> Prescriptions { get; set; }
        = new List<Prescription>();
    public ICollection<LabOrder> LabOrders { get; set; }
        = new List<LabOrder>();
   
    public Bill? Bill { get; set; }
}

public class AdmissionVitals : BaseEntity, ITenantEntity
{
    public Guid HospitalId { get; set; }
    public Guid AdmissionId { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    public string? RecordedBy { get; set; }

    // ─── Vitals ────────────────────────────────────────
    public string? BloodPressure { get; set; }
    public int? PulseRate { get; set; }
    public decimal? Temperature { get; set; }
    public int? SpO2 { get; set; }
    public int? RespiratoryRate { get; set; }
    public decimal? BloodGlucose { get; set; }
    public string? GCSScore { get; set; }             // Glasgow Coma Scale
    public string? PainScore { get; set; }            // 0-10
    public string? Notes { get; set; }

    public Admission? Admission { get; set; }
}