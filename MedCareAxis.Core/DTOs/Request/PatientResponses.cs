using MedCareAxis.Core.Enums;

namespace MedCareAxis.Core.DTOs.Response;

public class PatientResponse
{
    public Guid Id { get; set; }
    public string UHID { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public int Age { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string BloodGroup { get; set; } = string.Empty;
    public string MaritalStatus { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? AlternateMobile { get; set; }
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PinCode { get; set; } = string.Empty;
    public string? AadhaarNumber { get; set; }
    public string? ABHAId { get; set; }
    public string EmergencyContactName { get; set; } = string.Empty;
    public string EmergencyContactPhone { get; set; } = string.Empty;
    public string EmergencyContactRelation { get; set; } = string.Empty;
    public string InsuranceType { get; set; } = string.Empty;
    public string? InsurancePolicyNumber { get; set; }
    public string? InsuranceProviderName { get; set; }
    public string? AyushmanCardNumber { get; set; }
    public string? KnownAllergies { get; set; }
    public string? ChronicConditions { get; set; }
    public bool IsVIP { get; set; }
    public bool HasPortalAccess { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PatientListResponse
{
    public Guid Id { get; set; }
    public string UHID { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public int Age { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string BloodGroup { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string InsuranceType { get; set; } = string.Empty;
    public bool IsVIP { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PagedResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNext => Page < TotalPages;
    public bool HasPrevious => Page > 1;
}