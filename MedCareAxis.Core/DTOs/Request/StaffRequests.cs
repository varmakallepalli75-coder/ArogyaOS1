using MedCareAxis.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace MedCareAxis.Core.DTOs.Request;

public class CreateStaffRequest
{
    [Required] public string FirstName { get; set; } = string.Empty;
    [Required] public string LastName { get; set; } = string.Empty;
    [Required] public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    [Required] public string Password { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Receptionist;
    public string? Designation { get; set; }
    public StaffPermissionsRequest Permissions { get; set; } = new();
    public bool IsExternal { get; set; } = false;

    // Doctor-specific (required only when Role == Doctor)
    public Guid? DepartmentId { get; set; }
    public string? Qualification { get; set; }
    public string? Specialization { get; set; }
    public string? RegistrationNumber { get; set; }
    public decimal ConsultationFee { get; set; }
    public int ExperienceYears { get; set; }
}

public class UpdateStaffRequest
{
    [Required] public string FirstName { get; set; } = string.Empty;
    [Required] public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public UserRole Role { get; set; }
    public string? Designation { get; set; }
    public bool IsExternal { get; set; } = false;
}

public class StaffPermissionsRequest
{
    public bool PermPatients { get; set; }
    public bool PermAppointments { get; set; }
    public bool PermOPD { get; set; }
    public bool PermIPD { get; set; }
    public bool PermLab { get; set; }
    public bool PermPharmacy { get; set; }
    public bool PermBilling { get; set; }
    public bool PermReports { get; set; }
    public bool PermStaff { get; set; }
}

public class ResetStaffPasswordRequest
{
    [Required] public string NewPassword { get; set; } = string.Empty;
}
