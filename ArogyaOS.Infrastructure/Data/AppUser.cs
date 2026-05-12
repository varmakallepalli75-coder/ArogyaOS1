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
    public Guid? DoctorId { get; set; }
    public Guid? StaffId { get; set; }
    public Guid? PatientId { get; set; }
    public string? Designation { get; set; }

    // ─── Status ────────────────────────────────────────
    public bool IsActive { get; set; } = true;
    public bool IsExternal { get; set; } = false;   // External partner (e.g. tied-up medical shop) — view-only, cannot dispense/sell
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    // ─── Staff Permissions ─────────────────────────────
    // HospitalAdmin: all true. Staff: set individually.
    public bool PermPatients { get; set; } = false;
    public bool PermAppointments { get; set; } = false;
    public bool PermOPD { get; set; } = false;
    public bool PermIPD { get; set; } = false;
    public bool PermLab { get; set; } = false;
    public bool PermPharmacy { get; set; } = false;
    public bool PermBilling { get; set; } = false;
    public bool PermReports { get; set; } = false;
    public bool PermStaff { get; set; } = false;
}