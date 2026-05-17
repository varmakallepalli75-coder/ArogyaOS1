using MedCareAxis.Core.DTOs.Response;
using MedCareAxis.Core.Enums;
using MedCareAxis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MedCareAxis.Infrastructure.Services;

public class ReportSummaryResponse
{
    public int TotalAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public int CancelledAppointments { get; set; }
    public int NewPatients { get; set; }
    public int OPDVisits { get; set; }
    public int LabOrders { get; set; }
    public int PrescriptionsIssued { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal PaidRevenue { get; set; }
    public int BillsGenerated { get; set; }
}

public class AppointmentReportRow
{
    public string AppointmentNumber { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string PatientUHID { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public DateTime AppointmentDateTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ConsultationType { get; set; } = string.Empty;
    public string? ChiefComplaint { get; set; }
    public string? TokenNumber { get; set; }
}

public class OPDReportRow
{
    public string VisitNumber { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string PatientUHID { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string? Diagnosis { get; set; }
    public string? BloodPressure { get; set; }
    public string? PulseRate { get; set; }
    public string? Temperature { get; set; }
    public string PrescriptionNumber { get; set; } = string.Empty;
    public DateTime VisitDate { get; set; }
}

public class BillingReportRow
{
    public string BillNumber { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string PatientUHID { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime BillDate { get; set; }
}

public class DailyStatRow
{
    public string Date { get; set; } = string.Empty;
    public int Appointments { get; set; }
    public int Completed { get; set; }
    public int NewPatients { get; set; }
    public decimal Revenue { get; set; }
}

public interface IReportService
{
    Task<ApiResponse<ReportSummaryResponse>> GetSummaryAsync(Guid hospitalId, DateTime from, DateTime to);
    Task<ApiResponse<List<AppointmentReportRow>>> GetAppointmentsAsync(Guid hospitalId, DateTime from, DateTime to, string? doctorId, string? status);
    Task<ApiResponse<List<OPDReportRow>>> GetOPDAsync(Guid hospitalId, DateTime from, DateTime to);
    Task<ApiResponse<List<BillingReportRow>>> GetBillingAsync(Guid hospitalId, DateTime from, DateTime to);
    Task<ApiResponse<List<DailyStatRow>>> GetDailyTrendAsync(Guid hospitalId, DateTime from, DateTime to);
}

public class ReportService : IReportService
{
    private readonly AppDbContext _context;

    public ReportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<ReportSummaryResponse>> GetSummaryAsync(
        Guid hospitalId, DateTime from, DateTime to)
    {
        var toEnd = to.Date.AddDays(1);

        var appointments = await _context.Appointments
            .Where(a => a.HospitalId == hospitalId
                && a.AppointmentDateTime >= from.Date
                && a.AppointmentDateTime < toEnd)
            .ToListAsync();

        var newPatients = await _context.Patients
            .Where(p => p.HospitalId == hospitalId
                && p.CreatedAt >= from.Date && p.CreatedAt < toEnd)
            .CountAsync();

        var opdVisits = await _context.OPDVisits
            .Where(v => v.HospitalId == hospitalId
                && v.VisitDateTime >= from.Date && v.VisitDateTime < toEnd)
            .CountAsync();

        var labOrders = await _context.LabOrders
            .Where(l => l.HospitalId == hospitalId
                && l.OrderedAt >= from.Date && l.OrderedAt < toEnd)
            .CountAsync();

        var prescriptions = await _context.Prescriptions
            .Where(p => p.HospitalId == hospitalId
                && p.PrescribedOn >= from.Date && p.PrescribedOn < toEnd)
            .CountAsync();

        var bills = await _context.Bills
            .Where(b => b.HospitalId == hospitalId
                && b.CreatedAt >= from.Date && b.CreatedAt < toEnd)
            .ToListAsync();

        return ApiResponse<ReportSummaryResponse>.Ok(new ReportSummaryResponse
        {
            TotalAppointments = appointments.Count,
            CompletedAppointments = appointments.Count(a => a.Status == AppointmentStatus.Completed),
            CancelledAppointments = appointments.Count(a => a.Status == AppointmentStatus.Cancelled),
            NewPatients = newPatients,
            OPDVisits = opdVisits,
            LabOrders = labOrders,
            PrescriptionsIssued = prescriptions,
            TotalRevenue = bills.Sum(b => b.TotalAmount),
            PaidRevenue = bills.Sum(b => b.PaidAmount),
            BillsGenerated = bills.Count
        });
    }

    public async Task<ApiResponse<List<AppointmentReportRow>>> GetAppointmentsAsync(
        Guid hospitalId, DateTime from, DateTime to, string? doctorId, string? status)
    {
        var toEnd = to.Date.AddDays(1);

        var query = _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor).ThenInclude(d => d!.Department)
            .Where(a => a.HospitalId == hospitalId
                && a.AppointmentDateTime >= from.Date
                && a.AppointmentDateTime < toEnd);

        if (!string.IsNullOrEmpty(doctorId) && Guid.TryParse(doctorId, out var docGuid))
            query = query.Where(a => a.DoctorId == docGuid);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<AppointmentStatus>(status, out var statusEnum))
            query = query.Where(a => a.Status == statusEnum);

        var rows = await query
            .OrderByDescending(a => a.AppointmentDateTime)
            .Select(a => new AppointmentReportRow
            {
                AppointmentNumber = a.AppointmentNumber,
                PatientName = a.Patient != null ? a.Patient.FullName : "",
                PatientUHID = a.Patient != null ? a.Patient.UHID : "",
                DoctorName = a.Doctor != null ? $"Dr. {a.Doctor.FirstName} {a.Doctor.LastName}" : "",
                DepartmentName = a.Doctor != null && a.Doctor.Department != null ? a.Doctor.Department.Name : "",
                AppointmentDateTime = a.AppointmentDateTime,
                Status = a.Status.ToString(),
                ConsultationType = a.ConsultationType.ToString(),
                ChiefComplaint = a.ChiefComplaint,
                TokenNumber = a.TokenNumber
            })
            .ToListAsync();

        return ApiResponse<List<AppointmentReportRow>>.Ok(rows);
    }

    public async Task<ApiResponse<List<OPDReportRow>>> GetOPDAsync(
        Guid hospitalId, DateTime from, DateTime to)
    {
        var toEnd = to.Date.AddDays(1);

        var rows = await _context.OPDVisits
            .Include(v => v.Patient)
            .Include(v => v.Doctor)
            .Include(v => v.Prescription)
            .Where(v => v.HospitalId == hospitalId
                && v.VisitDateTime >= from.Date && v.VisitDateTime < toEnd)
            .OrderByDescending(v => v.VisitDateTime)
            .Select(v => new OPDReportRow
            {
                VisitNumber = v.VisitNumber,
                PatientName = v.Patient != null ? v.Patient.FullName : "",
                PatientUHID = v.Patient != null ? v.Patient.UHID : "",
                DoctorName = v.Doctor != null ? $"Dr. {v.Doctor.FirstName} {v.Doctor.LastName}" : "",
                Diagnosis = v.Diagnosis,
                BloodPressure = v.BloodPressure,
                PulseRate = v.PulseRate.HasValue ? v.PulseRate.ToString() : null,
                Temperature = v.Temperature.HasValue ? v.Temperature.ToString() : null,
                PrescriptionNumber = v.Prescription != null ? v.Prescription.PrescriptionNumber : "",
                VisitDate = v.VisitDateTime
            })
            .ToListAsync();

        return ApiResponse<List<OPDReportRow>>.Ok(rows);
    }

    public async Task<ApiResponse<List<BillingReportRow>>> GetBillingAsync(
        Guid hospitalId, DateTime from, DateTime to)
    {
        var toEnd = to.Date.AddDays(1);

        var rows = await _context.Bills
            .Include(b => b.Patient)
            .Where(b => b.HospitalId == hospitalId
                && b.CreatedAt >= from.Date && b.CreatedAt < toEnd)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new BillingReportRow
            {
                BillNumber = b.BillNumber,
                PatientName = b.Patient != null ? b.Patient.FullName : "",
                PatientUHID = b.Patient != null ? b.Patient.UHID : "",
                TotalAmount = b.TotalAmount,
                PaidAmount = b.PaidAmount,
                BalanceAmount = b.DueAmount,
                Status = b.Status.ToString(),
                BillDate = b.CreatedAt
            })
            .ToListAsync();

        return ApiResponse<List<BillingReportRow>>.Ok(rows);
    }

    public async Task<ApiResponse<List<DailyStatRow>>> GetDailyTrendAsync(
        Guid hospitalId, DateTime from, DateTime to)
    {
        var rows = new List<DailyStatRow>();
        for (var d = from.Date; d <= to.Date; d = d.AddDays(1))
        {
            var dayEnd = d.AddDays(1);

            var apts = await _context.Appointments
                .Where(a => a.HospitalId == hospitalId
                    && a.AppointmentDateTime >= d && a.AppointmentDateTime < dayEnd)
                .ToListAsync();

            var newPts = await _context.Patients
                .Where(p => p.HospitalId == hospitalId
                    && p.CreatedAt >= d && p.CreatedAt < dayEnd)
                .CountAsync();

            var revenue = await _context.Bills
                .Where(b => b.HospitalId == hospitalId
                    && b.CreatedAt >= d && b.CreatedAt < dayEnd)
                .SumAsync(b => (decimal?)b.PaidAmount) ?? 0;

            rows.Add(new DailyStatRow
            {
                Date = d.ToString("dd MMM"),
                Appointments = apts.Count,
                Completed = apts.Count(a => a.Status == AppointmentStatus.Completed),
                NewPatients = newPts,
                Revenue = revenue
            });
        }

        return ApiResponse<List<DailyStatRow>>.Ok(rows);
    }
}
