namespace MedCareAxis.Core.Entities;

public class PatientDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string MobileNumber { get; set; } = string.Empty;
    public string DocumentType { get; set; } = "Other";
    public string FileName { get; set; } = string.Empty;
    public string FileBase64 { get; set; } = string.Empty;
    public string MimeType { get; set; } = "application/pdf";
    public string? Description { get; set; }
    public string? HospitalName { get; set; }
    public DateTime DocumentDate { get; set; } = DateTime.UtcNow;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
