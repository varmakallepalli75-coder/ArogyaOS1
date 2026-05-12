using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Core.DTOs.Response;
using ArogyaOS.Core.Entities;
using ArogyaOS.Core.Enums;
using ArogyaOS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArogyaOS.Infrastructure.Services;

public interface IPatientService
{
    Task<ApiResponse<PagedResponse<PatientListResponse>>> GetAllAsync(
        Guid hospitalId, string? search, int page, int pageSize);
    Task<ApiResponse<PatientResponse>> GetByIdAsync(Guid id, Guid hospitalId);
    Task<ApiResponse<PatientResponse>> CreateAsync(
        CreatePatientRequest request, Guid hospitalId);
    Task<ApiResponse<PatientResponse>> UpdateAsync(
        Guid id, UpdatePatientRequest request, Guid hospitalId);
    Task<ApiResponse<List<PatientListResponse>>> SearchAsync(
        string query, Guid hospitalId);
}

public class PatientService : IPatientService
{
    private readonly AppDbContext _context;
    private readonly IAuditService _audit;

    public PatientService(AppDbContext context, IAuditService audit)
    {
        _context = context;
        _audit = audit;
    }

    public async Task<ApiResponse<PagedResponse<PatientListResponse>>> GetAllAsync(
        Guid hospitalId, string? search, int page, int pageSize)
    {
        var query = _context.Patients
            .Where(p => p.HospitalId == hospitalId);

        if (!string.IsNullOrEmpty(search))
        {
            search = search.ToLower();
            query = query.Where(p =>
                p.FirstName.ToLower().Contains(search) ||
                p.LastName.ToLower().Contains(search) ||
                p.MobileNumber.Contains(search) ||
                p.UHID.ToLower().Contains(search));
        }

        var total = await query.CountAsync();

        var patients = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PatientListResponse
            {
                Id = p.Id,
                UHID = p.UHID,
                FullName = $"{p.FirstName} {p.MiddleName} {p.LastName}"
                    .Replace("  ", " ").Trim(),
                Age = (int)((DateTime.UtcNow - p.DateOfBirth).TotalDays / 365.25),
                Gender = p.Gender.ToString(),
                MobileNumber = p.MobileNumber,
                BloodGroup = p.BloodGroup.ToString(),
                City = p.City,
                InsuranceType = p.InsuranceType.ToString(),
                IsVIP = p.IsVIP,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        return ApiResponse<PagedResponse<PatientListResponse>>.Ok(
            new PagedResponse<PatientListResponse>
            {
                Items = patients,
                TotalCount = total,
                Page = page,
                PageSize = pageSize
            });
    }

    public async Task<ApiResponse<PatientResponse>> GetByIdAsync(
        Guid id, Guid hospitalId)
    {
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == id
                && p.HospitalId == hospitalId);

        if (patient == null)
            return ApiResponse<PatientResponse>.Fail("Patient not found");

        return ApiResponse<PatientResponse>.Ok(MapToResponse(patient));
    }

    public async Task<ApiResponse<PatientResponse>> CreateAsync(
        CreatePatientRequest request, Guid hospitalId)
    {
        // ─── Check duplicate mobile ────────────────────
        var exists = await _context.Patients
            .AnyAsync(p => p.HospitalId == hospitalId
                && p.MobileNumber == request.MobileNumber);

        if (exists)
            return ApiResponse<PatientResponse>.Fail(
                "A patient with this mobile number already exists.");

        // ─── Generate UHID ─────────────────────────────
        var count = await _context.Patients
            .Where(p => p.HospitalId == hospitalId)
            .CountAsync();
        var year = DateTime.UtcNow.Year;
        var uhid = $"ARG-{year}-{(count + 1):D5}";

        // ─── Create Patient ────────────────────────────
        var patient = new Patient
        {
            HospitalId = hospitalId,
            UHID = uhid,
            FirstName = request.FirstName,
            MiddleName = request.MiddleName,
            LastName = request.LastName,
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            BloodGroup = request.BloodGroup,
            MaritalStatus = request.MaritalStatus,
            MobileNumber = request.MobileNumber,
            AlternateMobile = request.AlternateMobile,
            Email = request.Email,
            Address = request.Address,
            City = request.City,
            District = request.District ?? string.Empty,
            State = request.State,
            PinCode = request.PinCode,
            AadhaarNumber = request.AadhaarNumber,
            ABHAId = request.ABHAId,
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactPhone = request.EmergencyContactPhone,
            EmergencyContactRelation = request.EmergencyContactRelation,
            InsuranceType = request.InsuranceType,
            InsurancePolicyNumber = request.InsurancePolicyNumber,
            InsuranceProviderName = request.InsuranceProviderName,
            AyushmanCardNumber = request.AyushmanCardNumber,
            KnownAllergies = request.KnownAllergies,
            ChronicConditions = request.ChronicConditions,
        };

        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        await _audit.LogAsync(hospitalId, "Patient", patient.Id.ToString(), AuditAction.Create,
            $"Registered patient {patient.FullName} (UHID: {uhid})");

        return ApiResponse<PatientResponse>.Ok(
            MapToResponse(patient),
            $"Patient registered successfully! UHID: {uhid}");
    }

    public async Task<ApiResponse<PatientResponse>> UpdateAsync(
        Guid id, UpdatePatientRequest request, Guid hospitalId)
    {
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == id
                && p.HospitalId == hospitalId);

        if (patient == null)
            return ApiResponse<PatientResponse>.Fail("Patient not found");

        patient.FirstName = request.FirstName;
        patient.MiddleName = request.MiddleName;
        patient.LastName = request.LastName;
        patient.DateOfBirth = request.DateOfBirth;
        patient.Gender = request.Gender;
        patient.BloodGroup = request.BloodGroup;
        patient.MaritalStatus = request.MaritalStatus;
        patient.MobileNumber = request.MobileNumber;
        patient.AlternateMobile = request.AlternateMobile;
        patient.Email = request.Email;
        patient.Address = request.Address;
        patient.City = request.City;
        patient.District = request.District ?? string.Empty;
        patient.State = request.State;
        patient.PinCode = request.PinCode;
        patient.AadhaarNumber = request.AadhaarNumber;
        patient.ABHAId = request.ABHAId;
        patient.EmergencyContactName = request.EmergencyContactName;
        patient.EmergencyContactPhone = request.EmergencyContactPhone;
        patient.EmergencyContactRelation = request.EmergencyContactRelation;
        patient.InsuranceType = request.InsuranceType;
        patient.InsurancePolicyNumber = request.InsurancePolicyNumber;
        patient.InsuranceProviderName = request.InsuranceProviderName;
        patient.AyushmanCardNumber = request.AyushmanCardNumber;
        patient.KnownAllergies = request.KnownAllergies;
        patient.ChronicConditions = request.ChronicConditions;
        patient.IsVIP = request.IsVIP;
        patient.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _audit.LogAsync(hospitalId, "Patient", patient.Id.ToString(), AuditAction.Update,
            $"Updated patient record for {patient.FullName} (UHID: {patient.UHID})");

        return ApiResponse<PatientResponse>.Ok(
            MapToResponse(patient), "Patient updated successfully");
    }

    public async Task<ApiResponse<List<PatientListResponse>>> SearchAsync(
        string query, Guid hospitalId)
    {
        query = query.ToLower();

        var patients = await _context.Patients
            .Where(p => p.HospitalId == hospitalId &&
                (p.FirstName.ToLower().Contains(query) ||
                 p.LastName.ToLower().Contains(query) ||
                 p.MobileNumber.Contains(query) ||
                 p.UHID.ToLower().Contains(query) ||
                 (p.AadhaarNumber != null &&
                  p.AadhaarNumber.Contains(query))))
            .Take(10)
            .Select(p => new PatientListResponse
            {
                Id = p.Id,
                UHID = p.UHID,
                FullName = $"{p.FirstName} {p.MiddleName} {p.LastName}"
                    .Replace("  ", " ").Trim(),
                Age = (int)((DateTime.UtcNow - p.DateOfBirth)
                    .TotalDays / 365.25),
                Gender = p.Gender.ToString(),
                MobileNumber = p.MobileNumber,
                BloodGroup = p.BloodGroup.ToString(),
                City = p.City,
                InsuranceType = p.InsuranceType.ToString(),
                IsVIP = p.IsVIP,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        return ApiResponse<List<PatientListResponse>>.Ok(patients);
    }

    private static PatientResponse MapToResponse(Patient p) => new()
    {
        Id = p.Id,
        UHID = p.UHID,
        FullName = $"{p.FirstName} {p.MiddleName} {p.LastName}"
            .Replace("  ", " ").Trim(),
        FirstName = p.FirstName,
        MiddleName = p.MiddleName,
        LastName = p.LastName,
        DateOfBirth = p.DateOfBirth,
        Age = (int)((DateTime.UtcNow - p.DateOfBirth).TotalDays / 365.25),
        Gender = p.Gender.ToString(),
        BloodGroup = p.BloodGroup.ToString(),
        MaritalStatus = p.MaritalStatus.ToString(),
        MobileNumber = p.MobileNumber,
        AlternateMobile = p.AlternateMobile,
        Email = p.Email,
        Address = p.Address,
        City = p.City,
        District = p.District,
        State = p.State,
        PinCode = p.PinCode,
        AadhaarNumber = p.AadhaarNumber,
        ABHAId = p.ABHAId,
        EmergencyContactName = p.EmergencyContactName,
        EmergencyContactPhone = p.EmergencyContactPhone,
        EmergencyContactRelation = p.EmergencyContactRelation,
        InsuranceType = p.InsuranceType.ToString(),
        InsurancePolicyNumber = p.InsurancePolicyNumber,
        InsuranceProviderName = p.InsuranceProviderName,
        AyushmanCardNumber = p.AyushmanCardNumber,
        KnownAllergies = p.KnownAllergies,
        ChronicConditions = p.ChronicConditions,
        IsVIP = p.IsVIP,
        HasPortalAccess = p.HasPortalAccess,
        CreatedAt = p.CreatedAt
    };
}