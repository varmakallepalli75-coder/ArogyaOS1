using System.Security.Claims;
using ArogyaOS.Core.DTOs.Response;
using ArogyaOS.Core.Entities;
using ArogyaOS.Core.Enums;
using ArogyaOS.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace ArogyaOS.Infrastructure.Services;

public interface IAuditService
{
    Task LogAsync(Guid? hospitalId, string entityName, string entityId, AuditAction action,
                  string? notes = null, string? oldValues = null, string? newValues = null,
                  string? performedByOverride = null);

    Task<PagedResponse<AuditLogResponse>> GetLogsAsync(Guid hospitalId, int page, int pageSize, string? search);
}

public class AuditService : IAuditService
{
    private readonly AppDbContext _context;
    private readonly IHttpContextAccessor _http;

    public AuditService(AppDbContext context, IHttpContextAccessor http)
    {
        _context = context;
        _http = http;
    }

    public async Task LogAsync(Guid? hospitalId, string entityName, string entityId, AuditAction action,
                               string? notes = null, string? oldValues = null, string? newValues = null,
                               string? performedByOverride = null)
    {
        var ctx = _http.HttpContext;
        var performedBy = performedByOverride
                       ?? ctx?.User?.FindFirst(ClaimTypes.Email)?.Value
                       ?? ctx?.User?.FindFirst(ClaimTypes.Name)?.Value;
        var ip = ctx?.Connection?.RemoteIpAddress?.ToString();

        _context.AuditLogs.Add(new AuditLog
        {
            HospitalId  = hospitalId,
            EntityName  = entityName,
            EntityId    = entityId,
            Action      = action,
            Notes       = notes,
            OldValues   = oldValues,
            NewValues   = newValues,
            PerformedBy = performedBy,
            IpAddress   = ip,
            CreatedAt   = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
    }

    public async Task<PagedResponse<AuditLogResponse>> GetLogsAsync(
        Guid hospitalId, int page, int pageSize, string? search)
    {
        var query = _context.AuditLogs
            .Where(l => l.HospitalId == hospitalId)
            .OrderByDescending(l => l.CreatedAt)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(l =>
                l.EntityName.Contains(search) ||
                (l.PerformedBy != null && l.PerformedBy.Contains(search)) ||
                (l.Notes != null && l.Notes.Contains(search)));

        var total = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new AuditLogResponse
            {
                Id          = l.Id,
                EntityName  = l.EntityName,
                EntityId    = l.EntityId,
                Action      = l.Action.ToString(),
                Notes       = l.Notes,
                OldValues   = l.OldValues,
                NewValues   = l.NewValues,
                PerformedBy = l.PerformedBy,
                IpAddress   = l.IpAddress,
                CreatedAt   = l.CreatedAt
            })
            .ToListAsync();

        return new PagedResponse<AuditLogResponse>
        {
            Items      = items,
            Page       = page,
            PageSize   = pageSize,
            TotalCount = total
        };
    }
}
