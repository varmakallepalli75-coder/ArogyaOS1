using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Core.DTOs.Response;
using ArogyaOS.Core.Entities;
using ArogyaOS.Core.Enums;
using ArogyaOS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArogyaOS.Infrastructure.Services;

public interface IAppointmentService
{
    Task<ApiResponse<AppointmentResponse>> CreateAsync(
        CreateAppointmentRequest request, Guid hospitalId);
    Task<ApiResponse<List<TodayAppointmentResponse>>> GetTodayAsync(
        Guid hospitalId, Guid? doctorId);
    Task<ApiResponse<PagedResponse<AppointmentResponse>>> GetAllAsync(
        Guid hospitalId, DateTime? date, Guid? doctorId, int page, int pageSize);
    Task<ApiResponse<AppointmentResponse>> UpdateStatusAsync(
        Guid id, UpdateAppointmentStatusRequest request, Guid hospitalId);
    Task<ApiResponse<PagedResponse<AppointmentResponse>>> GetByPatientAsync(Guid patientId, Guid hospitalId, int page, int pageSize);
    Task<ApiResponse<List<PatientJourneyResponse>>> GetTodayJourneyAsync(Guid patientId, Guid hospitalId);
    Task<ApiResponse<string>> CollectFeeAsync(Guid appointmentId, string paymentMode, Guid hospitalId);
}

public class JourneyStep
{
    public int Step { get; set; }
    public string Label { get; set; } = string.Empty;
    public bool Done { get; set; }
    public bool Active { get; set; }
    public DateTime? Time { get; set; }
}

public class PatientJourneyResponse
{
    public Guid Id { get; set; }
    public string AppointmentNumber { get; set; } = string.Empty;
    public string TokenNumber { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public DateTime AppointmentDateTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public int CurrentStep { get; set; }
    public bool HasVisit { get; set; }
    public bool HasBill { get; set; }
    public List<JourneyStep> Steps { get; set; } = new();
}

public class AppointmentService : IAppointmentService
{
    private readonly AppDbContext _context;
    private readonly IEmailService _email;
    private readonly IAuditService _audit;

    public AppointmentService(AppDbContext context, IEmailService email, IAuditService audit)
    {
        _context = context;
        _email   = email;
        _audit   = audit;
    }

    public async Task<ApiResponse<AppointmentResponse>> CreateAsync(
        CreateAppointmentRequest request, Guid hospitalId)
    {
        // ─── Verify patient exists ─────────────────────
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == request.PatientId
                && p.HospitalId == hospitalId);
        if (patient == null)
            return ApiResponse<AppointmentResponse>.Fail("Patient not found");

        // ─── Verify doctor exists ──────────────────────
        var doctor = await _context.Doctors
            .Include(d => d.Department)
            .FirstOrDefaultAsync(d => d.Id == request.DoctorId
                && d.HospitalId == hospitalId);
        if (doctor == null)
            return ApiResponse<AppointmentResponse>.Fail("Doctor not found");

        // ─── Generate appointment number ───────────────
        var count = await _context.Appointments
            .Where(a => a.HospitalId == hospitalId)
            .CountAsync();
        var appointmentNumber = $"APT-{DateTime.Now:yyyyMMdd}-{(count + 1):D4}";

        // ─── Generate token number ─────────────────────
        var todayCount = await _context.Appointments
            .Where(a => a.HospitalId == hospitalId
                && a.DoctorId == request.DoctorId
                && a.AppointmentDateTime.Date == request.AppointmentDateTime.Date)
            .CountAsync();
        var tokenNumber = $"T{(todayCount + 1):D3}";

        var appointment = new Appointment
        {
            HospitalId = hospitalId,
            AppointmentNumber = appointmentNumber,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            DepartmentId = request.DepartmentId,
            AppointmentDateTime = request.AppointmentDateTime,
            Status = AppointmentStatus.Scheduled,
            ConsultationType = (ConsultationType)request.ConsultationType,
            Priority = (PriorityLevel)request.Priority,
            ChiefComplaint = request.ChiefComplaint,
            Notes = request.Notes,
            TokenNumber = tokenNumber,
            IsWalkIn = request.IsWalkIn,
            ConsultationFee = doctor.ConsultationFee
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        await _audit.LogAsync(hospitalId, "Appointment", appointment.Id.ToString(), AuditAction.Create,
            $"Appointment booked for {patient.FullName} with Dr. {doctor.FullName} ({tokenNumber})");

        // Send confirmation email if patient has email (fire-and-forget)
        if (!string.IsNullOrEmpty(patient.Email))
        {
            var hospital = await _context.Hospitals.FindAsync(hospitalId);
            _ = _email.SendAppointmentConfirmationAsync(
                patient.Email,
                patient.FullName,
                doctor.FullName,
                doctor.Department?.Name ?? "General",
                appointment.AppointmentDateTime,
                hospital?.Name ?? "Hospital",
                tokenNumber);
        }

        return ApiResponse<AppointmentResponse>.Ok(
            new AppointmentResponse
            {
                Id = appointment.Id,
                AppointmentNumber = appointmentNumber,
                PatientId = patient.Id,
                PatientName = patient.FullName,
                PatientUHID = patient.UHID,
                PatientMobile = patient.MobileNumber,
                DoctorId = doctor.Id,
                DoctorName = doctor.FullName,
                DepartmentName = doctor.Department?.Name ?? "",
                AppointmentDateTime = appointment.AppointmentDateTime,
                Status = appointment.Status.ToString(),
                ConsultationType = appointment.ConsultationType.ToString(),
                Priority = appointment.Priority.ToString(),
                ChiefComplaint = appointment.ChiefComplaint,
                TokenNumber = tokenNumber,
                IsWalkIn = appointment.IsWalkIn,
                CreatedAt = appointment.CreatedAt
            },
            $"Appointment booked! Token: {tokenNumber}");
    }

    public async Task<ApiResponse<List<TodayAppointmentResponse>>> GetTodayAsync(
        Guid hospitalId, Guid? doctorId)
    {
        var today = DateTime.Today;
        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .ThenInclude(d => d.Department)
            .Where(a => a.HospitalId == hospitalId
                && a.AppointmentDateTime.Date == today
                && a.Status != AppointmentStatus.Cancelled);

        if (doctorId.HasValue)
            query = query.Where(a => a.DoctorId == doctorId.Value);

        var appointments = await query
            .OrderBy(a => a.AppointmentDateTime)
            .ToListAsync();

        var result = appointments.Select(a => new TodayAppointmentResponse
        {
            Id = a.Id,
            PatientId = a.PatientId,
            DoctorId = a.DoctorId,
            AppointmentNumber = a.AppointmentNumber,
            TokenNumber = a.TokenNumber ?? "",
            PatientName = a.Patient != null ? a.Patient.FullName : "",
            PatientUHID = a.Patient?.UHID ?? "",
            PatientMobile = a.Patient?.MobileNumber ?? "",
            PatientAge = a.Patient != null
                ? (int)((DateTime.UtcNow - a.Patient.DateOfBirth).TotalDays / 365.25)
                : 0,
            PatientGender = a.Patient?.Gender.ToString() ?? "",
            DoctorName = a.Doctor != null ? a.Doctor.FullName : "",
            DepartmentName = a.Doctor?.Department?.Name ?? "",
            AppointmentDateTime = a.AppointmentDateTime,
            Status = a.Status.ToString(),
            ChiefComplaint = a.ChiefComplaint,
            IsWalkIn = a.IsWalkIn,
            ConsultationFee = a.ConsultationFee,
            IsFeeCollected = a.IsFeeCollected,
            FeePaymentMode = a.FeePaymentMode,
            FeeReceiptNumber = a.FeeReceiptNumber
        }).ToList();

        return ApiResponse<List<TodayAppointmentResponse>>.Ok(result);
    }

    public async Task<ApiResponse<PagedResponse<AppointmentResponse>>> GetAllAsync(
        Guid hospitalId, DateTime? date, Guid? doctorId, int page, int pageSize)
    {
        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .ThenInclude(d => d.Department)
            .Where(a => a.HospitalId == hospitalId);

        if (date.HasValue)
            query = query.Where(a => a.AppointmentDateTime.Date == date.Value.Date);

        if (doctorId.HasValue)
            query = query.Where(a => a.DoctorId == doctorId.Value);

        var total = await query.CountAsync();

        var appointments = await query
            .OrderByDescending(a => a.AppointmentDateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = appointments.Select(a => new AppointmentResponse
        {
            Id = a.Id,
            AppointmentNumber = a.AppointmentNumber,
            PatientId = a.PatientId,
            PatientName = a.Patient != null ? a.Patient.FullName : "",
            PatientUHID = a.Patient?.UHID ?? "",
            PatientMobile = a.Patient?.MobileNumber ?? "",
            DoctorId = a.DoctorId,
            DoctorName = a.Doctor != null ? a.Doctor.FullName : "",
            DepartmentName = a.Doctor?.Department?.Name ?? "",
            AppointmentDateTime = a.AppointmentDateTime,
            Status = a.Status.ToString(),
            ConsultationType = a.ConsultationType.ToString(),
            Priority = a.Priority.ToString(),
            ChiefComplaint = a.ChiefComplaint,
            TokenNumber = a.TokenNumber,
            IsWalkIn = a.IsWalkIn,
            CancelledReason = a.CancelledReason,
            CreatedAt = a.CreatedAt
        }).ToList();

        return ApiResponse<PagedResponse<AppointmentResponse>>.Ok(
            new PagedResponse<AppointmentResponse>
            {
                Items = result,
                TotalCount = total,
                Page = page,
                PageSize = pageSize
            });
    }

    public async Task<ApiResponse<AppointmentResponse>> UpdateStatusAsync(
        Guid id, UpdateAppointmentStatusRequest request, Guid hospitalId)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .ThenInclude(d => d.Department)
            .FirstOrDefaultAsync(a => a.Id == id
                && a.HospitalId == hospitalId);

        if (appointment == null)
            return ApiResponse<AppointmentResponse>.Fail("Appointment not found");

        var oldStatus = appointment.Status.ToString();
        appointment.Status = (AppointmentStatus)request.Status;
        appointment.UpdatedAt = DateTime.UtcNow;

        // Stamp journey timestamps on status transitions
        if (request.Status == (int)AppointmentStatus.Confirmed && !appointment.CheckedInAt.HasValue)
            appointment.CheckedInAt = DateTime.UtcNow;
        if (request.Status == (int)AppointmentStatus.InProgress && !appointment.ConsultationStartedAt.HasValue)
            appointment.ConsultationStartedAt = DateTime.UtcNow;
        if (request.Status == (int)AppointmentStatus.Completed)
            appointment.CompletedAt = DateTime.UtcNow;

        if (request.Status == (int)AppointmentStatus.Cancelled)
        {
            appointment.CancelledReason = request.CancelledReason;
            appointment.CancelledAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        await _audit.LogAsync(hospitalId, "Appointment", appointment.Id.ToString(), AuditAction.Update,
            $"Appointment {appointment.AppointmentNumber} status changed: {oldStatus} → {appointment.Status}");

        return ApiResponse<AppointmentResponse>.Ok(
            new AppointmentResponse
            {
                Id = appointment.Id,
                AppointmentNumber = appointment.AppointmentNumber,
                PatientName = appointment.Patient?.FullName ?? "",
                DoctorName = appointment.Doctor?.FullName ?? "",
                Status = appointment.Status.ToString(),
                AppointmentDateTime = appointment.AppointmentDateTime,
                TokenNumber = appointment.TokenNumber,
                CreatedAt = appointment.CreatedAt
            }, "Status updated successfully");
    }

    public async Task<ApiResponse<PagedResponse<AppointmentResponse>>> GetByPatientAsync(
        Guid patientId, Guid hospitalId, int page, int pageSize)
    {
        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor).ThenInclude(d => d.Department)
            .Where(a => a.HospitalId == hospitalId && a.PatientId == patientId)
            .OrderByDescending(a => a.AppointmentDateTime);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AppointmentResponse
            {
                Id = a.Id,
                AppointmentNumber = a.AppointmentNumber,
                PatientId = a.PatientId,
                DoctorId = a.DoctorId,
                PatientName = a.Patient != null ? a.Patient.FullName : "",
                PatientUHID = a.Patient != null ? a.Patient.UHID : "",
                PatientMobile = a.Patient != null ? a.Patient.MobileNumber : "",
                DoctorName = a.Doctor != null ? a.Doctor.FullName : "",
                DepartmentName = a.Doctor != null && a.Doctor.Department != null ? a.Doctor.Department.Name : "",
                AppointmentDateTime = a.AppointmentDateTime,
                Status = a.Status.ToString(),
                ConsultationType = a.ConsultationType.ToString(),
                Priority = a.Priority.ToString(),
                ChiefComplaint = a.ChiefComplaint,
                TokenNumber = a.TokenNumber,
                IsWalkIn = a.IsWalkIn,
                CancelledReason = a.CancelledReason,
                CreatedAt = a.CreatedAt
            }).ToListAsync();

        return ApiResponse<PagedResponse<AppointmentResponse>>.Ok(
            new PagedResponse<AppointmentResponse>
            {
                Items = items,
                TotalCount = total,
                Page = page,
                PageSize = pageSize
            });
    }

    public async Task<ApiResponse<List<PatientJourneyResponse>>> GetTodayJourneyAsync(
        Guid patientId, Guid hospitalId)
    {
        var today = DateTime.Today;
        var appointments = await _context.Appointments
            .Include(a => a.Doctor).ThenInclude(d => d.Department)
            .Include(a => a.OPDVisit)
            .Where(a => a.PatientId == patientId
                && a.HospitalId == hospitalId
                && a.AppointmentDateTime.Date == today
                && a.Status != AppointmentStatus.Cancelled)
            .OrderBy(a => a.AppointmentDateTime)
            .ToListAsync();

        var visitIds = appointments
            .Where(a => a.OPDVisit != null)
            .Select(a => a.OPDVisit!.Id)
            .ToList();
        var billedVisitIds = visitIds.Count > 0
            ? await _context.Bills
                .Where(b => b.OPDVisitId != null && visitIds.Contains(b.OPDVisitId.Value))
                .Select(b => b.OPDVisitId!.Value)
                .ToListAsync()
            : new List<Guid>();

        var result = appointments.Select(a =>
        {
            var hasVisit = a.OPDVisit != null;
            var hasBill  = hasVisit && billedVisitIds.Contains(a.OPDVisit!.Id);

            // Determine current step (1-5)
            int currentStep;
            if (a.Status == AppointmentStatus.Completed) currentStep = 5;
            else if (hasBill)                             currentStep = 5;
            else if (hasVisit || a.PrescriptionReadyAt.HasValue) currentStep = 4;
            else if (a.Status == AppointmentStatus.InProgress)   currentStep = 3;
            else if (a.Status == AppointmentStatus.Confirmed)     currentStep = 2;
            else                                                   currentStep = 1;

            var steps = new List<JourneyStep>
            {
                new() { Step = 1, Label = "Registered",          Done = currentStep >= 1, Active = currentStep == 1, Time = a.CreatedAt },
                new() { Step = 2, Label = "Checked In",          Done = currentStep >= 2, Active = currentStep == 2, Time = a.CheckedInAt },
                new() { Step = 3, Label = "With Doctor",         Done = currentStep >= 3, Active = currentStep == 3, Time = a.ConsultationStartedAt },
                new() { Step = 4, Label = "Prescription Ready",  Done = currentStep >= 4, Active = currentStep == 4, Time = a.PrescriptionReadyAt ?? a.OPDVisit?.CreatedAt },
                new() { Step = 5, Label = "Done",                Done = currentStep >= 5, Active = currentStep == 5, Time = a.CompletedAt },
            };

            return new PatientJourneyResponse
            {
                Id                  = a.Id,
                AppointmentNumber   = a.AppointmentNumber,
                TokenNumber         = a.TokenNumber ?? "",
                DoctorName          = a.Doctor?.FullName ?? "",
                DepartmentName      = a.Doctor?.Department?.Name ?? "",
                AppointmentDateTime = a.AppointmentDateTime,
                Status              = a.Status.ToString(),
                CurrentStep         = currentStep,
                HasVisit            = hasVisit,
                HasBill             = hasBill,
                Steps               = steps
            };
        }).ToList();

        return ApiResponse<List<PatientJourneyResponse>>.Ok(result);
    }

    public async Task<ApiResponse<string>> CollectFeeAsync(
        Guid appointmentId, string paymentMode, Guid hospitalId)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Doctor)
            .FirstOrDefaultAsync(a => a.Id == appointmentId && a.HospitalId == hospitalId);

        if (appointment == null)
            return ApiResponse<string>.Fail("Appointment not found");

        if (appointment.IsFeeCollected)
            return ApiResponse<string>.Fail("Fee already collected for this appointment");

        // Auto-fill fee from doctor if not set
        if (appointment.ConsultationFee == 0 && appointment.Doctor != null)
            appointment.ConsultationFee = appointment.Doctor.ConsultationFee;

        // Generate receipt number: RCP-YYYYMMDD-XXXX
        var today = DateTime.UtcNow;
        var countToday = await _context.Appointments
            .CountAsync(a => a.HospitalId == hospitalId
                && a.IsFeeCollected
                && a.FeeCollectedAt.HasValue
                && a.FeeCollectedAt.Value.Date == today.Date);

        var receipt = $"RCP-{today:yyyyMMdd}-{(countToday + 1):D4}";

        appointment.IsFeeCollected = true;
        appointment.FeePaymentMode = paymentMode;
        appointment.FeeReceiptNumber = receipt;
        appointment.FeeCollectedAt = today;

        await _context.SaveChangesAsync();
        return ApiResponse<string>.Ok(receipt, "Fee collected successfully");
    }
}