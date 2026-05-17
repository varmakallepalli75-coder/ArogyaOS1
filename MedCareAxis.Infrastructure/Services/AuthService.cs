using MedCareAxis.Core.DTOs.Request;
using MedCareAxis.Core.DTOs.Response;
using MedCareAxis.Core.Entities;
using MedCareAxis.Core.Entities;
using MedCareAxis.Core.Enums;
using MedCareAxis.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace MedCareAxis.Infrastructure.Services;

public interface IAuthService
{
    Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request);
    Task<ApiResponse<RegisterHospitalResponse>> RegisterHospitalAsync(RegisterHospitalRequest request);
    Task<ApiResponse<LoginResponse>> RefreshTokenAsync(string refreshToken);
    Task<ApiResponse<LoginResponse>> PatientLoginAsync(PatientLoginRequest request);
    Task<ApiResponse<UnifiedPatientResponse>> UnifiedPatientLoginAsync(UnifiedPatientLoginRequest request);
    Task<ApiResponse<bool>> LogoutAsync(string userId);
    Task<ApiResponse<bool>> ChangePasswordAsync(string userId, ChangePasswordRequest request);
}

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IAuditService _audit;

    public AuthService(
        UserManager<AppUser> userManager,
        AppDbContext context,
        ITokenService tokenService,
        IAuditService audit)
    {
        _userManager = userManager;
        _context = context;
        _tokenService = tokenService;
        _audit = audit;
    }

    public async Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request)
    {
        // ─── Find User ─────────────────────────────────
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return ApiResponse<LoginResponse>.Fail("Invalid email or password");

        // ─── Check Password ────────────────────────────
        var isPasswordValid = await _userManager
            .CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
            return ApiResponse<LoginResponse>.Fail("Invalid email or password");

        // ─── Check Active ──────────────────────────────
        if (!user.IsActive)
            return ApiResponse<LoginResponse>.Fail(
                "Your account has been deactivated. Contact support.");

        // ─── Check Hospital Status ─────────────────────
        string? hospitalName = null;
        Subscription? subscription = null;
        if (user.HospitalId.HasValue)
        {
            var hospital = await _context.Hospitals
                .Include(h => h.Subscription)
                .FirstOrDefaultAsync(h => h.Id == user.HospitalId);

            if (hospital == null || hospital.Status == HospitalStatus.Deactivated)
                return ApiResponse<LoginResponse>.Fail(
                    "Hospital account is deactivated.");

            if (hospital.Status == HospitalStatus.Suspended)
                return ApiResponse<LoginResponse>.Fail(
                    "Hospital account is suspended. Contact MedCareAxis support.");

            hospitalName = hospital.Name;
            subscription = hospital.Subscription;
        }

        // ─── Generate Tokens ───────────────────────────
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        // ─── Save Refresh Token ────────────────────────
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        await _audit.LogAsync(user.HospitalId, "AppUser", user.Id, AuditAction.Login,
            $"{user.FullName} logged in ({user.Role})",
            performedByOverride: user.Email ?? user.FullName);

        var expiryMinutes = 480;
        return ApiResponse<LoginResponse>.Ok(new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
            User = new UserInfo
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
                HasOPD = subscription?.HasOPD ?? true,
                HasIPD = subscription?.HasIPD ?? false,
                HasLab = subscription?.HasLab ?? false,
                HasPharmacy = subscription?.HasPharmacy ?? false,
                HasRadiology = subscription?.HasRadiology ?? false,
                HasBilling = subscription?.HasBilling ?? true,
                HasHR = subscription?.HasHR ?? false,
                HasReports = subscription?.HasReports ?? false,
                HasPatientPortal = subscription?.HasPatientPortal ?? false,
                HasOT = subscription?.HasOT ?? false,
                HasBloodBank = subscription?.HasBloodBank ?? false,
                HasAmbulance = subscription?.HasAmbulance ?? false,
                HasTeleConsult = subscription?.HasTeleConsult ?? false,
                HasInventory = subscription?.HasInventory ?? false,
                PermPatients     = user.Role == UserRole.HospitalAdmin || user.PermPatients,
                PermAppointments = user.Role == UserRole.HospitalAdmin || user.PermAppointments,
                PermOPD          = user.Role == UserRole.HospitalAdmin || user.PermOPD,
                PermIPD          = user.Role == UserRole.HospitalAdmin || user.PermIPD,
                PermLab          = user.Role == UserRole.HospitalAdmin || user.PermLab,
                PermPharmacy     = user.Role == UserRole.HospitalAdmin || user.PermPharmacy,
                PermBilling      = user.Role == UserRole.HospitalAdmin || user.PermBilling,
                PermReports      = user.Role == UserRole.HospitalAdmin || user.PermReports,
                PermStaff        = user.Role == UserRole.HospitalAdmin || user.PermStaff,
            }
        }, "Login successful");
    }

    public async Task<ApiResponse<RegisterHospitalResponse>> RegisterHospitalAsync(
        RegisterHospitalRequest request)
    {
        // ─── Check Email Exists ────────────────────────
        var existingUser = await _userManager
            .FindByEmailAsync(request.AdminEmail);
        if (existingUser != null)
            return ApiResponse<RegisterHospitalResponse>.Fail(
                "Email already registered.");

        // ─── Generate Hospital Code ────────────────────
        var hospitalCount = await _context.Hospitals.CountAsync();
        var hospitalCode = $"MCA-HOS-{(hospitalCount + 1):D4}";

        // ─── Create Hospital ───────────────────────────
        var hospital = new Hospital
        {
            HospitalCode = hospitalCode,
            Name = request.HospitalName,
            Phone = request.Phone,
            Email = request.HospitalEmail,
            Address = request.Address,
            City = request.City,
            State = request.State,
            PinCode = request.PinCode,
            GSTNumber = request.GSTNumber,
            TotalBeds = request.TotalBeds,
            HospitalType = request.HospitalType,
            AdminName = $"{request.AdminFirstName} {request.AdminLastName}",
            AdminEmail = request.AdminEmail,
            AdminPhone = request.AdminPhone,
            Status = HospitalStatus.Active
        };

        _context.Hospitals.Add(hospital);
        await _context.SaveChangesAsync();

        // ─── Create Subscription ───────────────────────
        var subscription = new Subscription
        {
            HospitalId = hospital.Id,
            Plan = request.Plan,
            Status = SubscriptionStatus.Trial,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(14),
            MonthlyAmount = request.Plan switch
            {
                SubscriptionPlan.Starter => 2999,
                SubscriptionPlan.Growth => 7999,
                SubscriptionPlan.Enterprise => 19999,
                _ => 0
            },
            FinalAmount = 0,
            HasOPD = true,
            HasIPD = request.Plan >= SubscriptionPlan.Growth,
            HasLab = request.Plan >= SubscriptionPlan.Growth,
            HasPharmacy = request.Plan >= SubscriptionPlan.Growth,
            HasBilling = true,
            HasPatientPortal = request.Plan >= SubscriptionPlan.Growth,
            HasReports = request.Plan >= SubscriptionPlan.Enterprise,
            MaxUsers = request.Plan switch
            {
                SubscriptionPlan.Starter => 5,
                SubscriptionPlan.Growth => 25,
                SubscriptionPlan.Enterprise => 100,
                _ => 3
            },
            MaxPatients = request.Plan switch
            {
                SubscriptionPlan.Starter => 500,
                SubscriptionPlan.Growth => 5000,
                SubscriptionPlan.Enterprise => 999999,
                _ => 100
            }
        };

        _context.Subscriptions.Add(subscription);

        // ─── Update Hospital with Subscription ─────────
        hospital.SubscriptionId = subscription.Id;
        await _context.SaveChangesAsync();

        // ─── Create Admin User ─────────────────────────
        var adminUser = new AppUser
        {
            UserName = request.AdminEmail,
            Email = request.AdminEmail,
            FirstName = request.AdminFirstName,
            LastName = request.AdminLastName,
            PhoneNumber = request.AdminPhone,
            Role = UserRole.HospitalAdmin,
            HospitalId = hospital.Id,
            IsActive = true,
            EmailConfirmed = true
        };

        var result = await _userManager
            .CreateAsync(adminUser, request.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors
                .Select(e => e.Description).ToList();
            return ApiResponse<RegisterHospitalResponse>
                .Fail("Failed to create admin user.", errors);
        }

        await _userManager.AddToRoleAsync(
            adminUser,
            UserRole.HospitalAdmin.ToString());

        return ApiResponse<RegisterHospitalResponse>.Ok(
            new RegisterHospitalResponse
            {
                HospitalId = hospital.Id,
                HospitalCode = hospitalCode,
                HospitalName = hospital.Name,
                AdminEmail = request.AdminEmail,
                Plan = request.Plan,
                Message = "Hospital registered successfully! " +
                          "14 day free trial activated."
            }, "Registration successful");
    }

    public async Task<ApiResponse<LoginResponse>> RefreshTokenAsync(
        string refreshToken)
    {
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken
                && u.RefreshTokenExpiry > DateTime.UtcNow);

        if (user == null)
            return ApiResponse<LoginResponse>.Fail(
                "Invalid or expired refresh token.");

        var accessToken = _tokenService.GenerateAccessToken(user);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        return ApiResponse<LoginResponse>.Ok(new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(480),
            User = new UserInfo
            {
                Id = user.Id,
                FullName = $"{user.FirstName} {user.LastName}",
                Email = user.Email ?? "",
                Role = user.Role,
                HospitalId = user.HospitalId,
                DoctorId = user.DoctorId,
                StaffId = user.StaffId,
                PatientId = user.PatientId,
                ProfilePhotoUrl = user.ProfilePhotoUrl
            }
        }, "Token refreshed");
    }

    public async Task<ApiResponse<LoginResponse>> PatientLoginAsync(
        PatientLoginRequest request)
    {
        // ─── Find hospital by code ─────────────────────
        var hospital = await _context.Hospitals
            .FirstOrDefaultAsync(h =>
                h.HospitalCode == request.HospitalCode);

        if (hospital == null)
            return ApiResponse<LoginResponse>.Fail(
                "Hospital not found");

        // ─── Find patient by mobile ────────────────────
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p =>
                p.HospitalId == hospital.Id &&
                p.MobileNumber == request.MobileNumber);

        if (patient == null)
            return ApiResponse<LoginResponse>.Fail(
                "Patient not found. Please register at the hospital first.");

        // ─── Verify DOB if provided ────────────────────
        if (!string.IsNullOrEmpty(request.DateOfBirth))
        {
            if (DateTime.TryParse(request.DateOfBirth, out var dob))
            {
                if (patient.DateOfBirth.Date != dob.Date)
                    return ApiResponse<LoginResponse>.Fail(
                        "Invalid date of birth");
            }
        }

        // ─── Generate token ────────────────────────────
        var token = _tokenService.GeneratePatientToken(patient, hospital);

        return ApiResponse<LoginResponse>.Ok(new LoginResponse
        {
            AccessToken = token,
            RefreshToken = "",
            ExpiresAt = DateTime.UtcNow.AddDays(1),
            User = new UserInfo
            {
                Id = patient.Id.ToString(),
                FullName = patient.FullName,
                Email = patient.MobileNumber,
                Role = UserRole.Patient,
                HospitalId = hospital.Id,
                HospitalName = hospital.Name,
                PatientId = patient.Id
            }
        }, "Login successful");
    }

    public async Task<ApiResponse<UnifiedPatientResponse>> UnifiedPatientLoginAsync(
        UnifiedPatientLoginRequest request)
    {
        if (!DateTime.TryParse(request.DateOfBirth, out var dob))
            return ApiResponse<UnifiedPatientResponse>.Fail("Invalid date of birth format.");

        // Find all patients across ALL hospitals matching mobile + DOB
        var patients = await _context.Patients
            .Include(p => p.Hospital)
            .Where(p => p.MobileNumber == request.MobileNumber
                     && p.DateOfBirth.Date == dob.Date)
            .ToListAsync();

        if (!patients.Any())
            return ApiResponse<UnifiedPatientResponse>.Fail(
                "No records found. Please check your mobile number and date of birth.");

        var fullName = patients.First().FullName;
        var records = patients
            .Select(p => (patient: p, hospital: p.Hospital!))
            .ToList();

        var token = _tokenService.GenerateUnifiedPatientToken(
            request.MobileNumber, fullName, records);

        var linkedHospitals = patients.Select(p => new LinkedHospitalInfo
        {
            HospitalId = p.HospitalId,
            HospitalCode = p.Hospital!.HospitalCode,
            HospitalName = p.Hospital.Name,
            City = p.Hospital.City ?? "",
            PatientId = p.Id,
            UHID = p.UHID
        }).ToList();

        return ApiResponse<UnifiedPatientResponse>.Ok(new UnifiedPatientResponse
        {
            AccessToken = token,
            ExpiresAt = DateTime.UtcNow.AddDays(1),
            FullName = fullName,
            MobileNumber = request.MobileNumber,
            LinkedHospitals = linkedHospitals
        }, $"Found records from {linkedHospitals.Count} hospital(s).");
    }

    public async Task<ApiResponse<bool>> LogoutAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return ApiResponse<bool>.Ok(true); // already gone, treat as success

        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        await _userManager.UpdateAsync(user);

        return ApiResponse<bool>.Ok(true, "Logged out successfully.");
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(string userId, ChangePasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return ApiResponse<bool>.Fail("User not found.");

        var result = await _userManager.ChangePasswordAsync(
            user, request.CurrentPassword, request.NewPassword);

        if (!result.Succeeded)
            return ApiResponse<bool>.Fail(
                "Failed to change password.",
                result.Errors.Select(e => e.Description).ToList());

        return ApiResponse<bool>.Ok(true, "Password changed successfully.");
    }
}
