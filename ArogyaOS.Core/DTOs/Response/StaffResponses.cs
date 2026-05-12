using ArogyaOS.Core.Enums;

namespace ArogyaOS.Core.DTOs.Response;

public class StaffListResponse
{
    public string Id { get; set; } = string.Empty;       // AppUser.Id
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string RoleLabel { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public bool IsActive { get; set; }
    public bool IsExternal { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class StaffDetailResponse : StaffListResponse
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
