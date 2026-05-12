using ArogyaOS.Core.Enums;

namespace ArogyaOS.Core.DTOs.Response;

public class SuperAdminDashboardResponse
{
    public int TotalHospitals { get; set; }
    public int ActiveHospitals { get; set; }
    public int SuspendedHospitals { get; set; }
    public int PendingHospitals { get; set; }
    public int TotalPatients { get; set; }
    public int TotalAppointments { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal MRR { get; set; }
    public List<HospitalListResponse> RecentHospitals { get; set; } = new();
}

public class RevenueAnalyticsResponse
{
    public List<MonthlyRevenuePoint> MonthlyRevenue { get; set; } = new();
    public List<PlanDistributionItem> PlanDistribution { get; set; } = new();
    public List<MonthlyRevenuePoint> HospitalGrowth { get; set; } = new();
    public decimal TotalCollected { get; set; }
    public decimal ProjectedAnnual { get; set; }
    public int ChurnedThisMonth { get; set; }
    public int NewThisMonth { get; set; }
}

public class MonthlyRevenuePoint
{
    public string Month { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int Count { get; set; }
}

public class PlanDistributionItem
{
    public string Plan { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Revenue { get; set; }
}

public class AnnouncementResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class SubscriptionPaymentResponse
{
    public Guid Id { get; set; }
    public Guid HospitalId { get; set; }
    public string HospitalName { get; set; } = string.Empty;
    public string HospitalCode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime PaidOn { get; set; }
    public string PaymentMode { get; set; } = string.Empty;
    public string? InvoiceNumber { get; set; }
    public string? Notes { get; set; }
}

public class RenewalAlertResponse
{
    public Guid HospitalId { get; set; }
    public string HospitalCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string AdminPhone { get; set; } = string.Empty;
    public string Plan { get; set; } = string.Empty;
    public decimal MonthlyAmount { get; set; }
    public DateTime SubscriptionEnd { get; set; }
    public int DaysRemaining { get; set; }
    public string Urgency { get; set; } = string.Empty; // Critical / Warning / Upcoming
}

public class PlatformSettingsResponse
{
    public bool MaintenanceMode { get; set; }
    public string MaintenanceMessage { get; set; } = string.Empty;
    public string SupportEmail { get; set; } = string.Empty;
    public string PlatformVersion { get; set; } = string.Empty;
    public string TermsUrl { get; set; } = string.Empty;
    public string PrivacyUrl { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
    public string UpdatedBy { get; set; } = string.Empty;
}

public class HospitalHealthResponse
{
    public Guid Id { get; set; }
    public string HospitalCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Plan { get; set; } = string.Empty;
    public int HealthScore { get; set; }
    public string HealthLabel { get; set; } = string.Empty;
    public DateTime? LastAdminLogin { get; set; }
    public int PatientsThisMonth { get; set; }
    public int AppointmentsThisMonth { get; set; }
    public bool SubscriptionActive { get; set; }
    public DateTime? SubscriptionEnd { get; set; }
    public List<string> Warnings { get; set; } = new();
}

public class HospitalListResponse
{
    public Guid Id { get; set; }
    public string HospitalCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string Status { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string AdminPhone { get; set; } = string.Empty;
    public int TotalBeds { get; set; }
    public string? HospitalType { get; set; }
    public string? Category { get; set; }
    public string Plan { get; set; } = string.Empty;
    public string SubscriptionStatus { get; set; } = string.Empty;
    public DateTime? SubscriptionEndDate { get; set; }
    public decimal MonthlyAmount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class HospitalDetailResponse
{
    public Guid Id { get; set; }
    public string HospitalCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? District { get; set; }
    public string State { get; set; } = string.Empty;
    public string PinCode { get; set; } = string.Empty;
    public string? GSTNumber { get; set; }
    public int TotalBeds { get; set; }
    public string? HospitalType { get; set; }
    public string? Category { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool HasOPD { get; set; }
    public bool HasIPD { get; set; }
    public bool HasLab { get; set; }
    public bool HasPharmacy { get; set; }
    public bool HasRadiology { get; set; }
    public bool HasBilling { get; set; }
    public bool HasPatientPortal { get; set; }
    public bool HasHR { get; set; }
    public bool HasReports { get; set; }
    public bool HasOT { get; set; }
    public bool HasBloodBank { get; set; }
    public bool HasAmbulance { get; set; }
    public bool HasTeleConsult { get; set; }
    public bool HasInventory { get; set; }
    public string AdminName { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string AdminPhone { get; set; } = string.Empty;
    public string? AdminUserId { get; set; }
    public int PatientCount { get; set; }
    public int DoctorCount { get; set; }
    public int AppointmentCount { get; set; }
    public string Plan { get; set; } = string.Empty;
    public string SubscriptionStatus { get; set; } = string.Empty;
    public DateTime? SubscriptionStart { get; set; }
    public DateTime? SubscriptionEnd { get; set; }
    public decimal MonthlyAmount { get; set; }
    public DateTime CreatedAt { get; set; }
}
