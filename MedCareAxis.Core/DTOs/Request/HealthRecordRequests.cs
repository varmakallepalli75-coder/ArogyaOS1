using System.ComponentModel.DataAnnotations;

namespace MedCareAxis.Core.DTOs.Request;

public class UnifiedPatientLoginRequest
{
    [Required]
    public string MobileNumber { get; set; } = string.Empty;
    [Required]
    public string DateOfBirth { get; set; } = string.Empty;
}

public class UploadDocumentRequest
{
    [Required]
    public string DocumentType { get; set; } = "Other";
    [Required]
    public string FileName { get; set; } = string.Empty;
    [Required]
    public string FileBase64 { get; set; } = string.Empty;
    public string MimeType { get; set; } = "application/pdf";
    public string? Description { get; set; }
    public string? HospitalName { get; set; }
    public DateTime DocumentDate { get; set; } = DateTime.UtcNow;
}
