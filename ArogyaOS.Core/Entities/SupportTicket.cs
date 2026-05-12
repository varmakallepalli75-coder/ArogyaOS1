namespace ArogyaOS.Core.Entities;

public enum TicketCategory  { Technical, Billing, Feature, Training, Other }
public enum TicketStatus    { Open, InProgress, Resolved, Closed }
public enum TicketPriority  { Low, Medium, High, Critical }

public class SupportTicket : BaseEntity
{
    public Guid HospitalId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;   // TKT-20260504-0001
    public string Subject { get; set; } = string.Empty;
    public TicketCategory Category { get; set; }
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public TicketStatus Status { get; set; } = TicketStatus.Open;
    public string RaisedByUserId { get; set; } = string.Empty;
    public string RaisedByName { get; set; } = string.Empty;
    public DateTime? ResolvedAt { get; set; }

    public Hospital? Hospital { get; set; }
    public ICollection<SupportMessage> Messages { get; set; } = new List<SupportMessage>();
}

public class SupportMessage : BaseEntity
{
    public Guid TicketId { get; set; }
    public string SenderUserId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public bool IsFromSupport { get; set; } = false;
    public string Body { get; set; } = string.Empty;

    public SupportTicket? Ticket { get; set; }
}
