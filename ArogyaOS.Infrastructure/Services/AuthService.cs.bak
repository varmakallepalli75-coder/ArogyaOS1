using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Core.DTOs.Response;
using ArogyaOS.Core.Entities;
using ArogyaOS.Core.Enums;
using ArogyaOS.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ArogyaOS.Infrastructure.Services;

public interface IAuthService
{
    Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request);
    Task<ApiResponse<RegisterHospitalResponse>> RegisterHospitalAsync(RegisterHospitalRequest request);
    Task<ApiResponse<LoginResponse>> RefreshTokenAsync(string refreshToken);
    Task<ApiResponse<LoginResponse>> PatientLoginAsync(PatientLoginRequest request);
}

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;

    public AuthService(
        UserManager<AppUser> userManager,
        AppDbContext context,
        ITokenService tokenService)
    {
        _userManager = userManager;
        _context = context;
        _tokenService = tokenService;
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
        if (user.HospitalId.HasValue)
        {
            var hospital = await _context.Hospitals
                .FirstOrDefaultAsync(h => h.Id == user.HospitalId);

            if (hospital == null || hospital.Status == HospitalStatus.Deactivated)
                return ApiResponse<LoginResponse>.Fail(
                    "Hospital account is deactivated.");

            if (hospital.Status == HospitalStatus.Suspended)
                return ApiResponse<LoginResponse>.Fail(
                    "Hospital account is suspended. Contact ArogyaOS support.");

            hospitalName = hospital.Name;
        }

        // ─── Generate Tokens ───────────────────────────
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        // ─── Save Refresh Token ────────────────────────
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

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
                ProfilePhotoUrl = user.ProfilePhotoUrl
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
        var hospitalCode = $"ARG-HOS-{(hospitalCount + 1):D4}";

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
            ExpiresAt = DateTime.UtcNow.AddDays(1),
            User = new UserInfo
            {
                Id = user.Id,
                FullName = $"{user.FirstName} {user.LastName}",
                Email = user.Email ?? "",
                Role = user.Role,
                HospitalId = user.HospitalId,
                DoctorId = user.DoctorId,
                StaffId = user.StaffId,
                PatientId = user.PatientId
            }
        });
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
    var token = _tokenService.GeneratePatientToken(
        patient, hospital);

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
    });
    }
}