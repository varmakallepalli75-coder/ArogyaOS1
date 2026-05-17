using MedCareAxis.Core.DTOs.Request;
using MedCareAxis.Core.DTOs.Response;
using MedCareAxis.Core.Entities;
using MedCareAxis.Core.Enums;
using MedCareAxis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MedCareAxis.Infrastructure.Services;

public interface IOTService
{
    Task<ApiResponse<List<OTRoomResponse>>> GetRoomsAsync(Guid hospitalId);
    Task<ApiResponse<OTRoomResponse>> CreateRoomAsync(CreateOTRoomRequest req, Guid hospitalId, string user);
    Task<ApiResponse<bool>> ToggleRoomAsync(Guid roomId, Guid hospitalId);

    Task<ApiResponse<PagedResponse<OTScheduleResponse>>> GetSchedulesAsync(
        Guid hospitalId, DateTime? date, string? status, int page, int pageSize);
    Task<ApiResponse<List<OTScheduleResponse>>> GetTodaySchedulesAsync(Guid hospitalId);
    Task<ApiResponse<OTScheduleResponse>> GetScheduleByIdAsync(Guid id, Guid hospitalId);
    Task<ApiResponse<OTScheduleResponse>> ScheduleOTAsync(ScheduleOTRequest req, Guid hospitalId, string user);
    Task<ApiResponse<OTScheduleResponse>> UpdateStatusAsync(Guid id, UpdateOTStatusRequest req, Guid hospitalId, string user);
    Task<ApiResponse<OTScheduleResponse>> UpdateChecklistAsync(Guid id, UpdateOTChecklistRequest req, Guid hospitalId, string user);
    Task<ApiResponse<bool>> CancelScheduleAsync(Guid id, Guid hospitalId, string user);
}

public class OTService : IOTService
{
    private readonly AppDbContext _context;
    private readonly IAuditService _audit;

    public OTService(AppDbContext context, IAuditService audit)
    {
        _context = context;
        _audit = audit;
    }

    // ─── Rooms ─────────────────────────────────────────────────────────────

    public async Task<ApiResponse<List<OTRoomResponse>>> GetRoomsAsync(Guid hospitalId)
    {
        var today = DateTime.UtcNow.Date;
        var rooms = await _context.OTRooms
            .Where(r => r.HospitalId == hospitalId)
            .OrderBy(r => r.Name)
            .ToListAsync();

        var todaySchedules = await _context.OTSchedules
            .Where(s => s.HospitalId == hospitalId && s.ScheduledDate.Date == today && !s.IsDeleted)
            .ToListAsync();

        var result = rooms.Select(r => {
            var roomSchedules = todaySchedules.Where(s => s.OTRoomId == r.Id).ToList();
            var current = roomSchedules.FirstOrDefault(s => s.Status == OperationStatus.InProgress);
            return new OTRoomResponse
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                IsActive = r.IsActive,
                TodayScheduled = roomSchedules.Count,
                CurrentSurgery = current?.SurgeryType,
            };
        }).ToList();

        return new ApiResponse<List<OTRoomResponse>> { Success = true, Data = result };
    }

    public async Task<ApiResponse<OTRoomResponse>> CreateRoomAsync(CreateOTRoomRequest req, Guid hospitalId, string user)
    {
        var room = new OTRoom
        {
            HospitalId = hospitalId,
            Name = req.Name,
            Description = req.Description,
            CreatedBy = user,
        };
        _context.OTRooms.Add(room);
        await _context.SaveChangesAsync();
        await _audit.LogAsync(hospitalId, "OTRoom", room.Id.ToString(), AuditAction.Create, $"Created OT room: {room.Name}");

        return new ApiResponse<OTRoomResponse>
        {
            Success = true,
            Data = new OTRoomResponse { Id = room.Id, Name = room.Name, Description = room.Description, IsActive = true }
        };
    }

    public async Task<ApiResponse<bool>> ToggleRoomAsync(Guid roomId, Guid hospitalId)
    {
        var room = await _context.OTRooms.FirstOrDefaultAsync(r => r.Id == roomId && r.HospitalId == hospitalId);
        if (room == null) return new ApiResponse<bool> { Success = false, Message = "Room not found" };
        room.IsActive = !room.IsActive;
        room.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return new ApiResponse<bool> { Success = true, Data = room.IsActive };
    }

    // ─── Schedules ─────────────────────────────────────────────────────────

    public async Task<ApiResponse<PagedResponse<OTScheduleResponse>>> GetSchedulesAsync(
        Guid hospitalId, DateTime? date, string? status, int page, int pageSize)
    {
        var query = _context.OTSchedules
            .Include(s => s.OTRoom)
            .Include(s => s.Patient)
            .Include(s => s.Surgeon)
            .Include(s => s.Anesthetist)
            .Where(s => s.HospitalId == hospitalId && !s.IsDeleted);

        if (date.HasValue)
            query = query.Where(s => s.ScheduledDate.Date == date.Value.Date);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<OperationStatus>(status, out var parsedStatus))
            query = query.Where(s => s.Status == parsedStatus);

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(s => s.ScheduledDate)
            .ThenBy(s => s.StartTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new ApiResponse<PagedResponse<OTScheduleResponse>>
        {
            Success = true,
            Data = new PagedResponse<OTScheduleResponse>
            {
                Items = items.Select(Map).ToList(),
                TotalCount = total,
                Page = page,
                PageSize = pageSize
            }
        };
    }

    public async Task<ApiResponse<List<OTScheduleResponse>>> GetTodaySchedulesAsync(Guid hospitalId)
    {
        var today = DateTime.UtcNow.Date;
        var schedules = await _context.OTSchedules
            .Include(s => s.OTRoom)
            .Include(s => s.Patient)
            .Include(s => s.Surgeon)
            .Include(s => s.Anesthetist)
            .Where(s => s.HospitalId == hospitalId && s.ScheduledDate.Date == today && !s.IsDeleted)
            .OrderBy(s => s.StartTime)
            .ToListAsync();

        return new ApiResponse<List<OTScheduleResponse>> { Success = true, Data = schedules.Select(Map).ToList() };
    }

    public async Task<ApiResponse<OTScheduleResponse>> GetScheduleByIdAsync(Guid id, Guid hospitalId)
    {
        var s = await _context.OTSchedules
            .Include(s => s.OTRoom)
            .Include(s => s.Patient)
            .Include(s => s.Surgeon)
            .Include(s => s.Anesthetist)
            .FirstOrDefaultAsync(s => s.Id == id && s.HospitalId == hospitalId && !s.IsDeleted);

        if (s == null) return new ApiResponse<OTScheduleResponse> { Success = false, Message = "Schedule not found" };
        return new ApiResponse<OTScheduleResponse> { Success = true, Data = Map(s) };
    }

    public async Task<ApiResponse<OTScheduleResponse>> ScheduleOTAsync(ScheduleOTRequest req, Guid hospitalId, string user)
    {
        if (!TimeOnly.TryParse(req.StartTime, out var startTime))
            return new ApiResponse<OTScheduleResponse> { Success = false, Message = "Invalid start time format (use HH:mm)" };

        // Check room conflict
        var conflict = await _context.OTSchedules
            .AnyAsync(s =>
                s.OTRoomId == req.OTRoomId &&
                s.ScheduledDate.Date == req.ScheduledDate.Date &&
                s.Status != OperationStatus.Cancelled &&
                !s.IsDeleted &&
                s.StartTime < startTime.AddMinutes(req.DurationMinutes) &&
                startTime < s.StartTime.AddMinutes(s.DurationMinutes));

        if (conflict)
            return new ApiResponse<OTScheduleResponse> { Success = false, Message = "OT room is already booked for this time slot" };

        var schedule = new OTSchedule
        {
            HospitalId = hospitalId,
            OTRoomId = req.OTRoomId,
            PatientId = req.PatientId,
            AdmissionId = req.AdmissionId,
            SurgeonId = req.SurgeonId,
            AnesthetistId = req.AnesthetistId,
            AssistantSurgeons = req.AssistantSurgeons,
            ScrubNurses = req.ScrubNurses,
            SurgeryType = req.SurgeryType,
            Diagnosis = req.Diagnosis,
            AnesthesiaType = req.AnesthesiaType,
            Priority = req.Priority,
            ScheduledDate = req.ScheduledDate.Date,
            StartTime = startTime,
            DurationMinutes = req.DurationMinutes,
            PreOpNotes = req.PreOpNotes,
            CreatedBy = user,
        };

        _context.OTSchedules.Add(schedule);
        await _context.SaveChangesAsync();
        await _audit.LogAsync(hospitalId, "OTSchedule", schedule.Id.ToString(), AuditAction.Create,
            $"Scheduled OT: {req.SurgeryType} on {req.ScheduledDate:dd-MMM-yyyy}");

        return await GetScheduleByIdAsync(schedule.Id, hospitalId);
    }

    public async Task<ApiResponse<OTScheduleResponse>> UpdateStatusAsync(Guid id, UpdateOTStatusRequest req, Guid hospitalId, string user)
    {
        var schedule = await _context.OTSchedules.FirstOrDefaultAsync(s => s.Id == id && s.HospitalId == hospitalId && !s.IsDeleted);
        if (schedule == null) return new ApiResponse<OTScheduleResponse> { Success = false, Message = "Schedule not found" };

        schedule.Status = req.Status;
        if (!string.IsNullOrWhiteSpace(req.SurgicalNotes)) schedule.SurgicalNotes = req.SurgicalNotes;
        if (!string.IsNullOrWhiteSpace(req.PostOpNotes)) schedule.PostOpNotes = req.PostOpNotes;
        if (req.ActualStartTime.HasValue) schedule.ActualStartTime = req.ActualStartTime;
        if (req.ActualEndTime.HasValue) schedule.ActualEndTime = req.ActualEndTime;
        schedule.UpdatedAt = DateTime.UtcNow;
        schedule.UpdatedBy = user;

        await _context.SaveChangesAsync();
        await _audit.LogAsync(hospitalId, "OTSchedule", schedule.Id.ToString(), AuditAction.Update, $"Status updated to {req.Status}");

        return await GetScheduleByIdAsync(id, hospitalId);
    }

    public async Task<ApiResponse<OTScheduleResponse>> UpdateChecklistAsync(Guid id, UpdateOTChecklistRequest req, Guid hospitalId, string user)
    {
        var schedule = await _context.OTSchedules.FirstOrDefaultAsync(s => s.Id == id && s.HospitalId == hospitalId && !s.IsDeleted);
        if (schedule == null) return new ApiResponse<OTScheduleResponse> { Success = false, Message = "Schedule not found" };

        schedule.ConsentSigned = req.ConsentSigned;
        schedule.BloodGroupConfirmed = req.BloodGroupConfirmed;
        schedule.AnesthesiaAssessmentDone = req.AnesthesiaAssessmentDone;
        schedule.FastingConfirmed = req.FastingConfirmed;
        schedule.InvestigationsReviewed = req.InvestigationsReviewed;
        schedule.UpdatedAt = DateTime.UtcNow;
        schedule.UpdatedBy = user;

        await _context.SaveChangesAsync();
        return await GetScheduleByIdAsync(id, hospitalId);
    }

    public async Task<ApiResponse<bool>> CancelScheduleAsync(Guid id, Guid hospitalId, string user)
    {
        var schedule = await _context.OTSchedules.FirstOrDefaultAsync(s => s.Id == id && s.HospitalId == hospitalId && !s.IsDeleted);
        if (schedule == null) return new ApiResponse<bool> { Success = false, Message = "Schedule not found" };

        schedule.Status = OperationStatus.Cancelled;
        schedule.UpdatedAt = DateTime.UtcNow;
        schedule.UpdatedBy = user;
        await _context.SaveChangesAsync();
        await _audit.LogAsync(hospitalId, "OTSchedule", schedule.Id.ToString(), AuditAction.Update, "OT cancelled");

        return new ApiResponse<bool> { Success = true, Data = true };
    }

    private static OTScheduleResponse Map(OTSchedule s)
    {
        var checklist = (s.ConsentSigned ? 1 : 0) +
                        (s.BloodGroupConfirmed ? 1 : 0) +
                        (s.AnesthesiaAssessmentDone ? 1 : 0) +
                        (s.FastingConfirmed ? 1 : 0) +
                        (s.InvestigationsReviewed ? 1 : 0);
        return new OTScheduleResponse
        {
            Id = s.Id,
            OTRoomId = s.OTRoomId,
            OTRoomName = s.OTRoom?.Name ?? "",
            PatientId = s.PatientId,
            PatientName = s.Patient != null ? $"{s.Patient.FirstName} {s.Patient.LastName}" : "",
            UHID = s.Patient?.UHID ?? "",
            MobileNumber = s.Patient?.MobileNumber,
            AdmissionId = s.AdmissionId,
            SurgeonName = s.Surgeon?.FullName ?? "",
            AnesthetistName = s.Anesthetist?.FullName,
            AssistantSurgeons = s.AssistantSurgeons,
            ScrubNurses = s.ScrubNurses,
            SurgeryType = s.SurgeryType,
            Diagnosis = s.Diagnosis,
            AnesthesiaType = s.AnesthesiaType.ToString(),
            Priority = s.Priority.ToString(),
            ScheduledDate = s.ScheduledDate,
            StartTime = s.StartTime.ToString("HH:mm"),
            DurationMinutes = s.DurationMinutes,
            ActualStartTime = s.ActualStartTime,
            ActualEndTime = s.ActualEndTime,
            Status = s.Status.ToString(),
            ConsentSigned = s.ConsentSigned,
            BloodGroupConfirmed = s.BloodGroupConfirmed,
            AnesthesiaAssessmentDone = s.AnesthesiaAssessmentDone,
            FastingConfirmed = s.FastingConfirmed,
            InvestigationsReviewed = s.InvestigationsReviewed,
            ChecklistComplete = checklist,
            PreOpNotes = s.PreOpNotes,
            SurgicalNotes = s.SurgicalNotes,
            PostOpNotes = s.PostOpNotes,
            CreatedAt = s.CreatedAt,
        };
    }
}
