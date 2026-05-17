using MedCareAxis.Core.Enums;

namespace MedCareAxis.Core.Entities;

public class Patient : BaseEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Identity ──────────────────────────────────────
    public string UHID { get; set; } = string.Empty;   // e.g. MCA-2024-00001
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {MiddleName} {LastName}"
                                .Replace("  ", " ").Trim();
    public DateTime DateOfBirth { get; set; }
    public int Age => (int)((DateTime.UtcNow - DateOfBirth).TotalDays / 365.25);
    public Gender Gender { get; set; }
    public BloodGroup BloodGroup { get; set; }
    public MaritalStatus MaritalStatus { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public bool IsVIP { get; set; } = false;

    // ─── Contact ───────────────────────────────────────
    public string MobileNumber { get; set; } = string.Empty;
    public string? AlternateMobile { get; set; }
    public string? Email { get; set; }

    // ─── Address ───────────────────────────────────────
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? State { get; set; }
    public string? PinCode { get; set; }

    // ─── Government IDs ────────────────────────────────
    public string? AadhaarNumber { get; set; }
    public string? ABHAId { get; set; }
    public string? PANNumber { get; set; }

    // ─── Emergency Contact ─────────────────────────────
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }

    // ─── Insurance ─────────────────────────────────────
    public InsuranceType InsuranceType { get; set; } = InsuranceType.None;
    public string? InsurancePolicyNumber { get; set; }
    public string? InsuranceProviderName { get; set; }
    public DateTime? InsuranceValidTill { get; set; }
    public string? AyushmanCardNumber { get; set; }
    public string? CGHSNumber { get; set; }
    public string? ESICNumber { get; set; }

    // ─── Medical History ───────────────────────────────
    public string? KnownAllergies { get; set; }
    public string? ChronicConditions { get; set; }
    public string? PastSurgeries { get; set; }
    public string? FamilyHistory { get; set; }
    public string? CurrentMedications { get; set; }

    // ─── Portal Access ─────────────────────────────────
    public string? UserId { get; set; }    // Linked to Identity user
    public bool HasPortalAccess { get; set; } = false;

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public ICollection<Appointment> Appointments { get; set; }
        = new List<Appointment>();
    public ICollection<Admission> Admissions { get; set; }
        = new List<Admission>();
    public ICollection<OPDVisit> OPDVisits { get; set; }
        = new List<OPDVisit>();
    public ICollection<Bill> Bills { get; set; }
        = new List<Bill>();
    public ICollection<LabOrder> LabOrders { get; set; }
        = new List<LabOrder>();
  
    public ICollection<Prescription> Prescriptions { get; set; }
        = new List<Prescription>();
}