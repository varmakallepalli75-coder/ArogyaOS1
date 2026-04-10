using ArogyaOS.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace ArogyaOS.Core.DTOs.Request;

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
