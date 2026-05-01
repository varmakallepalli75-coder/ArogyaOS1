using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Core.DTOs.Response;
using ArogyaOS.Core.Entities;
using ArogyaOS.Core.Enums;
using ArogyaOS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArogyaOS.Infrastructure.Services;

public class SaveConsultationRequest
{
    public Guid AppointmentId { get; set; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public string? BloodPressure { get; set; }
    public string? PulseRate { get; set; }
    public string? Temperature { get; set; }
    public string? SpO2 { get; set; }
    public string? WeightKg { get; set; }
    public string? HeightCm { get; set; }
    public string? BloodGlucose { get; set; }
    public string? ChiefComplaint { get; set; }
    public string? HistoryOfPresentIllness { get; set; }
    public string? ClinicalFindings { get; set; }
    public string? Diagnosis { get; set; }
    public string? Advice { get; set; }
    public DateTime? FollowUpDate { get; set; }
    public List<PrescriptionItemRequest> Medicines { get; set; } = new();
}

public class PrescriptionItemRequest
{
    public string MedicineName { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public int Quantity { get; set; } = 1;
}

public class ConsultationResponse
{
    public Guid Id { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string? Diagnosis { get; set; }
    public string? BloodPressure { get; set; }
    public string? PulseRate { get; set; }
    public string? Temperature { get; set; }
    public string? SpO2 { get; set; }
    public string PrescriptionNumber { get; set; } = string.Empty;
    public List<PrescriptionItemResponse> Medicines { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class PrescriptionItemResponse
{
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string? Instructions { get; set; }
}

public interface IOPDService
{
    Task<ApiResponse<ConsultationResponse>> SaveConsultationAsync(
        SaveConsultationRequest request, Guid hospitalId);
    Task<ApiResponse<ConsultationResponse>> GetByAppointmentAsync(
        Guid appointmentId, Guid hospitalId);
}

public class OPDService : IOPDService
{
    private readonly AppDbContext _context;

    public OPDService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<ConsultationResponse>> SaveConsultationAsync(
        SaveConsultationRequest request, Guid hospitalId)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .FirstOrDefaultAsync(a => a.Id == request.AppointmentId
                && a.HospitalId == hospitalId);

        if (appointment == null)
            return ApiResponse<ConsultationResponse>.Fail(
                "Appointment not found");

        // ─── Create OPD Visit ──────────────────────
        var visit = new OPDVisit
        {
            HospitalId = hospitalId,
            PatientId = request.PatientId,
            AppointmentId = request.AppointmentId,
            DoctorId = request.DoctorId,
            BloodPressure = request.BloodPressure,
            PulseRate = int.TryParse(request.PulseRate, out var pr) ? pr : null,
            Temperature = decimal.TryParse(request.Temperature, out var temp) ? temp : null,
            SpO2 = int.TryParse(request.SpO2, out var spo2) ? spo2 : null,
            WeightKg = decimal.TryParse(request.WeightKg, out var wt) ? wt : null,
            HeightCm = decimal.TryParse(request.HeightCm, out var ht) ? ht : null,
            BloodGlucose = request.BloodGlucose,
            ChiefComplaint = request.ChiefComplaint,
            HistoryOfPresentIllness = request.HistoryOfPresentIllness,
            ClinicalFindings = request.ClinicalFindings,
            Diagnosis = request.Diagnosis,
            Advice = request.Advice,
            FollowUpDate = request.FollowUpDate?.ToString()
        };

        _context.OPDVisits.Add(visit);

        // ─── Create Prescription ───────────────────
        var rxCount = await _context.Prescriptions
            .Where(p => p.HospitalId == hospitalId)
            .CountAsync();
        var rxNumber = $"RX-{DateTime.Now:yyyyMMdd}-{(rxCount + 1):D4}";

        var prescription = new Prescription
        {
            HospitalId = hospitalId,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            OPDVisitId = visit.Id,
            PrescriptionNumber = rxNumber,
            Diagnosis = request.Diagnosis,
            FollowUpDate = request.FollowUpDate,
            PrescribedOn = DateTime.UtcNow
        };

        _context.Prescriptions.Add(prescription);

        // ─── Add medicines ─────────────────────────
        foreach (var med in request.Medicines)
        {
            _context.PrescriptionItems.Add(new PrescriptionItem
            {
                PrescriptionId = prescription.Id,
                MedicineName = med.MedicineName,
                GenericName = med.GenericName,
                Dosage = med.Dosage,
                Frequency = med.Frequency,
                Duration = med.Duration,
                Instructions = med.Instructions,
                Quantity = med.Quantity,
                Category = MedicineCategory.Tablet,
                IsSubstitutionAllowed = true
            });
        }

        // ─── Update appointment status ─────────────
        appointment.Status = AppointmentStatus.Completed;
        appointment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<ConsultationResponse>.Ok(
            new ConsultationResponse
            {
                Id = visit.Id,
                PatientName = appointment.Patient?.FullName ?? "",
                DoctorName = appointment.Doctor?.FullName ?? "",
                Diagnosis = request.Diagnosis,
                BloodPressure = request.BloodPressure,
                PulseRate = request.PulseRate,
                Temperature = request.Temperature,
                SpO2 = request.SpO2,
                PrescriptionNumber = rxNumber,
                Medicines = request.Medicines.Select(m =>
                    new PrescriptionItemResponse
                    {
                        MedicineName = m.MedicineName,
                        Dosage = m.Dosage,
                        Frequency = m.Frequency,
                        Duration = m.Duration,
                        Instructions = m.Instructions
                    }).ToList(),
                CreatedAt = visit.CreatedAt
            },
            $"Consultation saved! Prescription: {rxNumber}");
    }

    public async Task<ApiResponse<ConsultationResponse>> GetByAppointmentAsync(
        Guid appointmentId, Guid hospitalId)
    {
        var visit = await _context.OPDVisits
            .Include(v => v.Patient)
            .Include(v => v.Doctor)
            .FirstOrDefaultAsync(v => v.AppointmentId == appointmentId
                && v.HospitalId == hospitalId);

        if (visit == null)
            return ApiResponse<ConsultationResponse>.Fail(
                "No consultation found");

        var prescription = await _context.Prescriptions
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.OPDVisitId == visit.Id);

        return ApiResponse<ConsultationResponse>.Ok(
            new ConsultationResponse
            {
                Id = visit.Id,
                PatientName = visit.Patient?.FullName ?? "",
                DoctorName = visit.Doctor?.FullName ?? "",
                Diagnosis = visit.Diagnosis,
                BloodPressure = visit.BloodPressure,
                PulseRate = visit.PulseRate?.ToString(),
                Temperature = visit.Temperature?.ToString(),
                SpO2 = visit.SpO2?.ToString(),
                PrescriptionNumber = prescription?.PrescriptionNumber ?? "",
                Medicines = prescription?.Items.Select(m =>
                    new PrescriptionItemResponse
                    {
                        MedicineName = m.MedicineName,
                        Dosage = m.Dosage,
                        Frequency = m.Frequency,
                        Duration = m.Duration,
                        Instructions = m.Instructions
                    }).ToList() ?? new(),
                CreatedAt = visit.CreatedAt
            });
    }
}