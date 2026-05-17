using MedCareAxis.Core.DTOs.Request;
using MedCareAxis.Core.DTOs.Response;
using MedCareAxis.Core.Entities;
using MedCareAxis.Core.Enums;
using MedCareAxis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MedCareAxis.Infrastructure.Services;

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
    public string? RespiratoryRate { get; set; }
    public string? ChiefComplaint { get; set; }
    public string? HistoryOfPresentIllness { get; set; }
    public string? ClinicalFindings { get; set; }
    public string? Diagnosis { get; set; }
    public string? Advice { get; set; }
    public DateTime? FollowUpDate { get; set; }
    public bool CreateFollowUpAppointment { get; set; } = false;
    public List<PrescriptionItemRequest> Medicines { get; set; } = new();
    public List<LabOrderItemRequest> LabTests { get; set; } = new();
}

public class LabOrderItemRequest
{
    public Guid LabTestId { get; set; }
    public string TestName { get; set; } = string.Empty;
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

public class PatientVisitSummary
{
    public Guid VisitId { get; set; }
    public DateTime VisitDate { get; set; }
    public string? DoctorName { get; set; }
    public string? Diagnosis { get; set; }
    public string? ChiefComplaint { get; set; }
    public string? BloodPressure { get; set; }
    public string? PulseRate { get; set; }
    public string? Temperature { get; set; }
    public string? Advice { get; set; }
    public string PrescriptionNumber { get; set; } = string.Empty;
    public List<PrescriptionItemResponse> Medicines { get; set; } = new();
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
    Task<ApiResponse<List<PatientVisitSummary>>> GetPatientHistoryAsync(
        Guid patientId, Guid hospitalId, int limit = 5);
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
        var wt = decimal.TryParse(request.WeightKg, out var wtVal) ? wtVal : (decimal?)null;
        var ht = decimal.TryParse(request.HeightCm, out var htVal) ? htVal : (decimal?)null;
        decimal? bmi = (wt.HasValue && ht.HasValue && ht.Value > 0)
            ? Math.Round(wt.Value / ((ht.Value / 100) * (ht.Value / 100)), 1)
            : null;

        var visitCount = await _context.OPDVisits
            .Where(v => v.HospitalId == hospitalId)
            .CountAsync();
        var visitNumber = $"OPD-{DateTime.Now:yyyyMMdd}-{(visitCount + 1):D4}";

        var visit = new OPDVisit
        {
            HospitalId = hospitalId,
            VisitNumber = visitNumber,
            PatientId = request.PatientId,
            AppointmentId = request.AppointmentId,
            DoctorId = request.DoctorId,
            BloodPressure = request.BloodPressure,
            PulseRate = int.TryParse(request.PulseRate, out var pr) ? pr : null,
            Temperature = decimal.TryParse(request.Temperature, out var temp) ? temp : null,
            SpO2 = int.TryParse(request.SpO2, out var spo2) ? spo2 : null,
            WeightKg = wt,
            HeightCm = ht,
            BMI = bmi,
            RespiratoryRate = int.TryParse(request.RespiratoryRate, out var rr) ? rr : null,
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

        // ─── Inline Lab Orders ─────────────────────
        if (request.LabTests.Count > 0)
        {
            var labCount = await _context.LabOrders.Where(o => o.HospitalId == hospitalId).CountAsync();
            var labOrder = new LabOrder
            {
                HospitalId  = hospitalId,
                PatientId   = request.PatientId,
                DoctorId    = request.DoctorId,
                OPDVisitId  = visit.Id,
                OrderNumber = $"LAB-{DateTime.Now:yyyyMMdd}-{(labCount + 1):D4}",
                Status      = LabOrderStatus.Ordered,
                OrderedAt   = DateTime.UtcNow,
                ClinicalNotes = request.Diagnosis
            };
            _context.LabOrders.Add(labOrder);

            foreach (var t in request.LabTests)
            {
                _context.LabOrderItems.Add(new LabOrderItem
                {
                    LabOrderId = labOrder.Id,
                    LabTestId  = t.LabTestId,
                    Status     = LabOrderStatus.Ordered
                });
            }
        }

        // ─── Update appointment status ─────────────
        appointment.Status = AppointmentStatus.Completed;
        appointment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // ─── Auto follow-up appointment ────────────
        if (request.CreateFollowUpAppointment && request.FollowUpDate.HasValue)
        {
            var aptCount = await _context.Appointments.Where(a => a.HospitalId == hospitalId).CountAsync();
            var followUp = new Appointment
            {
                HospitalId         = hospitalId,
                AppointmentNumber  = $"APT-{DateTime.Now:yyyyMMdd}-{(aptCount + 1):D4}",
                PatientId          = request.PatientId,
                DoctorId           = request.DoctorId,
                DepartmentId       = appointment.DepartmentId,
                AppointmentDateTime = request.FollowUpDate.Value.Date.AddHours(9),
                Status             = AppointmentStatus.Scheduled,
                ConsultationType   = ConsultationType.FollowUp,
                Priority           = PriorityLevel.Normal,
                ChiefComplaint     = $"Follow-up: {request.Diagnosis}",
                IsWalkIn           = false
            };
            _context.Appointments.Add(followUp);
            await _context.SaveChangesAsync();
        }

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

    public async Task<ApiResponse<List<PatientVisitSummary>>> GetPatientHistoryAsync(
        Guid patientId, Guid hospitalId, int limit = 5)
    {
        var visits = await _context.OPDVisits
            .Include(v => v.Doctor)
            .Where(v => v.PatientId == patientId && v.HospitalId == hospitalId)
            .OrderByDescending(v => v.VisitDateTime)
            .Take(limit)
            .ToListAsync();

        var visitIds = visits.Select(v => v.Id).ToList();
        var prescriptions = await _context.Prescriptions
            .Include(p => p.Items)
            .Where(p => p.OPDVisitId != null && visitIds.Contains(p.OPDVisitId!.Value))
            .ToListAsync();

        var result = visits.Select(v =>
        {
            var rx = prescriptions.FirstOrDefault(p => p.OPDVisitId == v.Id);
            return new PatientVisitSummary
            {
                VisitId            = v.Id,
                VisitDate          = v.VisitDateTime,
                DoctorName         = v.Doctor?.FullName,
                Diagnosis          = v.Diagnosis,
                ChiefComplaint     = v.ChiefComplaint,
                BloodPressure      = v.BloodPressure,
                PulseRate          = v.PulseRate?.ToString(),
                Temperature        = v.Temperature?.ToString(),
                Advice             = v.Advice,
                PrescriptionNumber = rx?.PrescriptionNumber ?? "",
                Medicines          = rx?.Items.Select(m => new PrescriptionItemResponse
                {
                    MedicineName = m.MedicineName,
                    Dosage       = m.Dosage,
                    Frequency    = m.Frequency,
                    Duration     = m.Duration,
                    Instructions = m.Instructions
                }).ToList() ?? new()
            };
        }).ToList();

        return ApiResponse<List<PatientVisitSummary>>.Ok(result);
    }
}