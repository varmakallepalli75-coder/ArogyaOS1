using MedCareAxis.Core.DTOs.Response;
using MedCareAxis.Core.Entities;
using MedCareAxis.Core.Enums;
using MedCareAxis.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MedCareAxis.API.Controllers;

/// <summary>
/// Returns the current user's live role / permissions / enabled modules so the
/// frontend can re-hydrate a logged-in session — e.g. after an admin edits a
/// staff member's permissions — without forcing a logout/login.
/// </summary>
[ApiController]
[Route("api/me")]
[Authorize]
public class MeController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _context;

    public MeController(UserManager<AppUser> userManager, AppDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null || !user.IsActive)
            return Unauthorized();

        string? hospitalName = null;
        Subscription? sub = null;
        if (user.HospitalId.HasValue)
        {
            var hospital = await _context.Hospitals
                .Include(h => h.Subscription)
                .FirstOrDefaultAsync(h => h.Id == user.HospitalId);
            hospitalName = hospital?.Name;
            sub = hospital?.Subscription;
        }

        var isAdmin = user.Role == UserRole.HospitalAdmin || user.Role == UserRole.Manager;

        return Ok(ApiResponse<UserInfo>.Ok(new UserInfo
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? "",
            Role = user.Role,
            HospitalId = user.HospitalId,
            HospitalName = hospitalName,
            DoctorId = user.DoctorId,
            StaffId = user.StaffId,
            PatientId = user.PatientId,
            ProfilePhotoUrl = user.ProfilePhotoUrl,
            HasOPD = sub?.HasOPD ?? true,
            HasIPD = sub?.HasIPD ?? false,
            HasLab = sub?.HasLab ?? false,
            HasPharmacy = sub?.HasPharmacy ?? false,
            HasRadiology = sub?.HasRadiology ?? false,
            HasBilling = sub?.HasBilling ?? true,
            HasHR = sub?.HasHR ?? false,
            HasReports = sub?.HasReports ?? false,
            HasPatientPortal = sub?.HasPatientPortal ?? false,
            HasOT = sub?.HasOT ?? false,
            HasBloodBank = sub?.HasBloodBank ?? false,
            HasAmbulance = sub?.HasAmbulance ?? false,
            HasTeleConsult = sub?.HasTeleConsult ?? false,
            HasInventory = sub?.HasInventory ?? false,
            PermPatients     = isAdmin || user.PermPatients,
            PermAppointments = isAdmin || user.PermAppointments,
            PermOPD          = isAdmin || user.PermOPD,
            PermIPD          = isAdmin || user.PermIPD,
            PermLab          = isAdmin || user.PermLab,
            PermPharmacy     = isAdmin || user.PermPharmacy,
            PermBilling      = isAdmin || user.PermBilling,
            PermReports      = isAdmin || user.PermReports,
            PermStaff        = isAdmin || user.PermStaff,
        }));
    }
}
