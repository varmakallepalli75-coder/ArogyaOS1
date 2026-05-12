namespace ArogyaOS.Core.DTOs.Response;

public class ReferralListResponse
{
    public Guid Id { get; set; }
    public Guid FromHospitalId { get; set; }
    public string FromHospitalName { get; set; } = string.Empty;
    public Guid ToHospitalId { get; set; }
    public string ToHospitalName { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientUHID { get; set; } = string.Empty;
    public string PatientAge { get; set; } = string.Empty;
    public string PatientGender { get; set; } = string.Empty;
    public string PatientBloodGroup { get; set; } = string.Empty;
    public string PatientMobile { get; set; } = string.Empty;
    public string ReferringDoctorName { get; set; } = string.Empty;
    public string? ReceivingDoctorName { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Urgency { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public Guid? ReceivedPatientId { get; set; }
    public DateTime ReferredAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class ReferralDetailResponse : ReferralListResponse
{
    public string? ClinicalNotes { get; set; }
    public string? DeclineReason { get; set; }
    public string? OutcomeNotes { get; set; }
    public bool PatientConsent { get; set; }
    public string? AttachedReports { get; set; }
    public string PatientSnapshot { get; set; } = string.Empty;
}

public class HospitalPickerResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string HospitalCode { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
}
