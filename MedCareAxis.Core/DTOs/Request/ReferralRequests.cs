using System.ComponentModel.DataAnnotations;

namespace MedCareAxis.Core.DTOs.Request;

public class CreateReferralRequest
{
    [Required] public Guid PatientId { get; set; }
    [Required] public Guid ToHospitalId { get; set; }
    [Required] public string ReferringDoctorName { get; set; } = string.Empty;
    public string? ReceivingDoctorName { get; set; }
    [Required] public int Urgency { get; set; }   // ReferralUrgency enum
    [Required] public string Reason { get; set; } = string.Empty;
    public string? ClinicalNotes { get; set; }
    public bool PatientConsent { get; set; }
    public List<AttachedReportItem>? AttachedReports { get; set; }
}

public class AttachedReportItem
{
    public string Type { get; set; } = string.Empty;   // Lab, Prescription, etc.
    public string Label { get; set; } = string.Empty;
    public string? Summary { get; set; }
}

public class AcceptReferralRequest
{
    public Guid? ExistingPatientId { get; set; }  // if patient already registered here
}

public class DeclineReferralRequest
{
    [Required] public string Reason { get; set; } = string.Empty;
}

public class CompleteReferralRequest
{
    public string? OutcomeNotes { get; set; }
}
