using System.ComponentModel.DataAnnotations;

namespace MedCareAxis.Core.DTOs.Request;

public class UnifiedPatientLoginRequest
{
    [Required]
    public string MobileNumber { get; set; } = string.Empty;
    [Required]
    public string DateOfBirth { get; set; } = string.Empty;
    [Required]
    public string Code { get; set; } = string.Empty;
}

public class UnifiedPatientOtpRequest
{
    [Required]
    public string MobileNumber { get; set; } = string.Empty;
}

public class UploadDocumentRequest
{
    [Required, MaxLength(50)]
    public string DocumentType { get; set; } = "Other";
    [Required, MaxLength(255)]
    public string FileName { get; set; } = string.Empty;
    [Required, StringLength(7000000)]
    public string FileBase64 { get; set; } = string.Empty;
    [MaxLength(100)]
    public string MimeType { get; set; } = "application/pdf";
    [MaxLength(1000)]
    public string? Description { get; set; }
    [MaxLength(200)]
    public string? HospitalName { get; set; }
    public DateTime DocumentDate { get; set; } = DateTime.UtcNow;
}
