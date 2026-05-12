using ArogyaOS.Core.Enums;

namespace ArogyaOS.Core.DTOs.Response;

public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserInfo User { get; set; } = new();
}

public class UserInfo
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public Guid? HospitalId { get; set; }
    public string? HospitalName { get; set; }
    public Guid? DoctorId { get; set; }
    public Guid? StaffId { get; set; }
    public Guid? PatientId { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    // ─── Active modules for this hospital ─────────────
    public bool HasOPD { get; set; } = true;
    public bool HasIPD { get; set; }
    public bool HasLab { get; set; }
    public bool HasPharmacy { get; set; }
    public bool HasRadiology { get; set; }
    public bool HasBilling { get; set; } = true;
    public bool HasHR { get; set; }
    public bool HasReports { get; set; }
    public bool HasPatientPortal { get; set; }
    public bool HasOT { get; set; }
    public bool HasBloodBank { get; set; }
    public bool HasAmbulance { get; set; }
    public bool HasTeleConsult { get; set; }
    public bool HasInventory { get; set; }

    // ─── User-level permissions ────────────────────────
    public bool PermPatients { get; set; }
    public bool PermAppointments { get; set; }
    public bool PermOPD { get; set; }
    public bool PermIPD { get; set; }
    public bool PermLab { get; set; }
    public bool PermPharmacy { get; set; }
    public bool PermBilling { get; set; }
    public bool PermReports { get; set; }
    public bool PermStaff { get; set; }
}

public class RegisterHospitalResponse
{
    public Guid HospitalId { get; set; }
    public string HospitalCode { get; set; } = string.Empty;
    public string HospitalName { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public SubscriptionPlan Plan { get; set; }
}

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string> Errors { get; set; } = new();

    public static ApiResponse<T> Ok(T data, string message = "Success")
        => new() { Success = true, Message = message, Data = data };

    public static ApiResponse<T> Fail(string message, List<string>? errors = null)
        => new() { Success = false, Message = message,
            Errors = errors ?? new() };
}
