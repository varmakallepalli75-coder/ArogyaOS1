using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Core.DTOs.Response;
using ArogyaOS.Core.Entities;
using ArogyaOS.Core.Enums;
using ArogyaOS.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ArogyaOS.Infrastructure.Services;

public interface ISuperAdminService
{
    Task<ApiResponse<PagedResponse<HospitalListResponse>>> GetAllHospitalsAsync(string? search, HospitalStatus? status, int page, int pageSize);
    Task<ApiResponse<HospitalDetailResponse>> GetHospitalByIdAsync(Guid hospitalId);
    Task<ApiResponse<bool>> UpdateHospitalStatusAsync(Guid hospitalId, HospitalStatus status, string reason);
    Task<ApiResponse<string>> ResetHospitalPasswordAsync(Guid hospitalId, string newPassword);
    Task<ApiResponse<bool>> UpdateSubscriptionAsync(Guid hospitalId, SubscriptionPlan plan);
    Task<ApiResponse<bool>> UpdateModulesAsync(Guid hospitalId, UpdateModulesRequest request);
    Task<ApiResponse<SuperAdminDashboardResponse>> GetDashboardAsync();
    Task<ApiResponse<RegisterHospitalResponse>> OnboardHospitalAsync(RegisterHospitalRequest request);

    // Analytics
    Task<ApiResponse<RevenueAnalyticsResponse>> GetAnalyticsAsync();

    // Announcements
    Task<ApiResponse<List<AnnouncementResponse>>> GetAnnouncementsAsync(bool activeOnly = false);
    Task<ApiResponse<AnnouncementResponse>> CreateAnnouncementAsync(string title, string body, string type, DateTime? expiresAt, string createdBy);
    Task<ApiResponse<bool>> ToggleAnnouncementAsync(Guid id);
    Task<ApiResponse<bool>> DeleteAnnouncementAsync(Guid id);

    // Payments
    Task<ApiResponse<List<SubscriptionPaymentResponse>>> GetPaymentsAsync(Guid? hospitalId, int limit);
    Task<ApiResponse<SubscriptionPaymentResponse>> RecordPaymentAsync(Guid hospitalId, decimal amount, string paymentMode, string? notes);

    // Health scores
    Task<ApiResponse<List<HospitalHealthResponse>>> GetHealthScoresAsync();

    // Platform audit logs
    Task<ApiResponse<PagedResponse<AuditLogResponse>>> GetPlatformAuditLogsAsync(int page, int pageSize, string? search);

    // Renewals
    Task<ApiResponse<List<RenewalAlertResponse>>> GetRenewalsAsync(int days);

    // Platform settings
    Task<ApiResponse<PlatformSettingsResponse>> GetSettingsAsync();
    Task<ApiResponse<PlatformSettingsResponse>> SaveSettingsAsync(PlatformSettingsResponse settings, string updatedBy);
}

public class SuperAdminService : ISuperAdminService
{
    private readonly AppDbContext _context;
    private readonly UserManager<AppUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _email;

    public SuperAdminService(
        AppDbContext context,
        UserManager<AppUser> userManager,
        ITokenService tokenService,
        IEmailService email)
    {
        _context = context;
        _userManager = userManager;
        _tokenService = tokenService;
        _email = email;
    }

    public async Task<ApiResponse<SuperAdminDashboardResponse>> GetDashboardAsync()
    {
        var totalHospitals = await _context.Hospitals.CountAsync();
        var activeHospitals = await _context.Hospitals.CountAsync(h => h.Status == HospitalStatus.Active);
        var suspendedHospitals = await _context.Hospitals.CountAsync(h => h.Status == HospitalStatus.Suspended);
        var pendingHospitals = await _context.Hospitals.CountAsync(h => h.Status == HospitalStatus.Pending);
        var totalPatients = await _context.Patients.CountAsync();
        var totalAppointments = await _context.Appointments.CountAsync();
        var totalRevenue = await _context.Subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active)
            .SumAsync(s => s.FinalAmount);
        var mrr = await _context.Subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active)
            .SumAsync(s => s.MonthlyAmount);
        var recentHospitals = await _context.Hospitals
            .OrderByDescending(h => h.CreatedAt)
            .Take(5)
            .Select(h => new HospitalListResponse
            {
                Id = h.Id,
                HospitalCode = h.HospitalCode,
                Name = h.Name,
                City = h.City,
                State = h.State,
                Status = h.Status.ToString(),
                AdminEmail = h.AdminEmail,
                AdminPhone = h.AdminPhone,
                TotalBeds = h.TotalBeds,
                CreatedAt = h.CreatedAt
            }).ToListAsync();

        return ApiResponse<SuperAdminDashboardResponse>.Ok(new SuperAdminDashboardResponse
        {
            TotalHospitals = totalHospitals,
            ActiveHospitals = activeHospitals,
            SuspendedHospitals = suspendedHospitals,
            PendingHospitals = pendingHospitals,
            TotalPatients = totalPatients,
            TotalAppointments = totalAppointments,
            TotalRevenue = totalRevenue,
            MRR = mrr,
            RecentHospitals = recentHospitals
        });
    }

    public async Task<ApiResponse<PagedResponse<HospitalListResponse>>> GetAllHospitalsAsync(
        string? search, HospitalStatus? status, int page, int pageSize)
    {
        var query = _context.Hospitals
            .Include(h => h.Subscription)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(h =>
                h.Name.Contains(search) ||
                h.HospitalCode.Contains(search) ||
                h.City.Contains(search) ||
                h.AdminEmail.Contains(search));

        if (status.HasValue)
            query = query.Where(h => h.Status == status.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(h => h.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(h => new HospitalListResponse
            {
                Id = h.Id,
                HospitalCode = h.HospitalCode,
                Name = h.Name,
                City = h.City,
                State = h.State,
                Phone = h.Phone,
                Email = h.Email,
                Status = h.Status.ToString(),
                AdminEmail = h.AdminEmail,
                AdminPhone = h.AdminPhone,
                TotalBeds = h.TotalBeds,
                HospitalType = h.HospitalType,
                Category = h.Category != null ? h.Category.ToString() : null,
                Plan = h.Subscription != null ? h.Subscription.Plan.ToString() : "None",
                SubscriptionStatus = h.Subscription != null ? h.Subscription.Status.ToString() : "None",
                SubscriptionEndDate = h.Subscription != null ? h.Subscription.EndDate : null,
                MonthlyAmount = h.Subscription != null ? h.Subscription.MonthlyAmount : 0,
                CreatedAt = h.CreatedAt
            }).ToListAsync();

        return ApiResponse<PagedResponse<HospitalListResponse>>.Ok(
            new PagedResponse<HospitalListResponse>
            {
                Items = items,
                TotalCount = total,
                Page = page,
                PageSize = pageSize
            });
    }

    public async Task<ApiResponse<HospitalDetailResponse>> GetHospitalByIdAsync(Guid hospitalId)
    {
        var hospital = await _context.Hospitals
            .Include(h => h.Subscription)
            .ThenInclude(s => s.Payments)
            .FirstOrDefaultAsync(h => h.Id == hospitalId);

        if (hospital == null)
            return ApiResponse<HospitalDetailResponse>.Fail("Hospital not found");

        var patientCount = await _context.Patients.CountAsync(p => p.HospitalId == hospitalId);
        var doctorCount = await _context.Doctors.CountAsync(d => d.HospitalId == hospitalId);
        var appointmentCount = await _context.Appointments.CountAsync(a => a.HospitalId == hospitalId);
        var adminUser = await _userManager.Users
            .FirstOrDefaultAsync(u => u.HospitalId == hospitalId && u.Role == UserRole.HospitalAdmin);

        return ApiResponse<HospitalDetailResponse>.Ok(new HospitalDetailResponse
        {
            Id = hospital.Id,
            HospitalCode = hospital.HospitalCode,
            Name = hospital.Name,
            Phone = hospital.Phone,
            Email = hospital.Email,
            Address = hospital.Address,
            City = hospital.City,
            District = hospital.District,
            State = hospital.State,
            PinCode = hospital.PinCode,
            GSTNumber = hospital.GSTNumber,
            TotalBeds = hospital.TotalBeds,
            HospitalType = hospital.HospitalType,
            Category = hospital.Category?.ToString(),
            Status = hospital.Status.ToString(),
            HasOPD = hospital.Subscription?.HasOPD ?? true,
            HasIPD = hospital.Subscription?.HasIPD ?? false,
            HasLab = hospital.Subscription?.HasLab ?? false,
            HasPharmacy = hospital.Subscription?.HasPharmacy ?? false,
            HasRadiology = hospital.Subscription?.HasRadiology ?? false,
            HasBilling = hospital.Subscription?.HasBilling ?? true,
            HasPatientPortal = hospital.Subscription?.HasPatientPortal ?? false,
            HasHR = hospital.Subscription?.HasHR ?? false,
            HasReports = hospital.Subscription?.HasReports ?? false,
            HasOT = hospital.Subscription?.HasOT ?? false,
            HasBloodBank = hospital.Subscription?.HasBloodBank ?? false,
            HasAmbulance = hospital.Subscription?.HasAmbulance ?? false,
            HasTeleConsult = hospital.Subscription?.HasTeleConsult ?? false,
            HasInventory = hospital.Subscription?.HasInventory ?? false,
            AdminName = hospital.AdminName,
            AdminEmail = hospital.AdminEmail,
            AdminPhone = hospital.AdminPhone,
            AdminUserId = adminUser?.Id,
            PatientCount = patientCount,
            DoctorCount = doctorCount,
            AppointmentCount = appointmentCount,
            Plan = hospital.Subscription?.Plan.ToString() ?? "None",
            SubscriptionStatus = hospital.Subscription?.Status.ToString() ?? "None",
            SubscriptionStart = hospital.Subscription?.StartDate,
            SubscriptionEnd = hospital.Subscription?.EndDate,
            MonthlyAmount = hospital.Subscription?.MonthlyAmount ?? 0,
            CreatedAt = hospital.CreatedAt
        });
    }

    public async Task<ApiResponse<bool>> UpdateHospitalStatusAsync(
        Guid hospitalId, HospitalStatus status, string reason)
    {
        var hospital = await _context.Hospitals.FindAsync(hospitalId);
        if (hospital == null)
            return ApiResponse<bool>.Fail("Hospital not found");

        var previousStatus = hospital.Status;
        hospital.Status = status;
        hospital.UpdatedAt = DateTime.UtcNow;

        // Log the action
        var auditLog = new AuditLog
        {
            EntityName = "Hospital",
            EntityId = hospitalId.ToString(),
            Action = AuditAction.Update,
            OldValues = previousStatus.ToString(),
            NewValues = status.ToString(),
            Notes = reason,
            CreatedAt = DateTime.UtcNow
        };
        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true,
            $"Hospital {status.ToString().ToLower()} successfully");
    }

    public async Task<ApiResponse<string>> ResetHospitalPasswordAsync(
        Guid hospitalId, string newPassword)
    {
        var adminUser = await _userManager.Users
            .FirstOrDefaultAsync(u =>
                u.HospitalId == hospitalId &&
                u.Role == UserRole.HospitalAdmin);

        if (adminUser == null)
            return ApiResponse<string>.Fail("Hospital admin not found");

        // Remove old password and set new one
        var removeResult = await _userManager.RemovePasswordAsync(adminUser);
        if (!removeResult.Succeeded)
            return ApiResponse<string>.Fail("Failed to reset password");

        var addResult = await _userManager.AddPasswordAsync(adminUser, newPassword);
        if (!addResult.Succeeded)
            return ApiResponse<string>.Fail(
                string.Join(", ", addResult.Errors.Select(e => e.Description)));

        // Log the action
        var auditLog = new AuditLog
        {
            EntityName = "AppUser",
            EntityId = adminUser.Id,
            Action = AuditAction.Update,
            Notes = $"Password reset for hospital {hospitalId} admin",
            CreatedAt = DateTime.UtcNow
        };
        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();

        return ApiResponse<string>.Ok(adminUser.Email ?? "",
            "Password reset successfully");
    }

    public async Task<ApiResponse<bool>> UpdateSubscriptionAsync(
        Guid hospitalId, SubscriptionPlan plan)
    {
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.HospitalId == hospitalId);

        if (subscription == null)
            return ApiResponse<bool>.Fail("Subscription not found");

        subscription.Plan = plan;
        subscription.MonthlyAmount = plan switch
        {
            SubscriptionPlan.Starter => 2999,
            SubscriptionPlan.Growth => 7999,
            SubscriptionPlan.Enterprise => 19999,
            _ => 0
        };
        subscription.HasIPD = plan >= SubscriptionPlan.Growth;
        subscription.HasLab = plan >= SubscriptionPlan.Growth;
        subscription.HasPharmacy = plan >= SubscriptionPlan.Growth;
        subscription.HasPatientPortal = plan >= SubscriptionPlan.Growth;
        subscription.HasReports = plan >= SubscriptionPlan.Enterprise;
        subscription.MaxUsers = plan switch
        {
            SubscriptionPlan.Starter => 5,
            SubscriptionPlan.Growth => 25,
            SubscriptionPlan.Enterprise => 100,
            _ => 3
        };
        subscription.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Subscription updated successfully");
    }

    public async Task<ApiResponse<bool>> UpdateModulesAsync(Guid hospitalId, UpdateModulesRequest request)
    {
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.HospitalId == hospitalId);

        if (subscription == null)
            return ApiResponse<bool>.Fail("Subscription not found");

        if (request.HasOPD.HasValue)        subscription.HasOPD = request.HasOPD.Value;
        if (request.HasIPD.HasValue)        subscription.HasIPD = request.HasIPD.Value;
        if (request.HasLab.HasValue)        subscription.HasLab = request.HasLab.Value;
        if (request.HasPharmacy.HasValue)   subscription.HasPharmacy = request.HasPharmacy.Value;
        if (request.HasRadiology.HasValue)  subscription.HasRadiology = request.HasRadiology.Value;
        if (request.HasBilling.HasValue)    subscription.HasBilling = request.HasBilling.Value;
        if (request.HasHR.HasValue)         subscription.HasHR = request.HasHR.Value;
        if (request.HasReports.HasValue)    subscription.HasReports = request.HasReports.Value;
        if (request.HasPatientPortal.HasValue) subscription.HasPatientPortal = request.HasPatientPortal.Value;
        if (request.HasOT.HasValue)         subscription.HasOT = request.HasOT.Value;
        if (request.HasBloodBank.HasValue)  subscription.HasBloodBank = request.HasBloodBank.Value;
        if (request.HasAmbulance.HasValue)  subscription.HasAmbulance = request.HasAmbulance.Value;
        if (request.HasTeleConsult.HasValue) subscription.HasTeleConsult = request.HasTeleConsult.Value;
        if (request.HasInventory.HasValue)  subscription.HasInventory = request.HasInventory.Value;
        subscription.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Modules updated successfully");
    }

    public async Task<ApiResponse<RegisterHospitalResponse>> OnboardHospitalAsync(
        RegisterHospitalRequest request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.AdminEmail);
        if (existingUser != null)
            return ApiResponse<RegisterHospitalResponse>.Fail("Admin email is already registered. Please use a different email.");

        var emailTaken = await _context.Hospitals
            .AnyAsync(h => h.Email == request.HospitalEmail);
        if (emailTaken)
            return ApiResponse<RegisterHospitalResponse>.Fail("A hospital with this email already exists.");

        var hospitalCount = await _context.Hospitals.CountAsync();
        var hospitalCode = $"ARG-HOS-{(hospitalCount + 1):D4}";

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
            Category = Enum.TryParse<HospitalCategory>(request.Category, true, out var cat)
                ? cat : (HospitalCategory?)null,
            AdminName = $"{request.AdminFirstName} {request.AdminLastName}",
            AdminEmail = request.AdminEmail,
            AdminPhone = request.AdminPhone,
            Status = HospitalStatus.Active
        };

        _context.Hospitals.Add(hospital);
        try { await _context.SaveChangesAsync(); }
        catch (Exception ex) when (ex.InnerException?.Message.Contains("duplicate") == true
                                || ex.InnerException?.Message.Contains("unique") == true)
        {
            return ApiResponse<RegisterHospitalResponse>.Fail("A hospital with this email or code already exists.");
        }

        var subscription = new Subscription
        {
            HospitalId = hospital.Id,
            Plan = request.Plan,
            Status = SubscriptionStatus.Trial,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            MonthlyAmount = request.Plan switch
            {
                SubscriptionPlan.Starter => 2999,
                SubscriptionPlan.Growth => 7999,
                SubscriptionPlan.Enterprise => 19999,
                _ => 0
            },
            FinalAmount = 0,
            HasOPD = request.HasOPD ?? true,
            HasIPD = request.HasIPD ?? (request.Plan >= SubscriptionPlan.Growth),
            HasLab = request.HasLab ?? (request.Plan >= SubscriptionPlan.Growth),
            HasPharmacy = request.HasPharmacy ?? (request.Plan >= SubscriptionPlan.Growth),
            HasRadiology = request.HasRadiology ?? false,
            HasBilling = true,
            HasPatientPortal = request.HasPatientPortal ?? (request.Plan >= SubscriptionPlan.Growth),
            HasHR = request.HasHR ?? false,
            HasReports = request.HasReports ?? (request.Plan >= SubscriptionPlan.Enterprise),
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
        hospital.SubscriptionId = subscription.Id;
        await _context.SaveChangesAsync();

        // ─── Create Departments (Services) ────────────────
        if (request.Services?.Any() == true)
        {
            var existingCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var svc in request.Services)
            {
                if (string.IsNullOrWhiteSpace(svc.Name)) continue;
                var code = svc.Code.ToUpper();
                if (!existingCodes.Add(code)) continue;
                _context.Departments.Add(new Department
                {
                    HospitalId = hospital.Id,
                    Code = code,
                    Name = svc.Name,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }
            await _context.SaveChangesAsync();
        }

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

        var result = await _userManager.CreateAsync(adminUser, request.Password);
        if (!result.Succeeded)
            return ApiResponse<RegisterHospitalResponse>.Fail(
                "Failed to create admin.", result.Errors.Select(e => e.Description).ToList());

        await _userManager.AddToRoleAsync(adminUser, UserRole.HospitalAdmin.ToString());

        // Audit log
        var auditLog = new AuditLog
        {
            EntityName = "Hospital",
            EntityId = hospital.Id.ToString(),
            Action = AuditAction.Create,
            Notes = $"Hospital onboarded by Super Admin",
            CreatedAt = DateTime.UtcNow
        };
        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();

        // Send welcome email (fire-and-forget — don't block on email failure)
        _ = _email.SendWelcomeEmailAsync(
            request.AdminEmail,
            $"{request.AdminFirstName} {request.AdminLastName}",
            hospital.Name,
            hospitalCode,
            request.Password);

        return ApiResponse<RegisterHospitalResponse>.Ok(new RegisterHospitalResponse
        {
            HospitalId = hospital.Id,
            HospitalCode = hospitalCode,
            HospitalName = hospital.Name,
            AdminEmail = request.AdminEmail,
            Plan = request.Plan,
            Message = $"Hospital onboarded successfully! Code: {hospitalCode}"
        }, "Onboarding successful");
    }

    // ─── Analytics ────────────────────────────────────────────────────────────
    public async Task<ApiResponse<RevenueAnalyticsResponse>> GetAnalyticsAsync()
    {
        var now = DateTime.UtcNow;
        var twelveMonthsAgo = now.AddMonths(-11);
        var startOfMonth = new DateTime(now.Year, now.Month, 1);

        // Monthly subscription payments for last 12 months
        var paymentsRaw = await _context.SubscriptionPayments
            .Where(p => p.PaidOn >= new DateTime(twelveMonthsAgo.Year, twelveMonthsAgo.Month, 1))
            .GroupBy(p => new { p.PaidOn.Year, p.PaidOn.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Amount = g.Sum(p => p.Amount), Count = g.Count() })
            .OrderBy(p => p.Year).ThenBy(p => p.Month)
            .ToListAsync();
        var payments = paymentsRaw.Select(p => new MonthlyRevenuePoint
        {
            Month = $"{p.Year}-{p.Month:D2}",
            Amount = p.Amount,
            Count = p.Count
        }).ToList();

        // Hospital growth (new hospitals per month)
        var growthRaw = await _context.Hospitals
            .Where(h => h.CreatedAt >= new DateTime(twelveMonthsAgo.Year, twelveMonthsAgo.Month, 1))
            .GroupBy(h => new { h.CreatedAt.Year, h.CreatedAt.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() })
            .OrderBy(p => p.Year).ThenBy(p => p.Month)
            .ToListAsync();
        var growth = growthRaw.Select(p => new MonthlyRevenuePoint
        {
            Month = $"{p.Year}-{p.Month:D2}",
            Amount = 0,
            Count = p.Count
        }).ToList();

        // Plan distribution
        var planDist = await _context.Subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active || s.Status == SubscriptionStatus.Trial)
            .GroupBy(s => s.Plan)
            .Select(g => new PlanDistributionItem
            {
                Plan = g.Key.ToString(),
                Count = g.Count(),
                Revenue = g.Sum(s => s.MonthlyAmount)
            })
            .ToListAsync();

        var totalCollected = await _context.SubscriptionPayments.SumAsync(p => p.Amount);
        var mrr = await _context.Subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active)
            .SumAsync(s => s.MonthlyAmount);

        var newThisMonth = await _context.Hospitals
            .CountAsync(h => h.CreatedAt >= startOfMonth);
        var churnedThisMonth = await _context.Subscriptions
            .CountAsync(s => s.Status == SubscriptionStatus.Cancelled &&
                             s.UpdatedAt >= startOfMonth);

        return ApiResponse<RevenueAnalyticsResponse>.Ok(new RevenueAnalyticsResponse
        {
            MonthlyRevenue = payments,
            PlanDistribution = planDist,
            HospitalGrowth = growth,
            TotalCollected = totalCollected,
            ProjectedAnnual = mrr * 12,
            NewThisMonth = newThisMonth,
            ChurnedThisMonth = churnedThisMonth
        });
    }

    // ─── Announcements ────────────────────────────────────────────────────────
    public async Task<ApiResponse<List<AnnouncementResponse>>> GetAnnouncementsAsync(bool activeOnly = false)
    {
        var query = _context.Announcements.AsQueryable();
        if (activeOnly)
            query = query.Where(a => a.IsActive && (a.ExpiresAt == null || a.ExpiresAt > DateTime.UtcNow));

        var list = await query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AnnouncementResponse
            {
                Id = a.Id, Title = a.Title, Body = a.Body, Type = a.Type,
                IsActive = a.IsActive, ExpiresAt = a.ExpiresAt,
                CreatedBy = a.CreatedBy, CreatedAt = a.CreatedAt
            }).ToListAsync();

        return ApiResponse<List<AnnouncementResponse>>.Ok(list);
    }

    public async Task<ApiResponse<AnnouncementResponse>> CreateAnnouncementAsync(
        string title, string body, string type, DateTime? expiresAt, string createdBy)
    {
        var ann = new Announcement
        {
            Title = title, Body = body, Type = type,
            ExpiresAt = expiresAt, CreatedBy = createdBy
        };
        _context.Announcements.Add(ann);
        await _context.SaveChangesAsync();

        return ApiResponse<AnnouncementResponse>.Ok(new AnnouncementResponse
        {
            Id = ann.Id, Title = ann.Title, Body = ann.Body, Type = ann.Type,
            IsActive = ann.IsActive, ExpiresAt = ann.ExpiresAt,
            CreatedBy = ann.CreatedBy, CreatedAt = ann.CreatedAt
        }, "Announcement created");
    }

    public async Task<ApiResponse<bool>> ToggleAnnouncementAsync(Guid id)
    {
        var ann = await _context.Announcements.FindAsync(id);
        if (ann == null) return ApiResponse<bool>.Fail("Not found");
        ann.IsActive = !ann.IsActive;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.Ok(ann.IsActive);
    }

    public async Task<ApiResponse<bool>> DeleteAnnouncementAsync(Guid id)
    {
        var ann = await _context.Announcements.FindAsync(id);
        if (ann == null) return ApiResponse<bool>.Fail("Not found");
        _context.Announcements.Remove(ann);
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Deleted");
    }

    // ─── Payments ─────────────────────────────────────────────────────────────
    public async Task<ApiResponse<List<SubscriptionPaymentResponse>>> GetPaymentsAsync(
        Guid? hospitalId, int limit)
    {
        var query = _context.SubscriptionPayments
            .Include(p => p.Subscription!.Hospital)
            .AsQueryable();

        if (hospitalId.HasValue)
            query = query.Where(p => p.HospitalId == hospitalId.Value);

        var list = await query
            .OrderByDescending(p => p.PaidOn)
            .Take(limit)
            .Select(p => new SubscriptionPaymentResponse
            {
                Id = p.Id,
                HospitalId = p.HospitalId,
                HospitalName = p.Subscription!.Hospital!.Name,
                HospitalCode = p.Subscription!.Hospital!.HospitalCode,
                Amount = p.Amount,
                PaidOn = p.PaidOn,
                PaymentMode = p.PaymentMode.ToString(),
                InvoiceNumber = p.InvoiceNumber,
                Notes = p.Notes
            }).ToListAsync();

        return ApiResponse<List<SubscriptionPaymentResponse>>.Ok(list);
    }

    public async Task<ApiResponse<SubscriptionPaymentResponse>> RecordPaymentAsync(
        Guid hospitalId, decimal amount, string paymentMode, string? notes)
    {
        var sub = await _context.Subscriptions
            .Include(s => s.Hospital)
            .FirstOrDefaultAsync(s => s.HospitalId == hospitalId);
        if (sub == null) return ApiResponse<SubscriptionPaymentResponse>.Fail("Hospital subscription not found");

        if (!Enum.TryParse<PaymentMode>(paymentMode, out var mode))
            mode = PaymentMode.Cash;

        var invoiceCount = await _context.SubscriptionPayments.CountAsync() + 1;
        var payment = new SubscriptionPayment
        {
            SubscriptionId = sub.Id,
            HospitalId = hospitalId,
            Amount = amount,
            PaidOn = DateTime.UtcNow,
            PaymentMode = mode,
            InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMM}-{invoiceCount:D4}",
            Notes = notes
        };
        _context.SubscriptionPayments.Add(payment);
        await _context.SaveChangesAsync();

        return ApiResponse<SubscriptionPaymentResponse>.Ok(new SubscriptionPaymentResponse
        {
            Id = payment.Id,
            HospitalId = hospitalId,
            HospitalName = sub.Hospital!.Name,
            HospitalCode = sub.Hospital!.HospitalCode,
            Amount = payment.Amount,
            PaidOn = payment.PaidOn,
            PaymentMode = payment.PaymentMode.ToString(),
            InvoiceNumber = payment.InvoiceNumber,
            Notes = payment.Notes
        }, "Payment recorded");
    }

    // ─── Health Scores ────────────────────────────────────────────────────────
    public async Task<ApiResponse<List<HospitalHealthResponse>>> GetHealthScoresAsync()
    {
        var hospitals = await _context.Hospitals
            .Include(h => h.Subscription)
            .ToListAsync();

        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var results = new List<HospitalHealthResponse>();

        foreach (var h in hospitals)
        {
            var admin = await _context.Users
                .Where(u => u.HospitalId == h.Id && u.Role == UserRole.HospitalAdmin)
                .OrderByDescending(u => u.LastLoginAt)
                .FirstOrDefaultAsync();

            var patientsThisMonth = await _context.Patients
                .CountAsync(p => p.HospitalId == h.Id && p.CreatedAt >= startOfMonth);
            var apptThisMonth = await _context.Appointments
                .CountAsync(a => a.HospitalId == h.Id && a.CreatedAt >= startOfMonth);

            var subActive = h.Subscription?.Status == SubscriptionStatus.Active;
            var lastLogin = admin?.LastLoginAt;

            int score = 0;
            var warnings = new List<string>();

            if (subActive) score += 20;
            else warnings.Add("Subscription not active");

            if (lastLogin.HasValue)
            {
                var daysAgo = (DateTime.UtcNow - lastLogin.Value).TotalDays;
                if (daysAgo <= 7) score += 30;
                else if (daysAgo <= 30) score += 15;
                else warnings.Add($"No login in {(int)daysAgo} days");
            }
            else warnings.Add("Admin has never logged in");

            if (patientsThisMonth > 0) score += 25;
            else warnings.Add("No new patients this month");

            if (apptThisMonth > 0) score += 25;
            else warnings.Add("No appointments this month");

            var label = score >= 80 ? "Healthy" : score >= 50 ? "At Risk" : "Inactive";

            results.Add(new HospitalHealthResponse
            {
                Id = h.Id,
                HospitalCode = h.HospitalCode,
                Name = h.Name,
                Status = h.Status.ToString(),
                Plan = h.Subscription?.Plan.ToString() ?? "None",
                HealthScore = score,
                HealthLabel = label,
                LastAdminLogin = lastLogin,
                PatientsThisMonth = patientsThisMonth,
                AppointmentsThisMonth = apptThisMonth,
                SubscriptionActive = subActive,
                SubscriptionEnd = h.Subscription?.EndDate,
                Warnings = warnings
            });
        }

        return ApiResponse<List<HospitalHealthResponse>>.Ok(
            results.OrderBy(r => r.HealthScore).ToList());
    }

    // ─── Platform Audit Logs ──────────────────────────────────────────────────
    public async Task<ApiResponse<PagedResponse<AuditLogResponse>>> GetPlatformAuditLogsAsync(
        int page, int pageSize, string? search)
    {
        var query = _context.AuditLogs
            .OrderByDescending(l => l.CreatedAt)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(l =>
                l.EntityName.Contains(search) ||
                (l.PerformedBy != null && l.PerformedBy.Contains(search)) ||
                (l.Notes != null && l.Notes.Contains(search)));

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new AuditLogResponse
            {
                Id = l.Id, EntityName = l.EntityName, EntityId = l.EntityId,
                Action = l.Action.ToString(), Notes = l.Notes,
                OldValues = l.OldValues, NewValues = l.NewValues,
                PerformedBy = l.PerformedBy, IpAddress = l.IpAddress,
                CreatedAt = l.CreatedAt
            }).ToListAsync();

        return ApiResponse<PagedResponse<AuditLogResponse>>.Ok(new PagedResponse<AuditLogResponse>
        {
            Items = items, Page = page, PageSize = pageSize, TotalCount = total
        });
    }

    // ─── Renewals ─────────────────────────────────────────────────────────────
    public async Task<ApiResponse<List<RenewalAlertResponse>>> GetRenewalsAsync(int days)
    {
        var cutoff = DateTime.UtcNow.AddDays(days);
        var now    = DateTime.UtcNow;

        var subs = await _context.Subscriptions
            .Include(s => s.Hospital)
            .Where(s => s.Status == SubscriptionStatus.Active
                     && s.EndDate <= cutoff
                     && s.EndDate >= now)
            .OrderBy(s => s.EndDate)
            .ToListAsync();

        var result = subs.Select(s =>
        {
            var daysLeft = (int)(s.EndDate - now).TotalDays;
            return new RenewalAlertResponse
            {
                HospitalId    = s.HospitalId,
                HospitalCode  = s.Hospital!.HospitalCode,
                Name          = s.Hospital.Name,
                AdminEmail    = s.Hospital.AdminEmail,
                AdminPhone    = s.Hospital.AdminPhone ?? "",
                Plan          = s.Plan.ToString(),
                MonthlyAmount = s.MonthlyAmount,
                SubscriptionEnd = s.EndDate,
                DaysRemaining = daysLeft,
                Urgency = daysLeft <= 7 ? "Critical" : daysLeft <= 15 ? "Warning" : "Upcoming"
            };
        }).ToList();

        return ApiResponse<List<RenewalAlertResponse>>.Ok(result);
    }

    // ─── Platform Settings ────────────────────────────────────────────────────
    private static readonly Dictionary<string, string> _defaults = new()
    {
        ["MaintenanceMode"]    = "false",
        ["MaintenanceMessage"] = "ArogyaOS is under scheduled maintenance. We'll be back shortly.",
        ["SupportEmail"]       = "support@arogyaos.com",
        ["PlatformVersion"]    = "1.0.0",
        ["TermsUrl"]           = "",
        ["PrivacyUrl"]         = "",
    };

    public async Task<ApiResponse<PlatformSettingsResponse>> GetSettingsAsync()
    {
        var stored = await _context.PlatformSettings.ToListAsync();
        var map = stored.ToDictionary(s => s.Key, s => s.Value);

        string Get(string key) => map.TryGetValue(key, out var v) ? v : _defaults.GetValueOrDefault(key, "");

        var latest = stored.OrderByDescending(s => s.UpdatedAt).FirstOrDefault();
        return ApiResponse<PlatformSettingsResponse>.Ok(new PlatformSettingsResponse
        {
            MaintenanceMode    = Get("MaintenanceMode") == "true",
            MaintenanceMessage = Get("MaintenanceMessage"),
            SupportEmail       = Get("SupportEmail"),
            PlatformVersion    = Get("PlatformVersion"),
            TermsUrl           = Get("TermsUrl"),
            PrivacyUrl         = Get("PrivacyUrl"),
            UpdatedAt          = latest?.UpdatedAt ?? DateTime.UtcNow,
            UpdatedBy          = latest?.UpdatedBy ?? ""
        });
    }

    public async Task<ApiResponse<PlatformSettingsResponse>> SaveSettingsAsync(
        PlatformSettingsResponse settings, string updatedBy)
    {
        var toSave = new Dictionary<string, string>
        {
            ["MaintenanceMode"]    = settings.MaintenanceMode ? "true" : "false",
            ["MaintenanceMessage"] = settings.MaintenanceMessage,
            ["SupportEmail"]       = settings.SupportEmail,
            ["PlatformVersion"]    = settings.PlatformVersion,
            ["TermsUrl"]           = settings.TermsUrl,
            ["PrivacyUrl"]         = settings.PrivacyUrl,
        };

        var existing = await _context.PlatformSettings.ToListAsync();
        foreach (var kv in toSave)
        {
            var row = existing.FirstOrDefault(s => s.Key == kv.Key);
            if (row == null)
                _context.PlatformSettings.Add(new PlatformSetting { Key = kv.Key, Value = kv.Value, UpdatedBy = updatedBy });
            else
            { row.Value = kv.Value; row.UpdatedAt = DateTime.UtcNow; row.UpdatedBy = updatedBy; }
        }
        await _context.SaveChangesAsync();
        return await GetSettingsAsync();
    }
}
