using MedCareAxis.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace MedCareAxis.Core.DTOs.Request;

public class UpdateHospitalStatusRequest
{
    [Required]
    public HospitalStatus Status { get; set; }
    [Required]
    public string Reason { get; set; } = string.Empty;
}

public class ResetHospitalPasswordRequest
{
    [Required]
    [MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}

public class UpdateSubscriptionRequest
{
    [Required]
    public SubscriptionPlan Plan { get; set; }
}

public class UpdateModulesRequest
{
    public bool? HasOPD { get; set; }
    public bool? HasIPD { get; set; }
    public bool? HasLab { get; set; }
    public bool? HasPharmacy { get; set; }
    public bool? HasRadiology { get; set; }
    public bool? HasBilling { get; set; }
    public bool? HasHR { get; set; }
    public bool? HasReports { get; set; }
    public bool? HasPatientPortal { get; set; }
    public bool? HasOT { get; set; }
    public bool? HasBloodBank { get; set; }
    public bool? HasAmbulance { get; set; }
    public bool? HasTeleConsult { get; set; }
    public bool? HasInventory { get; set; }
}
