namespace ArogyaOS.Core.DTOs.Response;

public class AuditLogResponse
{
    public Guid Id { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? PerformedBy { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}
