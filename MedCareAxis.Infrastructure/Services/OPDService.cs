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
    public string? WeightKg { get; set; }
    public string? HeightCm { get; set; }
    public string? BloodGlucose { get; set; }
    public string? RespiratoryRate { get; set; }
    public string? ChiefComplaint { get; set; }
    public string? HistoryOfPresentIllness { get; set; }
    public string? ClinicalFindings { get; set; }
    public string? Advice { get; set; }
    public string? FollowUpDate { get; set; }
    public List<string> LabTests { get; set; } = new();
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
    public string? GenericName { get; set; }
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public int Quantity { get; set; } = 1;
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

        // ─── Vitals ────────────────────────────────
        var wt = decimal.TryParse(request.WeightKg, out var wtVal) ? wtVal : (decimal?)null;
        var ht = decimal.TryParse(request.HeightCm, out var htVal) ? htVal : (decimal?)null;
        decimal? bmi = (wt.HasValue && ht.HasValue && ht.Value > 0)
            ? Math.Round(wt.Value / ((ht.Value / 100) * (ht.Value / 100)), 1)
            : null;

        // ─── Upsert OPD Visit ──────────────────────
        // If a consultation was already saved for this appointment, amend it in
        // place rather than creating a duplicate visit / prescription.
        var visit = await _context.OPDVisits
            .FirstOrDefaultAsync(v => v.AppointmentId == request.AppointmentId
                && v.HospitalId == hospitalId);
        var isAmendment = visit != null;

        if (visit == null)
        {
            var visitCount = await _context.OPDVisits
                .Where(v => v.HospitalId == hospitalId)
                .CountAsync();
            visit = new OPDVisit
            {
                HospitalId = hospitalId,
                VisitNumber = $"OPD-{DateTime.Now:yyyyMMdd}-{(visitCount + 1):D4}",
                PatientId = request.PatientId,
                AppointmentId = request.AppointmentId,
                DoctorId = request.DoctorId,
            };
            _context.OPDVisits.Add(visit);
        }

        visit.BloodPressure = request.BloodPressure;
        visit.PulseRate = int.TryParse(request.PulseRate, out var pr) ? pr : null;
        visit.Temperature = decimal.TryParse(request.Temperature, out var temp) ? temp : null;
        visit.SpO2 = int.TryParse(request.SpO2, out var spo2) ? spo2 : null;
        visit.WeightKg = wt;
        visit.HeightCm = ht;
        visit.BMI = bmi;
        visit.RespiratoryRate = int.TryParse(request.RespiratoryRate, out var rr) ? rr : null;
        visit.BloodGlucose = request.BloodGlucose;
        visit.ChiefComplaint = request.ChiefComplaint;
        visit.HistoryOfPresentIllness = request.HistoryOfPresentIllness;
        visit.ClinicalFindings = request.ClinicalFindings;
        visit.Diagnosis = request.Diagnosis;
        visit.Advice = request.Advice;
        visit.FollowUpDate = request.FollowUpDate?.ToString();
        if (isAmendment) visit.UpdatedAt = DateTime.UtcNow;

        // ─── Upsert Prescription ───────────────────
        var prescription = isAmendment
            ? await _context.Prescriptions
                .FirstOrDefaultAsync(p => p.OPDVisitId == visit.Id && p.HospitalId == hospitalId)
            : null;

        if (prescription == null)
        {
            var rxCount = await _context.Prescriptions
                .Where(p => p.HospitalId == hospitalId)
                .CountAsync();
            prescription = new Prescription
            {
                HospitalId = hospitalId,
                PatientId = request.PatientId,
                DoctorId = request.DoctorId,
                OPDVisitId = visit.Id,
                PrescriptionNumber = $"RX-{DateTime.Now:yyyyMMdd}-{(rxCount + 1):D4}",
                PrescribedOn = DateTime.UtcNow
            };
            _context.Prescriptions.Add(prescription);
        }
        else
        {
            prescription.UpdatedAt = DateTime.UtcNow;
            // Replace the medicine list with the current one.
            _context.PrescriptionItems.RemoveRange(
                _context.PrescriptionItems.Where(i => i.PrescriptionId == prescription.Id));
        }
        prescription.Diagnosis = request.Diagnosis;
        prescription.FollowUpDate = request.FollowUpDate;

        var rxNumber = prescription.PrescriptionNumber;

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
            var labOrder = isAmendment
                ? await _context.LabOrders
                    .FirstOrDefaultAsync(o => o.OPDVisitId == visit.Id && o.HospitalId == hospitalId)
                : null;

            if (labOrder == null)
            {
                var labCount = await _context.LabOrders.Where(o => o.HospitalId == hospitalId).CountAsync();
                labOrder = new LabOrder
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
            }

            // On an amendment, only add tests that weren't already ordered.
            var alreadyOrdered = isAmendment
                ? await _context.LabOrderItems
                    .Where(i => i.LabOrderId == labOrder.Id)
                    .Select(i => i.LabTestId)
                    .ToListAsync()
                : new List<Guid>();

            foreach (var t in request.LabTests.Where(t => !alreadyOrdered.Contains(t.LabTestId)))
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
        var fuDay = request.FollowUpDate?.Date;
        var followUpExists = fuDay.HasValue && await _context.Appointments.AnyAsync(a =>
            a.HospitalId == hospitalId
            && a.PatientId == request.PatientId
            && a.DoctorId == request.DoctorId
            && a.ConsultationType == ConsultationType.FollowUp
            && a.Status != AppointmentStatus.Cancelled
            && a.AppointmentDateTime >= fuDay.Value
            && a.AppointmentDateTime < fuDay.Value.AddDays(1));

        if (request.CreateFollowUpAppointment && request.FollowUpDate.HasValue && !followUpExists)
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
            isAmendment
                ? $"Consultation updated. Prescription: {rxNumber}"
                : $"Consultation saved! Prescription: {rxNumber}");
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

        var labTests = await (
            from item in _context.LabOrderItems
            join order in _context.LabOrders on item.LabOrderId equals order.Id
            join test in _context.LabTests on item.LabTestId equals test.Id
            where order.OPDVisitId == visit.Id
            select test.Name).ToListAsync();

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
                WeightKg = visit.WeightKg?.ToString(),
                HeightCm = visit.HeightCm?.ToString(),
                BloodGlucose = visit.BloodGlucose,
                RespiratoryRate = visit.RespiratoryRate?.ToString(),
                ChiefComplaint = visit.ChiefComplaint,
                HistoryOfPresentIllness = visit.HistoryOfPresentIllness,
                ClinicalFindings = visit.ClinicalFindings,
                Advice = visit.Advice,
                FollowUpDate = visit.FollowUpDate,
                LabTests = labTests,
                PrescriptionNumber = prescription?.PrescriptionNumber ?? "",
                Medicines = prescription?.Items.Select(m =>
                    new PrescriptionItemResponse
                    {
                        MedicineName = m.MedicineName,
                        GenericName = m.GenericName,
                        Dosage = m.Dosage,
                        Frequency = m.Frequency,
                        Duration = m.Duration,
                        Instructions = m.Instructions,
                        Quantity = m.Quantity
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