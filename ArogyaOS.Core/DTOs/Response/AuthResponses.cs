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
