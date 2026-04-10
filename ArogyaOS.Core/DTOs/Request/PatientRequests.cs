using ArogyaOS.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace ArogyaOS.Core.DTOs.Request;

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
    [Required]
    public string Address { get; set; } = string.Empty;
    [Required]
    public string City { get; set; } = string.Empty;
    public string? District { get; set; }
    [Required]
    public string State { get; set; } = string.Empty;
    [Required]
    public string PinCode { get; set; } = string.Empty;

    // ─── Government IDs ────────────────────────────────
    public string? AadhaarNumber { get; set; }
    public string? ABHAId { get; set; }

    // ─── Emergency Contact ─────────────────────────────
    [Required]
    public string EmergencyContactName { get; set; } = string.Empty;
    [Required]
    public string EmergencyContactPhone { get; set; } = string.Empty;
    [Required]
    public string EmergencyContactRelation { get; set; } = string.Empty;

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