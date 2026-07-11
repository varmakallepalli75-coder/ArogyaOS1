using MedCareAxis.Core.Interfaces;
using MedCareAxis.Core.Enums;

namespace MedCareAxis.Core.Entities;

public class Doctor : BaseEntity, ITenantEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Identity ──────────────────────────────────────
    public string EmployeeCode { get; set; } = string.Empty;   // e.g. DOC-001
    public string UserId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"Dr. {FirstName} {LastName}";
    public string? ProfilePhotoUrl { get; set; }
    public string? Signature { get; set; }
    public string? Bio { get; set; }

    // ─── Professional ──────────────────────────────────
    public string Qualification { get; set; } = string.Empty;  // MBBS, MD, MS
    public string Specialization { get; set; } = string.Empty;
    public string? SubSpecialization { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public EmploymentType EmploymentType { get; set; }

    // ─── Fees ──────────────────────────────────────────
    public decimal ConsultationFee { get; set; }
    public decimal? FollowUpFee { get; set; }
    public decimal? EmergencyFee { get; set; }

    // ─── Contact ───────────────────────────────────────
    public string MobileNumber { get; set; } = string.Empty;
    public string? Email { get; set; }

    // ─── Department ────────────────────────────────────
    public Guid DepartmentId { get; set; }
    public bool IsAvailable { get; set; } = true;
    public bool IsActive { get; set; } = true;

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public Department? Department { get; set; }
    public ICollection<DoctorSchedule> Schedules { get; set; }
        = new List<DoctorSchedule>();
    public ICollection<DoctorLeave> Leaves { get; set; }
        = new List<DoctorLeave>();
    public ICollection<Appointment> Appointments { get; set; }
        = new List<Appointment>();
    public ICollection<OPDVisit> OPDVisits { get; set; }
        = new List<OPDVisit>();
    public ICollection<Prescription> Prescriptions { get; set; }
        = new List<Prescription>();
}

public class DoctorSchedule : BaseEntity, ITenantEntity
{
    public Guid HospitalId { get; set; }
    public Guid DoctorId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int SlotDurationMinutes { get; set; } = 15;
    public int MaxPatients { get; set; } = 20;
    public bool IsActive { get; set; } = true;
    public Doctor? Doctor { get; set; }
}

public class DoctorLeave : BaseEntity, ITenantEntity
{
    public Guid HospitalId { get; set; }
    public Guid DoctorId { get; set; }
    public DateTime LeaveDate { get; set; }
    public DateTime? LeaveTill { get; set; }
    public string? Reason { get; set; }
    public bool IsApproved { get; set; } = false;
    public Doctor? Doctor { get; set; }
}