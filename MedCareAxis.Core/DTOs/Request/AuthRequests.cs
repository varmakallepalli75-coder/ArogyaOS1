using MedCareAxis.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace MedCareAxis.Core.DTOs.Request;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class RegisterHospitalRequest
{
    [Required]
    public string HospitalName { get; set; } = string.Empty;
    [Required]
    public string Phone { get; set; } = string.Empty;
    [Required]
    [EmailAddress]
    public string HospitalEmail { get; set; } = string.Empty;
    [Required]
    public string Address { get; set; } = string.Empty;
    [Required]
    public string City { get; set; } = string.Empty;
    [Required]
    public string State { get; set; } = string.Empty;
    [Required]
    public string PinCode { get; set; } = string.Empty;
    public string? GSTNumber { get; set; }
    public int TotalBeds { get; set; }
    public string? HospitalType { get; set; }
    public string? Category { get; set; }
    public bool? HasOPD { get; set; }
    public bool? HasIPD { get; set; }
    public bool? HasLab { get; set; }
    public bool? HasPharmacy { get; set; }
    public bool? HasRadiology { get; set; }
    public bool? HasPatientPortal { get; set; }
    public bool? HasHR { get; set; }
    public bool? HasReports { get; set; }
    public List<HospitalServiceItem>? Services { get; set; }
    public string? Website { get; set; }
    public string? FacebookUrl { get; set; }
    public string? InstagramUrl { get; set; }
    public string? LinkedInUrl { get; set; }
    [Required]
    public string AdminFirstName { get; set; } = string.Empty;
    [Required]
    public string AdminLastName { get; set; } = string.Empty;
    [Required]
    [EmailAddress]
    public string AdminEmail { get; set; } = string.Empty;
    [Required]
    public string AdminPhone { get; set; } = string.Empty;
    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
    public SubscriptionPlan Plan { get; set; } = SubscriptionPlan.Trial;
}

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;
    [Required]
    [MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}
public class HospitalServiceItem
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class PatientLoginRequest
{
    [Required]
    public string MobileNumber { get; set; } = string.Empty;
    [Required]
    public string HospitalCode { get; set; } = string.Empty;
    public string? DateOfBirth { get; set; }
}


public class PushSubscribeRequest
{
    public string Endpoint { get; set; } = string.Empty;
    public string P256dh   { get; set; } = string.Empty;
    public string Auth     { get; set; } = string.Empty;
}
