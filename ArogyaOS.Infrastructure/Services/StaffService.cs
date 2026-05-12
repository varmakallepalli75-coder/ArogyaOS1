using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Core.DTOs.Response;
using ArogyaOS.Core.Enums;
using ArogyaOS.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace ArogyaOS.Infrastructure.Services;

public interface IStaffService
{
    Task<ApiResponse<List<StaffListResponse>>> GetAllAsync(Guid hospitalId, string search);
    Task<ApiResponse<StaffDetailResponse>> GetByIdAsync(string userId, Guid hospitalId);
    Task<ApiResponse<StaffDetailResponse>> CreateAsync(CreateStaffRequest request, Guid hospitalId);
    Task<ApiResponse<StaffDetailResponse>> UpdateAsync(string userId, UpdateStaffRequest request, Guid hospitalId);
    Task<ApiResponse<StaffDetailResponse>> UpdatePermissionsAsync(string userId, StaffPermissionsRequest request, Guid hospitalId);
    Task<ApiResponse<bool>> ToggleStatusAsync(string userId, Guid hospitalId);
    Task<ApiResponse<bool>> ResetPasswordAsync(string userId, string newPassword, Guid hospitalId);
}

public class StaffService : IStaffService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _context;
    private readonly IAuditService _audit;

    public StaffService(UserManager<AppUser> userManager, AppDbContext context, IAuditService audit)
    {
        _userManager = userManager;
        _context = context;
        _audit = audit;
    }

    public async Task<ApiResponse<List<StaffListResponse>>> GetAllAsync(Guid hospitalId, string search)
    {
        var query = _userManager.Users
            .Where(u => u.HospitalId == hospitalId && u.Role != UserRole.HospitalAdmin);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(u =>
                u.FirstName.Contains(search) ||
                u.LastName.Contains(search) ||
                (u.Email != null && u.Email.Contains(search)));

        var staff = await query
            .OrderBy(u => u.FirstName)
            .Select(u => new StaffListResponse
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                FullName = (u.FirstName + " " + u.LastName).Trim(),
                Email = u.Email ?? "",
                Phone = u.PhoneNumber ?? "",
                Role = u.Role,
                RoleLabel = u.Role.ToString(),
                Designation = u.Designation,
                IsActive = u.IsActive,
                IsExternal = u.IsExternal,
                CreatedAt = u.CreatedAt,
            })
            .ToListAsync();

        return ApiResponse<List<StaffListResponse>>.Ok(staff);
    }

    public async Task<ApiResponse<StaffDetailResponse>> GetByIdAsync(string userId, Guid hospitalId)
    {
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.HospitalId == hospitalId);

        if (user == null)
            return ApiResponse<StaffDetailResponse>.Fail("Staff member not found.");

        return ApiResponse<StaffDetailResponse>.Ok(MapDetail(user));
    }

    public async Task<ApiResponse<StaffDetailResponse>> CreateAsync(CreateStaffRequest request, Guid hospitalId)
    {
        if (await _userManager.FindByEmailAsync(request.Email) != null)
            return ApiResponse<StaffDetailResponse>.Fail("Email already in use.");

        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.Phone,
            Role = request.Role,
            HospitalId = hospitalId,
            Designation = request.Designation,
            IsActive = true,
            IsExternal = request.IsExternal,
            EmailConfirmed = true,
            PermPatients     = request.Permissions.PermPatients,
            PermAppointments = request.Permissions.PermAppointments,
            PermOPD          = request.Permissions.PermOPD,
            PermIPD          = request.Permissions.PermIPD,
            PermLab          = request.Permissions.PermLab,
            PermPharmacy     = request.Permissions.PermPharmacy,
            PermBilling      = request.Permissions.PermBilling,
            PermReports      = request.Permissions.PermReports,
            PermStaff        = request.Permissions.PermStaff,
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return ApiResponse<StaffDetailResponse>.Fail(
                "Failed to create staff account.",
                result.Errors.Select(e => e.Description).ToList());

        if (request.Role == UserRole.Doctor)
        {
            if (request.DepartmentId == null)
                return ApiResponse<StaffDetailResponse>.Fail("Department is required for doctor accounts.");

            var doctorCount = await _context.Doctors
                .Where(d => d.HospitalId == hospitalId).CountAsync();
            var employeeCode = $"DOC-{(doctorCount + 1):D3}";

            var doctor = new ArogyaOS.Core.Entities.Doctor
            {
                HospitalId         = hospitalId,
                UserId             = user.Id,
                EmployeeCode       = employeeCode,
                FirstName          = request.FirstName,
                LastName           = request.LastName,
                MobileNumber       = request.Phone ?? "",
                Email              = request.Email,
                DepartmentId       = request.DepartmentId.Value,
                Qualification      = request.Qualification ?? "",
                Specialization     = request.Specialization ?? "",
                RegistrationNumber = request.RegistrationNumber ?? "",
                ExperienceYears    = request.ExperienceYears,
                ConsultationFee    = request.ConsultationFee,
                IsActive           = true,
                IsAvailable        = true,
            };
            _context.Doctors.Add(doctor);
            await _context.SaveChangesAsync();
        }

        await _audit.LogAsync(hospitalId, "Staff", user.Id, AuditAction.Create,
            $"Created staff account for {user.FullName} ({request.Email}), Role: {request.Role}");

        return ApiResponse<StaffDetailResponse>.Ok(MapDetail(user), "Staff account created successfully.");
    }

    public async Task<ApiResponse<StaffDetailResponse>> UpdateAsync(string userId, UpdateStaffRequest request, Guid hospitalId)
    {
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.HospitalId == hospitalId);

        if (user == null)
            return ApiResponse<StaffDetailResponse>.Fail("Staff member not found.");

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.PhoneNumber = request.Phone;
        user.Role = request.Role;
        user.Designation = request.Designation;
        user.IsExternal = request.IsExternal;

        await _userManager.UpdateAsync(user);

        await _audit.LogAsync(hospitalId, "Staff", userId, AuditAction.Update,
            $"Updated profile for {user.FullName}");

        return ApiResponse<StaffDetailResponse>.Ok(MapDetail(user));
    }

    public async Task<ApiResponse<StaffDetailResponse>> UpdatePermissionsAsync(string userId, StaffPermissionsRequest request, Guid hospitalId)
    {
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.HospitalId == hospitalId);

        if (user == null)
            return ApiResponse<StaffDetailResponse>.Fail("Staff member not found.");

        user.PermPatients     = request.PermPatients;
        user.PermAppointments = request.PermAppointments;
        user.PermOPD          = request.PermOPD;
        user.PermIPD          = request.PermIPD;
        user.PermLab          = request.PermLab;
        user.PermPharmacy     = request.PermPharmacy;
        user.PermBilling      = request.PermBilling;
        user.PermReports      = request.PermReports;
        user.PermStaff        = request.PermStaff;

        await _userManager.UpdateAsync(user);

        await _audit.LogAsync(hospitalId, "Staff", userId, AuditAction.Update,
            $"Updated permissions for {user.FullName}");

        return ApiResponse<StaffDetailResponse>.Ok(MapDetail(user), "Permissions updated.");
    }

    public async Task<ApiResponse<bool>> ToggleStatusAsync(string userId, Guid hospitalId)
    {
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.HospitalId == hospitalId);

        if (user == null)
            return ApiResponse<bool>.Fail("Staff member not found.");

        user.IsActive = !user.IsActive;
        await _userManager.UpdateAsync(user);

        var status = user.IsActive ? "activated" : "deactivated";

        await _audit.LogAsync(hospitalId, "Staff", userId, AuditAction.Update,
            $"Account {status} for {user.FullName}");

        return ApiResponse<bool>.Ok(user.IsActive, $"Staff account {status}.");
    }

    public async Task<ApiResponse<bool>> ResetPasswordAsync(string userId, string newPassword, Guid hospitalId)
    {
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.HospitalId == hospitalId);

        if (user == null)
            return ApiResponse<bool>.Fail("Staff member not found.");

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, newPassword);

        if (!result.Succeeded)
            return ApiResponse<bool>.Fail("Failed to reset password.",
                result.Errors.Select(e => e.Description).ToList());

        await _audit.LogAsync(hospitalId, "Staff", userId, AuditAction.Update,
            $"Password reset for {user.FullName}");

        return ApiResponse<bool>.Ok(true, "Password reset successfully.");
    }

    private static StaffDetailResponse MapDetail(AppUser u) => new()
    {
        Id = u.Id,
        FirstName = u.FirstName,
        LastName = u.LastName,
        FullName = (u.FirstName + " " + u.LastName).Trim(),
        Email = u.Email ?? "",
        Phone = u.PhoneNumber ?? "",
        Role = u.Role,
        RoleLabel = u.Role.ToString(),
        Designation = u.Designation,
        IsActive = u.IsActive,
        IsExternal = u.IsExternal,
        CreatedAt = u.CreatedAt,
        PermPatients     = u.PermPatients,
        PermAppointments = u.PermAppointments,
        PermOPD          = u.PermOPD,
        PermIPD          = u.PermIPD,
        PermLab          = u.PermLab,
        PermPharmacy     = u.PermPharmacy,
        PermBilling      = u.PermBilling,
        PermReports      = u.PermReports,
        PermStaff        = u.PermStaff,
    };
}
