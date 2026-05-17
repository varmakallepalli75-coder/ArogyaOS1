namespace ArogyaOS.Core.DTOs.Response;

public class PrescriptionItemSummary
{
    public string MedicineName { get; set; } = string.Empty;
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public string? Duration { get; set; }
    public string? Instructions { get; set; }
}

public class LinkedHospitalInfo
{
    public Guid HospitalId { get; set; }
    public string HospitalCode { get; set; } = string.Empty;
    public string HospitalName { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string UHID { get; set; } = string.Empty;
}

public class UnifiedPatientResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public List<LinkedHospitalInfo> LinkedHospitals { get; set; } = new();
}

public class CrossHospitalPrescription
{
    public Guid PrescriptionId { get; set; }
    public string PrescriptionNumber { get; set; } = string.Empty;
    public DateTime PrescribedOn { get; set; }
    public string HospitalName { get; set; } = string.Empty;
    public string HospitalCode { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string Diagnosis { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? FollowUpInstructions { get; set; }
    public List<PrescriptionItemSummary> Medicines { get; set; } = new();
}

public class CrossHospitalVisit
{
    public Guid VisitId { get; set; }
    public string VisitNumber { get; set; } = string.Empty;
    public DateTime VisitDate { get; set; }
    public string HospitalName { get; set; } = string.Empty;
    public string HospitalCode { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string? ChiefComplaint { get; set; }
    public string? Diagnosis { get; set; }
    public string? Advice { get; set; }
    public string? BloodPressure { get; set; }
    public string? PulseRate { get; set; }
    public string? Temperature { get; set; }
    public string? SpO2 { get; set; }
    public string? FollowUpDate { get; set; }
}

public class CrossHospitalAdmission
{
    public Guid AdmissionId { get; set; }
    public string IPDNumber { get; set; } = string.Empty;
    public DateTime AdmissionDate { get; set; }
    public DateTime? DischargeDate { get; set; }
    public string HospitalName { get; set; } = string.Empty;
    public string HospitalCode { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string? AdmissionDiagnosis { get; set; }
    public string? FinalDiagnosis { get; set; }
    public string? DischargeSummary { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class CrossHospitalLabOrder
{
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime OrderedAt { get; set; }
    public string HospitalName { get; set; } = string.Empty;
    public string HospitalCode { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsAbnormal { get; set; }
    public List<string> TestNames { get; set; } = new();
}

public class HealthTimelineEvent
{
    public DateTime Date { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string HospitalName { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string? Details { get; set; }
    public Guid ReferenceId { get; set; }
}

public class PatientDocumentResponse
{
    public Guid Id { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? HospitalName { get; set; }
    public DateTime DocumentDate { get; set; }
    public DateTime UploadedAt { get; set; }
}
