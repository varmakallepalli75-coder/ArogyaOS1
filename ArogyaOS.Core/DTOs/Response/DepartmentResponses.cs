namespace ArogyaOS.Core.DTOs.Response;

public class DepartmentResponse
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public string? ContactExtension { get; set; }
    public bool IsActive { get; set; }
    public int DoctorCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DoctorResponse
{
    public Guid Id { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Qualification { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string? SubSpecialization { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public string MobileNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    public decimal? FollowUpFee { get; set; }
    public string EmploymentType { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public bool IsActive { get; set; }
    public List<DoctorScheduleResponse> Schedules { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class DoctorScheduleResponse
{
    public Guid Id { get; set; }
    public string DayOfWeek { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public int SlotDurationMinutes { get; set; }
    public int MaxPatients { get; set; }
    public bool IsActive { get; set; }
}

public class DoctorListResponse
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string Qualification { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    public bool IsAvailable { get; set; }
    public string MobileNumber { get; set; } = string.Empty;
}
