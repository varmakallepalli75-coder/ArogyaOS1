using MedCareAxis.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace MedCareAxis.Core.DTOs.Request;

public class CreatePatientRequest
{
    // ─── Identity ──────────────────────────────────────
    [Required]
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    [Required]
    public string LastName { get; set; } = string.Empty;
    [Required]
    public DateTime DateOfBirth { get; set; }
    [Required]
    public Gender Gender { get; set; }
    public BloodGroup BloodGroup { get; set; }
    public MaritalStatus MaritalStatus { get; set; }

    // ─── Contact ───────────────────────────────────────
    [Required]
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

    // ─── Emergency Contact ─────────────────────────────
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }

    // ─── Insurance ─────────────────────────────────────
    public InsuranceType InsuranceType { get; set; } = InsuranceType.None;
    public string? InsurancePolicyNumber { get; set; }
    public string? InsuranceProviderName { get; set; }
    public string? AyushmanCardNumber { get; set; }

    // ─── Medical ───────────────────────────────────────
    public string? KnownAllergies { get; set; }
    public string? ChronicConditions { get; set; }
}

public class UpdatePatientRequest : CreatePatientRequest
{
    public bool IsVIP { get; set; } = false;
}