using MedCareAxis.Core.DTOs.Request;
using MedCareAxis.Core.DTOs.Response;
using MedCareAxis.Core.Entities;
using MedCareAxis.Core.Enums;
using MedCareAxis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace MedCareAxis.Infrastructure.Services;

public interface IIPDService
{
    Task<ApiResponse<PagedResponse<AdmissionListResponse>>> GetAdmissionsAsync(Guid hospitalId, AdmissionStatus? status, string? search, int page, int pageSize);
    Task<ApiResponse<AdmissionDetailResponse>> GetAdmissionByIdAsync(Guid id, Guid hospitalId);
    Task<ApiResponse<AdmissionListResponse>> AdmitPatientAsync(AdmitPatientRequest request, Guid hospitalId);
    Task<ApiResponse<VitalsResponse>> RecordVitalsAsync(RecordVitalsRequest request, Guid hospitalId);
    Task<ApiResponse<AdmissionListResponse>> DischargePatientAsync(DischargePatientRequest request, Guid hospitalId);
    Task<ApiResponse<List<WardResponse>>> GetWardsAsync(Guid hospitalId);
    Task<ApiResponse<List<BedResponse>>> GetAvailableBedsAsync(Guid wardId, Guid hospitalId);
    Task<ApiResponse<WardResponse>> CreateWardAsync(CreateWardRequest request, Guid hospitalId);
    Task<ApiResponse<BedResponse>> CreateBedAsync(CreateBedRequest request, Guid hospitalId);
}

public class IPDService : IIPDService
{
    private readonly AppDbContext _context;
    private readonly IAuditService _audit;

    public IPDService(AppDbContext context, IAuditService audit)
    {
        _context = context;
        _audit = audit;
    }

    public async Task<ApiResponse<PagedResponse<AdmissionListResponse>>> GetAdmissionsAsync(
        Guid hospitalId, AdmissionStatus? status, string? search, int page, int pageSize)
    {
        var query = _context.Admissions
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Include(a => a.Ward)
            .Include(a => a.Bed)
            .Where(a => a.HospitalId == hospitalId);

        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(a =>
                a.IPDNumber.Contains(search) ||
                (a.Patient != null && (
                    a.Patient.FirstName.Contains(search) ||
                    a.Patient.LastName.Contains(search) ||
                    a.Patient.UHID.Contains(search) ||
                    a.Patient.MobileNumber.Contains(search))));

        var total = await query.CountAsync();
        var admissions = await query
            .OrderByDescending(a => a.AdmissionDateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = admissions.Select(MapToListResponse).ToList();

        return ApiResponse<PagedResponse<AdmissionListResponse>>.Ok(
            new PagedResponse<AdmissionListResponse>
            {
                Items = items,
                TotalCount = total,
                Page = page,
                PageSize = pageSize
            });
    }

    public async Task<ApiResponse<AdmissionDetailResponse>> GetAdmissionByIdAsync(Guid id, Guid hospitalId)
    {
        var admission = await _context.Admissions
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Include(a => a.Ward)
            .Include(a => a.Bed)
            .Include(a => a.Vitals)
            .FirstOrDefaultAsync(a => a.Id == id && a.HospitalId == hospitalId);

        if (admission == null)
            return ApiResponse<AdmissionDetailResponse>.Fail("Admission not found");

        var vitals = (admission.Vitals ?? new List<AdmissionVitals>())
            .OrderByDescending(v => v.RecordedAt)
            .Select(v => new VitalsResponse
            {
                Id = v.Id,
                AdmissionId = v.AdmissionId,
                RecordedAt = v.RecordedAt,
                RecordedBy = v.RecordedBy,
                BloodPressure = v.BloodPressure,
                PulseRate = v.PulseRate,
                Temperature = v.Temperature,
                SpO2 = v.SpO2,
                RespiratoryRate = v.RespiratoryRate,
                BloodGlucose = v.BloodGlucose,
                GCSScore = v.GCSScore,
                PainScore = v.PainScore,
                Notes = v.Notes
            }).ToList();

        var base_ = MapToListResponse(admission);

        var detail = new AdmissionDetailResponse
        {
            Id = base_.Id,
            IPDNumber = base_.IPDNumber,
            PatientId = base_.PatientId,
            PatientName = base_.PatientName,
            PatientUHID = base_.PatientUHID,
            PatientMobile = base_.PatientMobile,
            DoctorId = base_.DoctorId,
            DoctorName = base_.DoctorName,
            WardName = base_.WardName,
            BedNumber = base_.BedNumber,
            Status = base_.Status,
            AdmissionDateTime = base_.AdmissionDateTime,
            AdmissionDiagnosis = base_.AdmissionDiagnosis,
            Priority = base_.Priority,
            IsEmergency = base_.IsEmergency,
            DaysAdmitted = base_.DaysAdmitted,
            DischargeDateTime = base_.DischargeDateTime,
            AdmissionNotes = admission.AdmissionNotes,
            FinalDiagnosis = admission.FinalDiagnosis,
            DischargeSummary = admission.DischargeSummary,
            DischargeInstructions = admission.DischargeInstructions,
            FollowUpAdvice = admission.DischargeInstructions,
            FollowUpDate = admission.FollowUpDate,
            InsuranceType = admission.InsuranceType.ToString(),
            Vitals = vitals
        };

        return ApiResponse<AdmissionDetailResponse>.Ok(detail);
    }

    public async Task<ApiResponse<AdmissionListResponse>> AdmitPatientAsync(
        AdmitPatientRequest request, Guid hospitalId)
    {
        var bed = await _context.Beds
            .Include(b => b.Ward)
            .FirstOrDefaultAsync(b => b.Id == request.BedId && b.WardId == request.WardId);

        if (bed == null)
            return ApiResponse<AdmissionListResponse>.Fail("Bed not found");

        if (bed.Status != BedStatus.Available)
            return ApiResponse<AdmissionListResponse>.Fail("Bed is not available");

        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == request.PatientId && p.HospitalId == hospitalId);
        if (patient == null)
            return ApiResponse<AdmissionListResponse>.Fail("Patient not found");

        var doctor = await _context.Doctors
            .FirstOrDefaultAsync(d => d.Id == request.DoctorId && d.HospitalId == hospitalId);
        if (doctor == null)
            return ApiResponse<AdmissionListResponse>.Fail("Doctor not found");

        var count = await _context.Admissions.Where(a => a.HospitalId == hospitalId).CountAsync();
        var ipdNumber = $"IPD-{DateTime.Now:yyyyMMdd}-{(count + 1):D4}";

        var admission = new Admission
        {
            HospitalId = hospitalId,
            IPDNumber = ipdNumber,
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            WardId = request.WardId,
            BedId = request.BedId,
            AdmissionDateTime = DateTime.UtcNow,
            Status = AdmissionStatus.Active,
            AdmissionDiagnosis = request.AdmissionDiagnosis,
            AdmissionNotes = request.AdmissionNotes,
            Priority = (PriorityLevel)request.Priority,
            IsEmergency = request.IsEmergency,
            InsuranceType = (InsuranceType)request.InsuranceType,
            InsuranceAuthCode = request.InsuranceAuthCode
        };

        bed.Status = BedStatus.Occupied;

        _context.Admissions.Add(admission);
        await _context.SaveChangesAsync();

        var created = await _context.Admissions
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Include(a => a.Ward)
            .Include(a => a.Bed)
            .FirstOrDefaultAsync(a => a.Id == admission.Id);

        await _audit.LogAsync(hospitalId, "Admission", admission.Id.ToString(), AuditAction.Create,
            $"Patient {patient.FullName} (UHID: {patient.UHID}) admitted — {ipdNumber}, Bed: {bed.BedNumber}");

        return ApiResponse<AdmissionListResponse>.Ok(
            MapToListResponse(created!), "Patient admitted successfully");
    }

    public async Task<ApiResponse<VitalsResponse>> RecordVitalsAsync(
        RecordVitalsRequest request, Guid hospitalId)
    {
        var admission = await _context.Admissions
            .FirstOrDefaultAsync(a => a.Id == request.AdmissionId && a.HospitalId == hospitalId);

        if (admission == null)
            return ApiResponse<VitalsResponse>.Fail("Admission not found");

        if (admission.Status != AdmissionStatus.Active)
            return ApiResponse<VitalsResponse>.Fail("Cannot record vitals for a non-active admission");

        var vitals = new AdmissionVitals
        {
            AdmissionId = admission.Id,
            RecordedAt = DateTime.UtcNow,
            RecordedBy = request.RecordedBy,
            BloodPressure = request.BloodPressure,
            PulseRate = request.PulseRate,
            Temperature = request.Temperature,
            SpO2 = request.SpO2,
            RespiratoryRate = request.RespiratoryRate,
            BloodGlucose = request.BloodGlucose,
            GCSScore = request.GCSScore,
            PainScore = request.PainScore,
            Notes = request.Notes
        };

        _context.AdmissionVitals.Add(vitals);
        await _context.SaveChangesAsync();

        return ApiResponse<VitalsResponse>.Ok(new VitalsResponse
        {
            Id = vitals.Id,
            AdmissionId = vitals.AdmissionId,
            RecordedAt = vitals.RecordedAt,
            RecordedBy = vitals.RecordedBy,
            BloodPressure = vitals.BloodPressure,
            PulseRate = vitals.PulseRate,
            Temperature = vitals.Temperature,
            SpO2 = vitals.SpO2,
            RespiratoryRate = vitals.RespiratoryRate,
            BloodGlucose = vitals.BloodGlucose,
            GCSScore = vitals.GCSScore,
            PainScore = vitals.PainScore,
            Notes = vitals.Notes
        }, "Vitals recorded successfully");
    }

    public async Task<ApiResponse<AdmissionListResponse>> DischargePatientAsync(
        DischargePatientRequest request, Guid hospitalId)
    {
        var admission = await _context.Admissions
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Include(a => a.Ward)
            .Include(a => a.Bed)
            .FirstOrDefaultAsync(a => a.Id == request.AdmissionId && a.HospitalId == hospitalId);

        if (admission == null)
            return ApiResponse<AdmissionListResponse>.Fail("Admission not found");

        if (admission.Status != AdmissionStatus.Active)
            return ApiResponse<AdmissionListResponse>.Fail("Patient is not currently admitted");

        admission.Status = AdmissionStatus.Discharged;
        admission.DischargeDateTime = DateTime.UtcNow;
        admission.DischargeType = (DischargeType)request.DischargeType;
        admission.FinalDiagnosis = request.FinalDiagnosis;
        admission.DischargeSummary = request.DischargeSummary;
        admission.DischargeInstructions = request.DischargeInstructions;
        admission.FollowUpDate = request.FollowUpDate;

        if (admission.Bed != null)
            admission.Bed.Status = BedStatus.Available;

        await _context.SaveChangesAsync();

        await _audit.LogAsync(hospitalId, "Admission", admission.Id.ToString(), AuditAction.Update,
            $"Patient {admission.Patient?.FullName} discharged ({(DischargeType)request.DischargeType})");

        return ApiResponse<AdmissionListResponse>.Ok(
            MapToListResponse(admission), "Patient discharged successfully");
    }

    public async Task<ApiResponse<List<WardResponse>>> GetWardsAsync(Guid hospitalId)
    {
        var wards = await _context.Wards
            .Include(w => w.Beds)
            .Where(w => w.HospitalId == hospitalId && w.IsActive)
            .OrderBy(w => w.Name)
            .ToListAsync();

        var result = wards.Select(w =>
        {
            var beds = w.Beds ?? new List<Bed>();
            return new WardResponse
            {
                Id = w.Id,
                Code = w.Code,
                Name = w.Name,
                WardType = w.WardType.ToString(),
                Floor = w.Floor,
                WardInCharge = w.WardInCharge,
                TotalBeds = beds.Count,
                AvailableBeds = beds.Count(b => b.Status == BedStatus.Available),
                OccupiedBeds = beds.Count(b => b.Status == BedStatus.Occupied),
                Beds = beds.Select(b => new BedResponse
                {
                    Id = b.Id,
                    BedNumber = b.BedNumber,
                    WardId = b.WardId,
                    WardName = w.Name,
                    Status = b.Status.ToString(),
                    BedType = b.BedType,
                    ChargePerDay = b.ChargePerDay,
                    HasOxygen = b.HasOxygen,
                    HasMonitor = b.HasMonitor,
                    HasVentilator = b.HasVentilator,
                    HasCallBell = b.HasCallBell,
                    CurrentPatientName = null
                }).ToList()
            };
        }).ToList();

        return ApiResponse<List<WardResponse>>.Ok(result);
    }

    public async Task<ApiResponse<List<BedResponse>>> GetAvailableBedsAsync(Guid wardId, Guid hospitalId)
    {
        var beds = await _context.Beds
            .Include(b => b.Ward)
            .Where(b => b.WardId == wardId && b.Ward != null && b.Ward.HospitalId == hospitalId && b.Status == BedStatus.Available)
            .OrderBy(b => b.BedNumber)
            .ToListAsync();

        var result = beds.Select(b => new BedResponse
        {
            Id = b.Id,
            BedNumber = b.BedNumber,
            WardId = b.WardId,
            WardName = b.Ward?.Name ?? string.Empty,
            Status = b.Status.ToString(),
            BedType = b.BedType,
            ChargePerDay = b.ChargePerDay,
            HasOxygen = b.HasOxygen,
            HasMonitor = b.HasMonitor,
            HasVentilator = b.HasVentilator,
            HasCallBell = b.HasCallBell,
            CurrentPatientName = null
        }).ToList();

        return ApiResponse<List<BedResponse>>.Ok(result);
    }

    public async Task<ApiResponse<WardResponse>> CreateWardAsync(CreateWardRequest request, Guid hospitalId)
    {
        var exists = await _context.Wards
            .AnyAsync(w => w.HospitalId == hospitalId && w.Code == request.Code);
        if (exists)
            return ApiResponse<WardResponse>.Fail("A ward with this code already exists");

        var ward = new Ward
        {
            HospitalId = hospitalId,
            Code = request.Code,
            Name = request.Name,
            WardType = (WardType)request.WardType,
            DepartmentId = request.DepartmentId,
            Floor = request.Floor,
            WardInCharge = request.WardInCharge,
            IsActive = true
        };

        _context.Wards.Add(ward);
        await _context.SaveChangesAsync();

        return ApiResponse<WardResponse>.Ok(new WardResponse
        {
            Id = ward.Id,
            Code = ward.Code,
            Name = ward.Name,
            WardType = ward.WardType.ToString(),
            Floor = ward.Floor,
            WardInCharge = ward.WardInCharge,
            TotalBeds = 0,
            AvailableBeds = 0,
            OccupiedBeds = 0,
            Beds = new List<BedResponse>()
        }, "Ward created successfully");
    }

    public async Task<ApiResponse<BedResponse>> CreateBedAsync(CreateBedRequest request, Guid hospitalId)
    {
        var ward = await _context.Wards
            .FirstOrDefaultAsync(w => w.Id == request.WardId && w.HospitalId == hospitalId);
        if (ward == null)
            return ApiResponse<BedResponse>.Fail("Ward not found");

        var exists = await _context.Beds
            .AnyAsync(b => b.WardId == request.WardId && b.BedNumber == request.BedNumber);
        if (exists)
            return ApiResponse<BedResponse>.Fail("A bed with this number already exists in the ward");

        var bed = new Bed
        {
            WardId = request.WardId,
            BedNumber = request.BedNumber,
            Status = BedStatus.Available,
            BedType = request.BedType,
            ChargePerDay = request.ChargePerDay,
            HasOxygen = request.HasOxygen,
            HasMonitor = request.HasMonitor,
            HasVentilator = request.HasVentilator,
            HasCallBell = request.HasCallBell
        };

        _context.Beds.Add(bed);
        await _context.SaveChangesAsync();

        return ApiResponse<BedResponse>.Ok(new BedResponse
        {
            Id = bed.Id,
            BedNumber = bed.BedNumber,
            WardId = bed.WardId,
            WardName = ward.Name,
            Status = bed.Status.ToString(),
            BedType = bed.BedType,
            ChargePerDay = bed.ChargePerDay,
            HasOxygen = bed.HasOxygen,
            HasMonitor = bed.HasMonitor,
            HasVentilator = bed.HasVentilator,
            HasCallBell = bed.HasCallBell,
            CurrentPatientName = null
        }, "Bed created successfully");
    }

    private static AdmissionListResponse MapToListResponse(Admission a) => new()
    {
        Id = a.Id,
        IPDNumber = a.IPDNumber,
        PatientId = a.PatientId,
        PatientName = a.Patient?.FullName ?? string.Empty,
        PatientUHID = a.Patient?.UHID ?? string.Empty,
        PatientMobile = a.Patient?.MobileNumber ?? string.Empty,
        DoctorId = a.DoctorId,
        DoctorName = a.Doctor?.FullName ?? string.Empty,
        WardName = a.Ward?.Name ?? string.Empty,
        BedNumber = a.Bed?.BedNumber ?? string.Empty,
        Status = a.Status.ToString(),
        AdmissionDateTime = a.AdmissionDateTime,
        AdmissionDiagnosis = a.AdmissionDiagnosis,
        Priority = a.Priority.ToString(),
        IsEmergency = a.IsEmergency,
        DaysAdmitted = (int)(DateTime.UtcNow - a.AdmissionDateTime).TotalDays,
        DischargeDateTime = a.DischargeDateTime
    };
}
