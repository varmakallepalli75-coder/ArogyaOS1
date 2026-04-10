using ArogyaOS.Core.Enums;
using Microsoft.AspNetCore.Identity;

namespace ArogyaOS.Infrastructure.Data;

public class AppUser : IdentityUser
{
    // ─── Basic Info ────────────────────────────────────
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();

    // ─── Role & Tenant ─────────────────────────────────
    public UserRole Role { get; set; }
    public Guid? HospitalId { get; set; }              // Null for SuperAdmin
    public string? ProfilePhotoUrl { get; set; }

    // ─── Linked Entities ───────────────────────────────
    public Guid? DoctorId { get; set; }                // If user is a doctor
    public Guid? StaffId { get; set; }                 // If user is staff
    public Guid? PatientId { get; set; }               // If user is a patient

    // ─── Status ────────────────────────────────────────
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
}