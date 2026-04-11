using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Core.DTOs.Response;
using ArogyaOS.Core.Entities;
using ArogyaOS.Core.Enums;
using ArogyaOS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArogyaOS.Infrastructure.Services;

public interface IDepartmentService
{
    Task<ApiResponse<List<DepartmentResponse>>> GetAllAsync(Guid hospitalId);
    Task<ApiResponse<DepartmentResponse>> CreateAsync(CreateDepartmentRequest request, Guid hospitalId);
    Task<ApiResponse<List<DoctorListResponse>>> GetDoctorsAsync(Guid hospitalId, Guid? departmentId);
    Task<ApiResponse<DoctorResponse>> GetDoctorByIdAsync(Guid id, Guid hospitalId);
    Task<ApiResponse<DoctorResponse>> CreateDoctorAsync(CreateDoctorRequest request, Guid hospitalId);
    Task<ApiResponse<bool>> UpdateDoctorAvailabilityAsync(Guid doctorId, bool isAvailable, Guid hospitalId);
    Task<ApiResponse<DoctorResponse>> UpdateDoctorAsync(Guid id, UpdateDoctorRequest request, Guid hospitalId);
}

public class DepartmentService : IDepartmentService
{
    private readonly AppDbContext _context;

    public DepartmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<DepartmentResponse>>> GetAllAsync(Guid hospitalId)
    {
        var departments = await _context.Departments
            .Where(d => d.HospitalId == hospitalId && d.IsActive)
            .Select(d => new DepartmentResponse
            {
                Id = d.Id,
                Code = d.Code,
                Name = d.Name,
                Description = d.Description,
                Location = d.Location,
                ContactExtension = d.ContactExtension,
                IsActive = d.IsActive,
                DoctorCount = d.Doctors.Count(doc => doc.IsActive),
                CreatedAt = d.CreatedAt
            })
            .OrderBy(d => d.Name)
            .ToListAsync();

        return ApiResponse<List<DepartmentResponse>>.Ok(departments);
    }

    public async Task<ApiResponse<DepartmentResponse>> CreateAsync(
        CreateDepartmentRequest request, Guid hospitalId)
    {
        // ─── Check duplicate code ──────────────────────
        var exists = await _context.Departments
            .AnyAsync(d => d.HospitalId == hospitalId
                && d.Code.ToLower() == request.Code.ToLower());

        if (exists)
            return ApiResponse<DepartmentResponse>.Fail(
                "Department code already exists.");

        var department = new Department
        {
            HospitalId = hospitalId,
            Code = request.Code.ToUpper(),
            Name = request.Name,
            Description = request.Description,
            Location = request.Location,
            ContactExtension = request.ContactExtension,
            IsActive = true
        };

        _context.Departments.Add(department);
        await _context.SaveChangesAsync();

        return ApiResponse<DepartmentResponse>.Ok(new DepartmentResponse
        {
            Id = department.Id,
            Code = department.Code,
            Name = department.Name,
            Description = department.Description,
            Location = department.Location,
            IsActive = department.IsActive,
            CreatedAt = department.CreatedAt
        }, "Department created successfully!");
    }

    public async Task<ApiResponse<List<DoctorListResponse>>> GetDoctorsAsync(
        Guid hospitalId, Guid? departmentId)
    {
        var query = _context.Doctors
            .Include(d => d.Department)
            .Where(d => d.HospitalId == hospitalId && d.IsActive);

        if (departmentId.HasValue)
            query = query.Where(d => d.DepartmentId == departmentId.Value);

        var doctors = await query
    .OrderBy(d => d.FirstName)
    .Select(d => new DoctorListResponse
    {
        Id = d.Id,
        FullName = $"Dr. {d.FirstName} {d.LastName}",
        Specialization = d.Specialization,
        Qualification = d.Qualification,
        DepartmentName = d.Department != null ? d.Department.Name : "",
        ConsultationFee = d.ConsultationFee,
        IsAvailable = d.IsAvailable,
        MobileNumber = d.MobileNumber
    })
    .ToListAsync();

        return ApiResponse<List<DoctorListResponse>>.Ok(doctors);
    }

    public async Task<ApiResponse<DoctorResponse>> GetDoctorByIdAsync(
        Guid id, Guid hospitalId)
    {
        var doctor = await _context.Doctors
            .Include(d => d.Department)
            .Include(d => d.Schedules)
            .FirstOrDefaultAsync(d => d.Id == id
                && d.HospitalId == hospitalId);

        if (doctor == null)
            return ApiResponse<DoctorResponse>.Fail("Doctor not found");

        return ApiResponse<DoctorResponse>.Ok(MapDoctorToResponse(doctor));
    }

    public async Task<ApiResponse<DoctorResponse>> CreateDoctorAsync(
        CreateDoctorRequest request, Guid hospitalId)
    {
        // ─── Verify department exists ──────────────────
        var department = await _context.Departments
            .FirstOrDefaultAsync(d => d.Id == request.DepartmentId
                && d.HospitalId == hospitalId);

        if (department == null)
            return ApiResponse<DoctorResponse>.Fail("Department not found");

        // ─── Generate employee code ────────────────────
        var count = await _context.Doctors
            .Where(d => d.HospitalId == hospitalId)
            .CountAsync();
        var employeeCode = $"DOC-{(count + 1):D3}";

        var doctor = new Doctor
        {
            HospitalId = hospitalId,
            EmployeeCode = employeeCode,
            UserId = Guid.NewGuid().ToString(),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Qualification = request.Qualification,
            Specialization = request.Specialization,
            SubSpecialization = request.SubSpecialization,
            RegistrationNumber = request.RegistrationNumber,
            ExperienceYears = request.ExperienceYears,
            MobileNumber = request.MobileNumber,
            Email = request.Email,
            DepartmentId = request.DepartmentId,
            ConsultationFee = request.ConsultationFee,
            FollowUpFee = request.FollowUpFee,
            EmploymentType = (EmploymentType)request.EmploymentType,
            IsAvailable = true,
            IsActive = true
        };

        _context.Doctors.Add(doctor);

        // ─── Add schedules ─────────────────────────────
        foreach (var s in request.Schedules)
        {
            var schedule = new DoctorSchedule
            {
                HospitalId = hospitalId,
                DoctorId = doctor.Id,
                DayOfWeek = (DayOfWeek)s.DayOfWeek,
                StartTime = TimeOnly.Parse(s.StartTime),
                EndTime = TimeOnly.Parse(s.EndTime),
                SlotDurationMinutes = s.SlotDurationMinutes,
                MaxPatients = s.MaxPatients,
                IsActive = true
            };
            _context.DoctorSchedules.Add(schedule);
        }

        await _context.SaveChangesAsync();

        var result = await _context.Doctors
            .Include(d => d.Department)
            .Include(d => d.Schedules)
            .FirstOrDefaultAsync(d => d.Id == doctor.Id);

        return ApiResponse<DoctorResponse>.Ok(
            MapDoctorToResponse(result!),
            $"Doctor added successfully! Code: {employeeCode}");
    }

    public async Task<ApiResponse<bool>> UpdateDoctorAvailabilityAsync(
        Guid doctorId, bool isAvailable, Guid hospitalId)
    {
        var doctor = await _context.Doctors
            .FirstOrDefaultAsync(d => d.Id == doctorId
                && d.HospitalId == hospitalId);

        if (doctor == null)
            return ApiResponse<bool>.Fail("Doctor not found");

        doctor.IsAvailable = isAvailable;
        doctor.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true,
            $"Doctor marked as {(isAvailable ? "Available" : "Unavailable")}");
    }
    public async Task<ApiResponse<DoctorResponse>> UpdateDoctorAsync(
    Guid id, UpdateDoctorRequest request, Guid hospitalId)
{
    var doctor = await _context.Doctors
        .Include(d => d.Schedules)
        .FirstOrDefaultAsync(d => d.Id == id
            && d.HospitalId == hospitalId);

    if (doctor == null)
        return ApiResponse<DoctorResponse>.Fail("Doctor not found");

    doctor.FirstName = request.FirstName;
    doctor.LastName = request.LastName;
    doctor.Qualification = request.Qualification;
    doctor.Specialization = request.Specialization;
    doctor.SubSpecialization = request.SubSpecialization;
    doctor.RegistrationNumber = request.RegistrationNumber;
    doctor.ExperienceYears = request.ExperienceYears;
    doctor.MobileNumber = request.MobileNumber;
    doctor.Email = request.Email;
    doctor.DepartmentId = request.DepartmentId;
    doctor.ConsultationFee = request.ConsultationFee;
    doctor.FollowUpFee = request.FollowUpFee;
    doctor.EmploymentType = (EmploymentType)request.EmploymentType;
    doctor.UpdatedAt = DateTime.UtcNow;

    // ─── Update Schedules ──────────────────────────
    var oldSchedules = _context.DoctorSchedules
        .Where(s => s.DoctorId == id);
    _context.DoctorSchedules.RemoveRange(oldSchedules);

    foreach (var s in request.Schedules)
    {
        _context.DoctorSchedules.Add(new DoctorSchedule
        {
            HospitalId = hospitalId,
            DoctorId = doctor.Id,
            DayOfWeek = (DayOfWeek)s.DayOfWeek,
            StartTime = TimeOnly.Parse(s.StartTime),
            EndTime = TimeOnly.Parse(s.EndTime),
            SlotDurationMinutes = s.SlotDurationMinutes,
            MaxPatients = s.MaxPatients,
            IsActive = true
        });
    }

    await _context.SaveChangesAsync();

    var updated = await _context.Doctors
        .Include(d => d.Department)
        .Include(d => d.Schedules)
        .FirstOrDefaultAsync(d => d.Id == id);

    return ApiResponse<DoctorResponse>.Ok(
        MapDoctorToResponse(updated!),
        "Doctor updated successfully!");
}
    private static DoctorResponse MapDoctorToResponse(Doctor d) => new()
    {
        Id = d.Id,
        EmployeeCode = d.EmployeeCode,
        FullName = $"Dr. {d.FirstName} {d.LastName}",
        FirstName = d.FirstName,
        LastName = d.LastName,
        Qualification = d.Qualification,
        Specialization = d.Specialization,
        SubSpecialization = d.SubSpecialization,
        RegistrationNumber = d.RegistrationNumber,
        ExperienceYears = d.ExperienceYears,
        MobileNumber = d.MobileNumber,
        Email = d.Email,
        DepartmentId = d.DepartmentId,
        DepartmentName = d.Department?.Name ?? "",
        ConsultationFee = d.ConsultationFee,
        FollowUpFee = d.FollowUpFee,
        EmploymentType = d.EmploymentType.ToString(),
        IsAvailable = d.IsAvailable,
        IsActive = d.IsActive,
        CreatedAt = d.CreatedAt,
        Schedules = d.Schedules.Select(s => new DoctorScheduleResponse
        {
            Id = s.Id,
            DayOfWeek = s.DayOfWeek.ToString(),
            StartTime = s.StartTime.ToString("HH:mm"),
            EndTime = s.EndTime.ToString("HH:mm"),
            SlotDurationMinutes = s.SlotDurationMinutes,
            MaxPatients = s.MaxPatients,
            IsActive = s.IsActive
        }).ToList()
    };
}