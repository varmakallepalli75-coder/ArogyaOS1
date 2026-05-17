using MedCareAxis.Core.Enums;

namespace MedCareAxis.Core.DTOs.Request;

public class AdmitPatientRequest
{
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid WardId { get; set; }
    public Guid BedId { get; set; }
    public string? AdmissionDiagnosis { get; set; }
    public string? AdmissionNotes { get; set; }
    public int Priority { get; set; } = 1; // PriorityLevel enum
    public bool IsEmergency { get; set; } = false;
    public int InsuranceType { get; set; } = 0;
    public string? InsuranceAuthCode { get; set; }
    public bool IsReferred { get; set; } = false;
    public string? ReferredFrom { get; set; }
}

public class RecordVitalsRequest
{
    public Guid AdmissionId { get; set; }
    public string? BloodPressure { get; set; }
    public int? PulseRate { get; set; }
    public decimal? Temperature { get; set; }
    public int? SpO2 { get; set; }
    public int? RespiratoryRate { get; set; }
    public decimal? BloodGlucose { get; set; }
    public string? GCSScore { get; set; }
    public string? PainScore { get; set; }
    public string? Notes { get; set; }
    public string? RecordedBy { get; set; }
}

public class DischargePatientRequest
{
    public Guid AdmissionId { get; set; }
    public int DischargeType { get; set; } = 0; // DischargeType enum
    public string? FinalDiagnosis { get; set; }
    public string? DischargeSummary { get; set; }
    public string? DischargeInstructions { get; set; }
    public string? FollowUpAdvice { get; set; }
    public DateTime? FollowUpDate { get; set; }
}

public class CreateWardRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int WardType { get; set; }
    public Guid DepartmentId { get; set; }
    public int Floor { get; set; }
    public string? WardInCharge { get; set; }
}

public class CreateBedRequest
{
    public string BedNumber { get; set; } = string.Empty;
    public Guid WardId { get; set; }
    public string? BedType { get; set; }
    public decimal ChargePerDay { get; set; }
    public bool HasOxygen { get; set; }
    public bool HasMonitor { get; set; }
    public bool HasVentilator { get; set; }
    public bool HasCallBell { get; set; }
}
