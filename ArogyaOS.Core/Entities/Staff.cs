using ArogyaOS.Core.Enums;

namespace ArogyaOS.Core.Entities;

public class Staff : BaseEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Identity ──────────────────────────────────────
    public string EmployeeCode { get; set; } = string.Empty;  // e.g. EMP-001
    public string UserId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public string? ProfilePhotoUrl { get; set; }
    public DateTime DateOfBirth { get; set; }
    public Gender Gender { get; set; }
    public string? AadhaarNumber { get; set; }
    public string? PANNumber { get; set; }

    // ─── Contact ───────────────────────────────────────
    public string MobileNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PinCode { get; set; } = string.Empty;

    // ─── Employment ────────────────────────────────────
    public EmployeeType EmployeeType { get; set; }
    public EmploymentType EmploymentType { get; set; }
    public Guid DepartmentId { get; set; }
    public string? Designation { get; set; }
    public DateTime JoiningDate { get; set; }
    public DateTime? ResignationDate { get; set; }
    public bool IsActive { get; set; } = true;

    // ─── Salary ────────────────────────────────────────
    public decimal BasicSalary { get; set; }
    public decimal? HRA { get; set; }
    public decimal? DA { get; set; }
    public decimal? OtherAllowances { get; set; }
    public decimal GrossSalary { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankName { get; set; }
    public string? IFSCCode { get; set; }
    public string? PFNumber { get; set; }
    public string? ESICNumber { get; set; }

    // ─── Emergency Contact ─────────────────────────────
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public Department? Department { get; set; }
    public ICollection<StaffShift> Shifts { get; set; }
        = new List<StaffShift>();
    public ICollection<StaffLeave> Leaves { get; set; }
        = new List<StaffLeave>();
    public ICollection<StaffAttendance> Attendances { get; set; }
        = new List<StaffAttendance>();
}

public class StaffShift : BaseEntity
{
    public Guid HospitalId { get; set; }
    public Guid StaffId { get; set; }
    public ShiftType ShiftType { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public bool IsActive { get; set; } = true;
    public Staff? Staff { get; set; }
}

public class StaffLeave : BaseEntity
{
    public Guid HospitalId { get; set; }
    public Guid StaffId { get; set; }
    public LeaveType LeaveType { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalDays { get; set; }
    public string? Reason { get; set; }
    public LeaveStatus Status { get; set; } = LeaveStatus.Pending;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public Staff? Staff { get; set; }
}

public class StaffAttendance : BaseEntity
{
    public Guid HospitalId { get; set; }
    public Guid StaffId { get; set; }
    public DateTime AttendanceDate { get; set; }
    public TimeOnly? CheckInTime { get; set; }
    public TimeOnly? CheckOutTime { get; set; }
    public bool IsPresent { get; set; } = false;
    public bool IsHalfDay { get; set; } = false;
    public bool IsOnLeave { get; set; } = false;
    public string? Notes { get; set; }
    public Staff? Staff { get; set; }
}
