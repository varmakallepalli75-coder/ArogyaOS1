using MedCareAxis.Core.DTOs.Request;
using MedCareAxis.Core.DTOs.Response;
using MedCareAxis.Core.Entities;
using MedCareAxis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MedCareAxis.Infrastructure.Services;

public interface IHealthRecordsService
{
    Task<ApiResponse<List<LinkedHospitalInfo>>> GetLinkedHospitalsAsync(string mobileNumber, List<Guid> patientIds);
    Task<ApiResponse<List<CrossHospitalPrescription>>> GetAllPrescriptionsAsync(List<Guid> patientIds);
    Task<ApiResponse<List<CrossHospitalVisit>>> GetAllVisitsAsync(List<Guid> patientIds);
    Task<ApiResponse<List<CrossHospitalAdmission>>> GetAllAdmissionsAsync(List<Guid> patientIds);
    Task<ApiResponse<List<CrossHospitalLabOrder>>> GetAllLabOrdersAsync(List<Guid> patientIds);
    Task<ApiResponse<List<HealthTimelineEvent>>> GetHealthTimelineAsync(List<Guid> patientIds);
    Task<ApiResponse<PatientDocumentResponse>> UploadDocumentAsync(string mobileNumber, UploadDocumentRequest request);
    Task<ApiResponse<List<PatientDocumentResponse>>> GetMyDocumentsAsync(string mobileNumber);
    Task<ApiResponse<PatientDocumentResponse>> GetDocumentWithFileAsync(string mobileNumber, Guid documentId);
    Task<ApiResponse<bool>> DeleteDocumentAsync(string mobileNumber, Guid documentId);
}

public class HealthRecordsService : IHealthRecordsService
{
    private readonly AppDbContext _context;

    public HealthRecordsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<LinkedHospitalInfo>>> GetLinkedHospitalsAsync(
        string mobileNumber, List<Guid> patientIds)
    {
        var patients = await _context.Patients
            .Include(p => p.Hospital)
            .Where(p => patientIds.Contains(p.Id))
            .ToListAsync();

        var result = patients.Select(p => new LinkedHospitalInfo
        {
            HospitalId = p.HospitalId,
            HospitalCode = p.Hospital!.HospitalCode,
            HospitalName = p.Hospital.Name,
            City = p.Hospital.City ?? "",
            PatientId = p.Id,
            UHID = p.UHID
        }).ToList();

        return ApiResponse<List<LinkedHospitalInfo>>.Ok(result);
    }

    public async Task<ApiResponse<List<CrossHospitalPrescription>>> GetAllPrescriptionsAsync(
        List<Guid> patientIds)
    {
        var prescriptions = await _context.Prescriptions
            .Include(p => p.Items)
            .Include(p => p.Doctor)
            .Include(p => p.Patient)
                .ThenInclude(pat => pat!.Hospital)
            .Where(p => patientIds.Contains(p.PatientId))
            .OrderByDescending(p => p.PrescribedOn)
            .ToListAsync();

        var result = prescriptions.Select(p => new CrossHospitalPrescription
        {
            PrescriptionId = p.Id,
            PrescriptionNumber = p.PrescriptionNumber,
            PrescribedOn = p.PrescribedOn,
            HospitalName = p.Patient?.Hospital?.Name ?? "",
            HospitalCode = p.Patient?.Hospital?.HospitalCode ?? "",
            DoctorName = p.Doctor?.FullName ?? "Unknown Doctor",
            Diagnosis = p.Diagnosis ?? "",
            Notes = p.Notes,
            FollowUpInstructions = p.FollowUpInstructions,
            Medicines = p.Items.Select(m => new PrescriptionItemSummary
            {
                MedicineName = m.MedicineName,
                Dosage = m.Dosage,
                Frequency = m.Frequency,
                Duration = m.Duration,
                Instructions = m.Instructions
            }).ToList()
        }).ToList();

        return ApiResponse<List<CrossHospitalPrescription>>.Ok(result);
    }

    public async Task<ApiResponse<List<CrossHospitalVisit>>> GetAllVisitsAsync(
        List<Guid> patientIds)
    {
        var visits = await _context.OPDVisits
            .Include(v => v.Doctor)
            .Include(v => v.Patient)
                .ThenInclude(p => p!.Hospital)
            .Where(v => patientIds.Contains(v.PatientId))
            .OrderByDescending(v => v.VisitDateTime)
            .ToListAsync();

        var result = visits.Select(v => new CrossHospitalVisit
        {
            VisitId = v.Id,
            VisitNumber = v.VisitNumber,
            VisitDate = v.VisitDateTime,
            HospitalName = v.Patient?.Hospital?.Name ?? "",
            HospitalCode = v.Patient?.Hospital?.HospitalCode ?? "",
            DoctorName = v.Doctor?.FullName ?? "Unknown Doctor",
            ChiefComplaint = v.ChiefComplaint,
            Diagnosis = v.Diagnosis,
            Advice = v.Advice,
            BloodPressure = v.BloodPressure,
            PulseRate = v.PulseRate?.ToString(),
            Temperature = v.Temperature?.ToString(),
            SpO2 = v.SpO2?.ToString(),
            FollowUpDate = v.FollowUpDate
        }).ToList();

        return ApiResponse<List<CrossHospitalVisit>>.Ok(result);
    }

    public async Task<ApiResponse<List<CrossHospitalAdmission>>> GetAllAdmissionsAsync(
        List<Guid> patientIds)
    {
        var admissions = await _context.Admissions
            .Include(a => a.Doctor)
            .Include(a => a.Patient)
                .ThenInclude(p => p!.Hospital)
            .Where(a => patientIds.Contains(a.PatientId))
            .OrderByDescending(a => a.AdmissionDateTime)
            .ToListAsync();

        var result = admissions.Select(a => new CrossHospitalAdmission
        {
            AdmissionId = a.Id,
            IPDNumber = a.IPDNumber,
            AdmissionDate = a.AdmissionDateTime,
            DischargeDate = a.DischargeDateTime,
            HospitalName = a.Patient?.Hospital?.Name ?? "",
            HospitalCode = a.Patient?.Hospital?.HospitalCode ?? "",
            DoctorName = a.Doctor?.FullName ?? "Unknown Doctor",
            AdmissionDiagnosis = a.AdmissionDiagnosis,
            FinalDiagnosis = a.FinalDiagnosis,
            DischargeSummary = a.DischargeSummary,
            Status = a.Status.ToString()
        }).ToList();

        return ApiResponse<List<CrossHospitalAdmission>>.Ok(result);
    }

    public async Task<ApiResponse<List<CrossHospitalLabOrder>>> GetAllLabOrdersAsync(
        List<Guid> patientIds)
    {
        var orders = await _context.LabOrders
            .Include(o => o.Doctor)
            .Include(o => o.Patient)
                .ThenInclude(p => p!.Hospital)
            .Include(o => o.Items)
                .ThenInclude(i => i.LabTest)
            .Where(o => patientIds.Contains(o.PatientId))
            .OrderByDescending(o => o.OrderedAt)
            .ToListAsync();

        var result = orders.Select(o => new CrossHospitalLabOrder
        {
            OrderId = o.Id,
            OrderNumber = o.OrderNumber,
            OrderedAt = o.OrderedAt,
            HospitalName = o.Patient?.Hospital?.Name ?? "",
            HospitalCode = o.Patient?.Hospital?.HospitalCode ?? "",
            DoctorName = o.Doctor?.FullName ?? "Unknown Doctor",
            Status = o.Status.ToString(),
            IsAbnormal = o.IsAbnormal,
            TestNames = o.Items.Select(i => i.LabTest?.Name ?? "").Where(n => n != "").ToList()
        }).ToList();

        return ApiResponse<List<CrossHospitalLabOrder>>.Ok(result);
    }

    public async Task<ApiResponse<List<HealthTimelineEvent>>> GetHealthTimelineAsync(
        List<Guid> patientIds)
    {
        var events = new List<HealthTimelineEvent>();

        var visits = await _context.OPDVisits
            .Include(v => v.Doctor)
            .Include(v => v.Patient).ThenInclude(p => p!.Hospital)
            .Where(v => patientIds.Contains(v.PatientId))
            .ToListAsync();

        events.AddRange(visits.Select(v => new HealthTimelineEvent
        {
            Date = v.VisitDateTime,
            EventType = "OPD Visit",
            Title = $"Consultation - {v.Diagnosis ?? v.ChiefComplaint ?? "OPD Visit"}",
            HospitalName = v.Patient?.Hospital?.Name ?? "",
            DoctorName = v.Doctor?.FullName ?? "",
            Details = v.Advice,
            ReferenceId = v.Id
        }));

        var admissions = await _context.Admissions
            .Include(a => a.Doctor)
            .Include(a => a.Patient).ThenInclude(p => p!.Hospital)
            .Where(a => patientIds.Contains(a.PatientId))
            .ToListAsync();

        events.AddRange(admissions.Select(a => new HealthTimelineEvent
        {
            Date = a.AdmissionDateTime,
            EventType = "IPD Admission",
            Title = $"Admitted - {a.AdmissionDiagnosis ?? "IPD"}",
            HospitalName = a.Patient?.Hospital?.Name ?? "",
            DoctorName = a.Doctor?.FullName ?? "",
            Details = a.DischargeDateTime.HasValue
                ? $"Discharged on {a.DischargeDateTime.Value:dd MMM yyyy}. {a.FinalDiagnosis}"
                : "Currently admitted",
            ReferenceId = a.Id
        }));

        var labOrders = await _context.LabOrders
            .Include(o => o.Doctor)
            .Include(o => o.Patient).ThenInclude(p => p!.Hospital)
            .Include(o => o.Items).ThenInclude(i => i.LabTest)
            .Where(o => patientIds.Contains(o.PatientId) && o.ReportedAt.HasValue)
            .ToListAsync();

        events.AddRange(labOrders.Select(o => new HealthTimelineEvent
        {
            Date = o.OrderedAt,
            EventType = "Lab Test",
            Title = $"Lab: {string.Join(", ", o.Items.Take(2).Select(i => i.LabTest?.Name ?? ""))}",
            HospitalName = o.Patient?.Hospital?.Name ?? "",
            DoctorName = o.Doctor?.FullName ?? "",
            Details = o.IsAbnormal ? "Results: Abnormal values detected" : "Results: Normal",
            ReferenceId = o.Id
        }));

        var prescriptions = await _context.Prescriptions
            .Include(p => p.Doctor)
            .Include(p => p.Patient).ThenInclude(pat => pat!.Hospital)
            .Include(p => p.Items)
            .Where(p => patientIds.Contains(p.PatientId))
            .ToListAsync();

        events.AddRange(prescriptions.Select(p => new HealthTimelineEvent
        {
            Date = p.PrescribedOn,
            EventType = "Prescription",
            Title = $"Prescription - {p.Diagnosis ?? "Medicines"}",
            HospitalName = p.Patient?.Hospital?.Name ?? "",
            DoctorName = p.Doctor?.FullName ?? "",
            Details = string.Join(", ", p.Items.Take(3).Select(m => m.MedicineName)),
            ReferenceId = p.Id
        }));

        return ApiResponse<List<HealthTimelineEvent>>.Ok(
            events.OrderByDescending(e => e.Date).ToList());
    }

    public async Task<ApiResponse<PatientDocumentResponse>> UploadDocumentAsync(
        string mobileNumber, UploadDocumentRequest request)
    {
        var doc = new PatientDocument
        {
            MobileNumber = mobileNumber,
            DocumentType = request.DocumentType,
            FileName = request.FileName,
            FileBase64 = request.FileBase64,
            MimeType = request.MimeType,
            Description = request.Description,
            HospitalName = request.HospitalName,
            DocumentDate = request.DocumentDate,
            UploadedAt = DateTime.UtcNow
        };

        _context.PatientDocuments.Add(doc);
        await _context.SaveChangesAsync();

        return ApiResponse<PatientDocumentResponse>.Ok(MapToResponse(doc), "Document uploaded successfully.");
    }

    public async Task<ApiResponse<List<PatientDocumentResponse>>> GetMyDocumentsAsync(string mobileNumber)
    {
        var docs = await _context.PatientDocuments
            .Where(d => d.MobileNumber == mobileNumber)
            .OrderByDescending(d => d.DocumentDate)
            .ToListAsync();

        return ApiResponse<List<PatientDocumentResponse>>.Ok(docs.Select(MapToResponse).ToList());
    }

    public async Task<ApiResponse<PatientDocumentResponse>> GetDocumentWithFileAsync(
        string mobileNumber, Guid documentId)
    {
        var doc = await _context.PatientDocuments
            .FirstOrDefaultAsync(d => d.Id == documentId && d.MobileNumber == mobileNumber);

        if (doc == null) return ApiResponse<PatientDocumentResponse>.Fail("Document not found.");

        var response = MapToResponse(doc);
        return ApiResponse<PatientDocumentResponse>.Ok(response);
    }

    public async Task<ApiResponse<bool>> DeleteDocumentAsync(string mobileNumber, Guid documentId)
    {
        var doc = await _context.PatientDocuments
            .FirstOrDefaultAsync(d => d.Id == documentId && d.MobileNumber == mobileNumber);

        if (doc == null) return ApiResponse<bool>.Fail("Document not found.");

        _context.PatientDocuments.Remove(doc);
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Document deleted.");
    }

    private static PatientDocumentResponse MapToResponse(PatientDocument doc) => new()
    {
        Id = doc.Id,
        DocumentType = doc.DocumentType,
        FileName = doc.FileName,
        MimeType = doc.MimeType,
        Description = doc.Description,
        HospitalName = doc.HospitalName,
        DocumentDate = doc.DocumentDate,
        UploadedAt = doc.UploadedAt
    };
}
