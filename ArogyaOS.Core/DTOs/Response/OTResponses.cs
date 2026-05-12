namespace ArogyaOS.Core.DTOs.Response;

public class OTRoomResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int TodayScheduled { get; set; }
    public string? CurrentSurgery { get; set; }
}

public class OTScheduleResponse
{
    public Guid Id { get; set; }
    public string OTRoomName { get; set; } = string.Empty;
    public Guid OTRoomId { get; set; }

    // Patient
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string UHID { get; set; } = string.Empty;
    public string? MobileNumber { get; set; }

    // Admission
    public Guid? AdmissionId { get; set; }
    public string? IPDNumber { get; set; }

    // Team
    public string SurgeonName { get; set; } = string.Empty;
    public string? AnesthetistName { get; set; }
    public string? AssistantSurgeons { get; set; }
    public string? ScrubNurses { get; set; }

    // Surgery
    public string SurgeryType { get; set; } = string.Empty;
    public string? Diagnosis { get; set; }
    public string AnesthesiaType { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;

    // Timing
    public DateTime ScheduledDate { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }

    // Status
    public string Status { get; set; } = string.Empty;

    // Pre-op Checklist
    public bool ConsentSigned { get; set; }
    public bool BloodGroupConfirmed { get; set; }
    public bool AnesthesiaAssessmentDone { get; set; }
    public bool FastingConfirmed { get; set; }
    public bool InvestigationsReviewed { get; set; }
    public int ChecklistComplete { get; set; }   // 0-5

    // Notes
    public string? PreOpNotes { get; set; }
    public string? SurgicalNotes { get; set; }
    public string? PostOpNotes { get; set; }

    public DateTime CreatedAt { get; set; }
}
