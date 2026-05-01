namespace ArogyaOS.Core.DTOs.Response;

public class AppointmentResponse
{
    public Guid Id { get; set; }
    public string AppointmentNumber { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientUHID { get; set; } = string.Empty;
    public string PatientMobile { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public DateTime AppointmentDateTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ConsultationType { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string? ChiefComplaint { get; set; }
    public string? TokenNumber { get; set; }
    public bool IsWalkIn { get; set; }
    public string? CancelledReason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TodayAppointmentResponse
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public string AppointmentNumber { get; set; } = string.Empty;
    public string TokenNumber { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string PatientUHID { get; set; } = string.Empty;
    public string PatientMobile { get; set; } = string.Empty;
    public int PatientAge { get; set; }
    public string PatientGender { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public DateTime AppointmentDateTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ChiefComplaint { get; set; }
    public bool IsWalkIn { get; set; }
}
