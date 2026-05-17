namespace MedCareAxis.Core.DTOs.Response;

public class AdmissionListResponse
{
    public Guid Id { get; set; }
    public string IPDNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientUHID { get; set; } = string.Empty;
    public string PatientMobile { get; set; } = string.Empty;
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string WardName { get; set; } = string.Empty;
    public string BedNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime AdmissionDateTime { get; set; }
    public string? AdmissionDiagnosis { get; set; }
    public string Priority { get; set; } = string.Empty;
    public bool IsEmergency { get; set; }
    public int DaysAdmitted { get; set; }
    public DateTime? DischargeDateTime { get; set; }
}

public class AdmissionDetailResponse : AdmissionListResponse
{
    public string? AdmissionNotes { get; set; }
    public string? FinalDiagnosis { get; set; }
    public string? DischargeSummary { get; set; }
    public string? DischargeInstructions { get; set; }
    public string? FollowUpAdvice { get; set; }
    public DateTime? FollowUpDate { get; set; }
    public string InsuranceType { get; set; } = string.Empty;
    public List<VitalsResponse> Vitals { get; set; } = new();
}

public class VitalsResponse
{
    public Guid Id { get; set; }
    public Guid AdmissionId { get; set; }
    public DateTime RecordedAt { get; set; }
    public string? RecordedBy { get; set; }
    public string? BloodPressure { get; set; }
    public int? PulseRate { get; set; }
    public decimal? Temperature { get; set; }
    public int? SpO2 { get; set; }
    public int? RespiratoryRate { get; set; }
    public decimal? BloodGlucose { get; set; }
    public string? GCSScore { get; set; }
    public string? PainScore { get; set; }
    public string? Notes { get; set; }
}

public class WardResponse
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string WardType { get; set; } = string.Empty;
    public int Floor { get; set; }
    public string? WardInCharge { get; set; }
    public int TotalBeds { get; set; }
    public int AvailableBeds { get; set; }
    public int OccupiedBeds { get; set; }
    public List<BedResponse> Beds { get; set; } = new();
}

public class BedResponse
{
    public Guid Id { get; set; }
    public string BedNumber { get; set; } = string.Empty;
    public Guid WardId { get; set; }
    public string WardName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? BedType { get; set; }
    public decimal ChargePerDay { get; set; }
    public bool HasOxygen { get; set; }
    public bool HasMonitor { get; set; }
    public bool HasVentilator { get; set; }
    public bool HasCallBell { get; set; }
    public string? CurrentPatientName { get; set; }
}
