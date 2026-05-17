using System.ComponentModel.DataAnnotations;

namespace MedCareAxis.Core.DTOs.Request;

public class CreateAppointmentRequest
{
    [Required]
    public Guid PatientId { get; set; }
    [Required]
    public Guid DoctorId { get; set; }
    [Required]
    public Guid DepartmentId { get; set; }
    [Required]
    public DateTime AppointmentDateTime { get; set; }
    public int ConsultationType { get; set; } = 0;
    public int Priority { get; set; } = 1;
    public string? ChiefComplaint { get; set; }
    public string? Notes { get; set; }
    public bool IsWalkIn { get; set; } = false;
}

public class UpdateAppointmentStatusRequest
{
    [Required]
    public int Status { get; set; }
    public string? CancelledReason { get; set; }
}

public class CollectFeeRequest
{
    [Required]
    public string PaymentMode { get; set; } = "Cash";
    public decimal? FeeOverride { get; set; }
}
