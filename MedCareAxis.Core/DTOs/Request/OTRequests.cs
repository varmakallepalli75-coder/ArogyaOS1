using MedCareAxis.Core.Enums;

namespace MedCareAxis.Core.DTOs.Request;

public class CreateOTRoomRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class ScheduleOTRequest
{
    public Guid OTRoomId { get; set; }
    public Guid PatientId { get; set; }
    public Guid? AdmissionId { get; set; }
    public Guid SurgeonId { get; set; }
    public Guid? AnesthetistId { get; set; }
    public string? AssistantSurgeons { get; set; }
    public string? ScrubNurses { get; set; }
    public string SurgeryType { get; set; } = string.Empty;
    public string? Diagnosis { get; set; }
    public AnesthesiaType AnesthesiaType { get; set; } = AnesthesiaType.General;
    public PriorityLevel Priority { get; set; } = PriorityLevel.Normal;
    public DateTime ScheduledDate { get; set; }
    public string StartTime { get; set; } = string.Empty;   // "HH:mm"
    public int DurationMinutes { get; set; } = 60;
    public string? PreOpNotes { get; set; }
}

public class UpdateOTStatusRequest
{
    public OperationStatus Status { get; set; }
    public string? SurgicalNotes { get; set; }
    public string? PostOpNotes { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }
}

public class UpdateOTChecklistRequest
{
    public bool ConsentSigned { get; set; }
    public bool BloodGroupConfirmed { get; set; }
    public bool AnesthesiaAssessmentDone { get; set; }
    public bool FastingConfirmed { get; set; }
    public bool InvestigationsReviewed { get; set; }
}
