using System.ComponentModel.DataAnnotations;

namespace MedCareAxis.Core.DTOs.Request;

public class CreateDepartmentRequest
{
    [Required]
    public string Code { get; set; } = string.Empty;
    [Required]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public string? ContactExtension { get; set; }
}

public class CreateDoctorRequest
{
    [Required]
    public string FirstName { get; set; } = string.Empty;
    [Required]
    public string LastName { get; set; } = string.Empty;
    [Required]
    public string Qualification { get; set; } = string.Empty;
    [Required]
    public string Specialization { get; set; } = string.Empty;
    public string? SubSpecialization { get; set; }
    [Required]
    public string RegistrationNumber { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    [Required]
    public string MobileNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    [Required]
    public Guid DepartmentId { get; set; }
    public decimal ConsultationFee { get; set; }
    public decimal? FollowUpFee { get; set; }
    public int EmploymentType { get; set; } = 0;
    public List<DoctorScheduleRequest> Schedules { get; set; } = new();
}

public class DoctorScheduleRequest
{
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public int SlotDurationMinutes { get; set; } = 15;
    public int MaxPatients { get; set; } = 20;
}

public class UpdateDoctorRequest
{
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
    public decimal ConsultationFee { get; set; }
    public decimal? FollowUpFee { get; set; }
    public int EmploymentType { get; set; }
    public List<DoctorScheduleRequest> Schedules { get; set; } = new();
}
