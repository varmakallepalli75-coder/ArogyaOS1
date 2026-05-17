using MedCareAxis.Core.DTOs.Response;
using MedCareAxis.Core.Enums;
using MedCareAxis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MedCareAxis.Infrastructure.Services;

public interface IDashboardService
{
    Task<ApiResponse<DashboardStatsResponse>> GetStatsAsync(Guid hospitalId);
}

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<DashboardStatsResponse>> GetStatsAsync(Guid hospitalId)
    {
        var today = DateTime.Today;
        var thisMonth = new DateTime(today.Year, today.Month, 1);

        // ─── Basic counts ──────────────────────────────
        var totalPatients = await _context.Patients
            .Where(p => p.HospitalId == hospitalId)
            .CountAsync();

        var todayApts = await _context.Appointments
            .Where(a => a.HospitalId == hospitalId
                && a.AppointmentDateTime.Date == today)
            .ToListAsync();

        var totalDoctors = await _context.Doctors
            .Where(d => d.HospitalId == hospitalId && d.IsActive)
            .CountAsync();

        var availableDoctors = await _context.Doctors
            .Where(d => d.HospitalId == hospitalId
                && d.IsActive && d.IsAvailable)
            .CountAsync();

        var totalDepartments = await _context.Departments
            .Where(d => d.HospitalId == hospitalId && d.IsActive)
            .CountAsync();

        var newPatientsThisMonth = await _context.Patients
            .Where(p => p.HospitalId == hospitalId
                && p.CreatedAt >= thisMonth)
            .CountAsync();

        var totalAppointmentsThisMonth = await _context.Appointments
            .Where(a => a.HospitalId == hospitalId
                && a.AppointmentDateTime >= thisMonth)
            .CountAsync();

        // ─── Department stats ──────────────────────────
        var deptStats = await _context.Departments
            .Where(d => d.HospitalId == hospitalId && d.IsActive)
            .Select(d => new DepartmentStatResponse
            {
                DepartmentName = d.Name,
                DoctorCount = d.Doctors.Count(doc => doc.IsActive),
                AppointmentCount = _context.Appointments
                    .Count(a => a.DepartmentId == d.Id
                        && a.AppointmentDateTime.Date == today)
            })
            .OrderByDescending(d => d.AppointmentCount)
            .Take(5)
            .ToListAsync();

        // ─── Recent appointments ───────────────────────
        var recentApts = await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .ThenInclude(d => d.Department)
            .Where(a => a.HospitalId == hospitalId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(5)
            .Select(a => new RecentAppointmentResponse
            {
                PatientName = a.Patient != null ? a.Patient.FullName : "",
                DoctorName = a.Doctor != null ? a.Doctor.FullName : "",
                DepartmentName = a.Doctor != null && a.Doctor.Department != null
                    ? a.Doctor.Department.Name : "",
                Status = a.Status.ToString(),
                AppointmentDateTime = a.AppointmentDateTime,
                TokenNumber = a.TokenNumber ?? ""
            })
            .ToListAsync();

        // ─── Monthly stats (last 6 months) ────────────
        var monthlyStats = new List<MonthlyStatResponse>();
        for (int i = 5; i >= 0; i--)
        {
            var month = today.AddMonths(-i);
            var monthStart = new DateTime(month.Year, month.Month, 1);
            var monthEnd = monthStart.AddMonths(1);

            var apts = await _context.Appointments
                .Where(a => a.HospitalId == hospitalId
                    && a.AppointmentDateTime >= monthStart
                    && a.AppointmentDateTime < monthEnd)
                .CountAsync();

            var newPts = await _context.Patients
                .Where(p => p.HospitalId == hospitalId
                    && p.CreatedAt >= monthStart
                    && p.CreatedAt < monthEnd)
                .CountAsync();

            monthlyStats.Add(new MonthlyStatResponse
            {
                Month = month.ToString("MMM yyyy"),
                Appointments = apts,
                NewPatients = newPts
            });
        }

        var stats = new DashboardStatsResponse
        {
            TotalPatients = totalPatients,
            TodayAppointments = todayApts.Count,
            TodayCompleted = todayApts.Count(a => a.Status == AppointmentStatus.Completed),
            TodayPending = todayApts.Count(a => a.Status == AppointmentStatus.Scheduled
                || a.Status == AppointmentStatus.Confirmed),
            TotalDoctors = totalDoctors,
            AvailableDoctors = availableDoctors,
            TotalDepartments = totalDepartments,
            NewPatientsThisMonth = newPatientsThisMonth,
            TotalAppointmentsThisMonth = totalAppointmentsThisMonth,
            DepartmentStats = deptStats,
            RecentAppointments = recentApts,
            MonthlyStats = monthlyStats
        };

        return ApiResponse<DashboardStatsResponse>.Ok(stats);
    }
}