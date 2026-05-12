using ArogyaOS.Core.DTOs.Response;
using ArogyaOS.Core.Entities;
using ArogyaOS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArogyaOS.Infrastructure.Services;

public class CreateTicketRequest
{
    public string Subject { get; set; } = string.Empty;
    public string Category { get; set; } = "Technical";
    public string Priority { get; set; } = "Medium";
    public string Message { get; set; } = string.Empty;
}

public class ReplyTicketRequest
{
    public string Message { get; set; } = string.Empty;
}

public class TicketResponse
{
    public Guid Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string RaisedByName { get; set; } = string.Empty;
    public string? HospitalName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public List<MessageResponse> Messages { get; set; } = new();
}

public class MessageResponse
{
    public Guid Id { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public bool IsFromSupport { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public interface ISupportService
{
    Task<ApiResponse<TicketResponse>> CreateTicketAsync(CreateTicketRequest request, Guid hospitalId, string userId, string userName);
    Task<ApiResponse<List<TicketResponse>>> GetHospitalTicketsAsync(Guid hospitalId);
    Task<ApiResponse<TicketResponse>> GetTicketAsync(Guid ticketId, Guid? hospitalId);
    Task<ApiResponse<TicketResponse>> ReplyAsync(Guid ticketId, ReplyTicketRequest request, string userId, string senderName, bool isFromSupport, Guid? hospitalId);
    Task<ApiResponse<TicketResponse>> UpdateStatusAsync(Guid ticketId, string status);
    Task<ApiResponse<List<TicketResponse>>> GetAllTicketsAsync(string? status);
}

public class SupportService : ISupportService
{
    private readonly AppDbContext _context;

    public SupportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<TicketResponse>> CreateTicketAsync(
        CreateTicketRequest request, Guid hospitalId, string userId, string userName)
    {
        var count = await _context.SupportTickets.CountAsync();
        var ticketNumber = $"TKT-{DateTime.Now:yyyyMMdd}-{(count + 1):D4}";

        if (!Enum.TryParse<TicketCategory>(request.Category, true, out var category))
            category = TicketCategory.Technical;
        if (!Enum.TryParse<TicketPriority>(request.Priority, true, out var priority))
            priority = TicketPriority.Medium;

        var ticket = new SupportTicket
        {
            HospitalId       = hospitalId,
            TicketNumber     = ticketNumber,
            Subject          = request.Subject,
            Category         = category,
            Priority         = priority,
            Status           = TicketStatus.Open,
            RaisedByUserId   = userId,
            RaisedByName     = userName,
        };
        _context.SupportTickets.Add(ticket);

        var message = new SupportMessage
        {
            TicketId      = ticket.Id,
            SenderUserId  = userId,
            SenderName    = userName,
            IsFromSupport = false,
            Body          = request.Message,
        };
        _context.SupportMessages.Add(message);

        await _context.SaveChangesAsync();
        return ApiResponse<TicketResponse>.Ok(await BuildResponse(ticket.Id), "Ticket raised successfully.");
    }

    public async Task<ApiResponse<List<TicketResponse>>> GetHospitalTicketsAsync(Guid hospitalId)
    {
        var tickets = await _context.SupportTickets
            .Where(t => t.HospitalId == hospitalId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var responses = new List<TicketResponse>();
        foreach (var t in tickets)
            responses.Add(await BuildResponse(t.Id));

        return ApiResponse<List<TicketResponse>>.Ok(responses);
    }

    public async Task<ApiResponse<TicketResponse>> GetTicketAsync(Guid ticketId, Guid? hospitalId)
    {
        var ticket = await _context.SupportTickets.FindAsync(ticketId);
        if (ticket == null) return ApiResponse<TicketResponse>.Fail("Ticket not found.");
        if (hospitalId.HasValue && ticket.HospitalId != hospitalId.Value)
            return ApiResponse<TicketResponse>.Fail("Ticket not found.");
        return ApiResponse<TicketResponse>.Ok(await BuildResponse(ticketId));
    }

    public async Task<ApiResponse<TicketResponse>> ReplyAsync(
        Guid ticketId, ReplyTicketRequest request,
        string userId, string senderName, bool isFromSupport, Guid? hospitalId)
    {
        var ticket = await _context.SupportTickets.FindAsync(ticketId);
        if (ticket == null) return ApiResponse<TicketResponse>.Fail("Ticket not found.");
        if (hospitalId.HasValue && ticket.HospitalId != hospitalId.Value)
            return ApiResponse<TicketResponse>.Fail("Ticket not found.");

        if (ticket.Status == TicketStatus.Closed)
            return ApiResponse<TicketResponse>.Fail("Cannot reply to a closed ticket.");

        if (isFromSupport && ticket.Status == TicketStatus.Open)
            ticket.Status = TicketStatus.InProgress;

        var message = new SupportMessage
        {
            TicketId      = ticketId,
            SenderUserId  = userId,
            SenderName    = senderName,
            IsFromSupport = isFromSupport,
            Body          = request.Message,
        };
        _context.SupportMessages.Add(message);
        await _context.SaveChangesAsync();
        return ApiResponse<TicketResponse>.Ok(await BuildResponse(ticketId));
    }

    public async Task<ApiResponse<TicketResponse>> UpdateStatusAsync(Guid ticketId, string status)
    {
        var ticket = await _context.SupportTickets.FindAsync(ticketId);
        if (ticket == null) return ApiResponse<TicketResponse>.Fail("Ticket not found.");

        if (!Enum.TryParse<TicketStatus>(status, true, out var newStatus))
            return ApiResponse<TicketResponse>.Fail("Invalid status.");

        ticket.Status = newStatus;
        if (newStatus == TicketStatus.Resolved || newStatus == TicketStatus.Closed)
            ticket.ResolvedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return ApiResponse<TicketResponse>.Ok(await BuildResponse(ticketId));
    }

    public async Task<ApiResponse<List<TicketResponse>>> GetAllTicketsAsync(string? status)
    {
        var query = _context.SupportTickets.AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<TicketStatus>(status, true, out var s))
            query = query.Where(t => t.Status == s);

        var tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var responses = new List<TicketResponse>();
        foreach (var t in tickets)
            responses.Add(await BuildResponse(t.Id));

        return ApiResponse<List<TicketResponse>>.Ok(responses);
    }

    private async Task<TicketResponse> BuildResponse(Guid ticketId)
    {
        var ticket = await _context.SupportTickets
            .Include(t => t.Hospital)
            .Include(t => t.Messages)
            .FirstAsync(t => t.Id == ticketId);

        return new TicketResponse
        {
            Id           = ticket.Id,
            TicketNumber = ticket.TicketNumber,
            Subject      = ticket.Subject,
            Category     = ticket.Category.ToString(),
            Priority     = ticket.Priority.ToString(),
            Status       = ticket.Status.ToString(),
            RaisedByName = ticket.RaisedByName,
            HospitalName = ticket.Hospital?.Name,
            CreatedAt    = ticket.CreatedAt,
            ResolvedAt   = ticket.ResolvedAt,
            Messages     = ticket.Messages
                .OrderBy(m => m.CreatedAt)
                .Select(m => new MessageResponse
                {
                    Id            = m.Id,
                    SenderName    = m.SenderName,
                    IsFromSupport = m.IsFromSupport,
                    Body          = m.Body,
                    CreatedAt     = m.CreatedAt,
                }).ToList()
        };
    }
}
