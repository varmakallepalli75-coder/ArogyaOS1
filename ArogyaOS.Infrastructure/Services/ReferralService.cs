using System.Text.Json;
using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Core.DTOs.Response;
using ArogyaOS.Core.Entities;
using ArogyaOS.Core.Enums;
using ArogyaOS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArogyaOS.Infrastructure.Services;

public interface IReferralService
{
    Task<ApiResponse<ReferralListResponse>> SendAsync(CreateReferralRequest request, Guid fromHospitalId);
    Task<ApiResponse<PagedResponse<ReferralListResponse>>> GetInboxAsync(Guid hospitalId, string? status, int page, int pageSize);
    Task<ApiResponse<PagedResponse<ReferralListResponse>>> GetSentAsync(Guid hospitalId, string? status, int page, int pageSize);
    Task<ApiResponse<ReferralDetailResponse>> GetByIdAsync(Guid id, Guid hospitalId);
    Task<ApiResponse<ReferralDetailResponse>> AcceptAsync(Guid id, AcceptReferralRequest request, Guid hospitalId);
    Task<ApiResponse<ReferralDetailResponse>> DeclineAsync(Guid id, DeclineReferralRequest request, Guid hospitalId);
    Task<ApiResponse<ReferralDetailResponse>> CompleteAsync(Guid id, CompleteReferralRequest request, Guid hospitalId);
    Task<ApiResponse<bool>> CancelAsync(Guid id, Guid fromHospitalId);
    Task<ApiResponse<List<HospitalPickerResponse>>> GetHospitalsAsync(Guid excludeHospitalId);
    Task<ApiResponse<int>> GetInboxCountAsync(Guid hospitalId);
}

public class ReferralService : IReferralService
{
    private readonly AppDbContext _context;
    private readonly IAuditService _audit;

    public ReferralService(AppDbContext context, IAuditService audit)
    {
        _context = context;
        _audit = audit;
    }

    public async Task<ApiResponse<ReferralListResponse>> SendAsync(
        CreateReferralRequest request, Guid fromHospitalId)
    {
        if (request.ToHospitalId == fromHospitalId)
            return ApiResponse<ReferralListResponse>.Fail("Cannot refer to your own hospital.");

        if (!request.PatientConsent)
            return ApiResponse<ReferralListResponse>.Fail("Patient consent is required for referral.");

        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.Id == request.PatientId && p.HospitalId == fromHospitalId);
        if (patient == null)
            return ApiResponse<ReferralListResponse>.Fail("Patient not found.");

        var toHospital = await _context.Hospitals.FindAsync(request.ToHospitalId);
        if (toHospital == null)
            return ApiResponse<ReferralListResponse>.Fail("Target hospital not found.");

        var fromHospital = await _context.Hospitals.FindAsync(fromHospitalId);

        // Build patient snapshot (only what's needed + consented to share)
        var snapshot = new
        {
            firstName = patient.FirstName,
            middleName = patient.MiddleName,
            lastName = patient.LastName,
            dateOfBirth = patient.DateOfBirth,
            gender = patient.Gender.ToString(),
            bloodGroup = patient.BloodGroup.ToString(),
            mobileNumber = patient.MobileNumber,
            email = patient.Email,
            address = patient.Address,
            city = patient.City,
            state = patient.State,
            pinCode = patient.PinCode,
            knownAllergies = patient.KnownAllergies,
            chronicConditions = patient.ChronicConditions,
            insuranceType = patient.InsuranceType.ToString(),
            abhaId = patient.ABHAId,
            ayushmanCardNumber = patient.AyushmanCardNumber
        };

        var referral = new PatientReferral
        {
            FromHospitalId      = fromHospitalId,
            ToHospitalId        = request.ToHospitalId,
            PatientId           = request.PatientId,
            ReferringDoctorName = request.ReferringDoctorName,
            ReceivingDoctorName = request.ReceivingDoctorName,
            Urgency             = (ReferralUrgency)request.Urgency,
            Reason              = request.Reason,
            ClinicalNotes       = request.ClinicalNotes,
            PatientConsent      = request.PatientConsent,
            PatientSnapshot     = JsonSerializer.Serialize(snapshot),
            AttachedReports     = request.AttachedReports != null
                                    ? JsonSerializer.Serialize(request.AttachedReports)
                                    : null,
            Status              = ReferralStatus.Sent,
            ReferredAt          = DateTime.UtcNow
        };

        _context.PatientReferrals.Add(referral);
        await _context.SaveChangesAsync();

        await _audit.LogAsync(fromHospitalId, "Referral", referral.Id.ToString(), AuditAction.Create,
            $"Referred patient {patient.FullName} to {toHospital.Name} — {referral.Urgency}");

        return ApiResponse<ReferralListResponse>.Ok(
            MapList(referral, fromHospital!.Name, toHospital.Name, patient),
            "Referral sent successfully.");
    }

    public async Task<ApiResponse<PagedResponse<ReferralListResponse>>> GetInboxAsync(
        Guid hospitalId, string? status, int page, int pageSize)
    {
        var query = _context.PatientReferrals
            .Include(r => r.FromHospital)
            .Include(r => r.ToHospital)
            .Include(r => r.Patient)
            .Where(r => r.ToHospitalId == hospitalId);

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<ReferralStatus>(status, true, out var s))
            query = query.Where(r => r.Status == s);

        query = query.OrderByDescending(r => r.ReferredAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();

        // Mark Sent → Viewed when inbox is fetched
        foreach (var r in items.Where(r => r.Status == ReferralStatus.Sent))
            r.Status = ReferralStatus.Viewed;
        await _context.SaveChangesAsync();

        return ApiResponse<PagedResponse<ReferralListResponse>>.Ok(new PagedResponse<ReferralListResponse>
        {
            Items      = items.Select(r => MapList(r, r.FromHospital.Name, r.ToHospital.Name, r.Patient)).ToList(),
            Page       = page,
            PageSize   = pageSize,
            TotalCount = total
        });
    }

    public async Task<ApiResponse<PagedResponse<ReferralListResponse>>> GetSentAsync(
        Guid hospitalId, string? status, int page, int pageSize)
    {
        var query = _context.PatientReferrals
            .Include(r => r.FromHospital)
            .Include(r => r.ToHospital)
            .Include(r => r.Patient)
            .Where(r => r.FromHospitalId == hospitalId);

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<ReferralStatus>(status, true, out var s))
            query = query.Where(r => r.Status == s);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.ReferredAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();

        return ApiResponse<PagedResponse<ReferralListResponse>>.Ok(new PagedResponse<ReferralListResponse>
        {
            Items      = items.Select(r => MapList(r, r.FromHospital.Name, r.ToHospital.Name, r.Patient)).ToList(),
            Page       = page,
            PageSize   = pageSize,
            TotalCount = total
        });
    }

    public async Task<ApiResponse<ReferralDetailResponse>> GetByIdAsync(Guid id, Guid hospitalId)
    {
        var r = await _context.PatientReferrals
            .Include(x => x.FromHospital)
            .Include(x => x.ToHospital)
            .Include(x => x.Patient)
            .FirstOrDefaultAsync(x => x.Id == id &&
                (x.FromHospitalId == hospitalId || x.ToHospitalId == hospitalId));

        if (r == null)
            return ApiResponse<ReferralDetailResponse>.Fail("Referral not found.");

        return ApiResponse<ReferralDetailResponse>.Ok(MapDetail(r));
    }

    public async Task<ApiResponse<ReferralDetailResponse>> AcceptAsync(
        Guid id, AcceptReferralRequest request, Guid hospitalId)
    {
        var referral = await _context.PatientReferrals
            .Include(r => r.FromHospital)
            .Include(r => r.ToHospital)
            .Include(r => r.Patient)
            .FirstOrDefaultAsync(r => r.Id == id && r.ToHospitalId == hospitalId);

        if (referral == null)
            return ApiResponse<ReferralDetailResponse>.Fail("Referral not found.");

        if (referral.Status == ReferralStatus.Accepted)
            return ApiResponse<ReferralDetailResponse>.Fail("Referral already accepted.");

        if (referral.Status == ReferralStatus.Declined || referral.Status == ReferralStatus.Cancelled)
            return ApiResponse<ReferralDetailResponse>.Fail("Cannot accept a declined or cancelled referral.");

        Guid receivedPatientId;

        if (request.ExistingPatientId.HasValue)
        {
            // Link to an existing patient at this hospital
            var existing = await _context.Patients
                .FirstOrDefaultAsync(p => p.Id == request.ExistingPatientId && p.HospitalId == hospitalId);
            if (existing == null)
                return ApiResponse<ReferralDetailResponse>.Fail("Existing patient not found at your hospital.");
            receivedPatientId = existing.Id;
        }
        else
        {
            // Create new patient from snapshot
            var snap = JsonSerializer.Deserialize<JsonElement>(referral.PatientSnapshot);
            var count = await _context.Patients.Where(p => p.HospitalId == hospitalId).CountAsync();
            var uhid  = $"ARG-{DateTime.UtcNow.Year}-{(count + 1):D5}";

            var newPatient = new Patient
            {
                HospitalId  = hospitalId,
                UHID        = uhid,
                FirstName   = GetString(snap, "firstName"),
                MiddleName  = GetString(snap, "middleName"),
                LastName    = GetString(snap, "lastName"),
                DateOfBirth = GetDateTime(snap, "dateOfBirth"),
                Gender      = Enum.TryParse<Gender>(GetString(snap, "gender"), out var g) ? g : Gender.Other,
                BloodGroup  = Enum.TryParse<BloodGroup>(GetString(snap, "bloodGroup"), out var bg) ? bg : BloodGroup.Unknown,
                MobileNumber = GetString(snap, "mobileNumber"),
                Email       = GetString(snap, "email"),
                Address     = GetString(snap, "address"),
                City        = GetString(snap, "city"),
                State       = GetString(snap, "state"),
                PinCode     = GetString(snap, "pinCode"),
                KnownAllergies    = GetString(snap, "knownAllergies"),
                ChronicConditions = GetString(snap, "chronicConditions"),
                ABHAId            = GetString(snap, "abhaId"),
                AyushmanCardNumber = GetString(snap, "ayushmanCardNumber"),
            };

            _context.Patients.Add(newPatient);
            await _context.SaveChangesAsync();
            receivedPatientId = newPatient.Id;
        }

        referral.Status            = ReferralStatus.Accepted;
        referral.ReceivedPatientId = receivedPatientId;
        referral.AcceptedAt        = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _audit.LogAsync(hospitalId, "Referral", referral.Id.ToString(), AuditAction.Update,
            $"Accepted referral from {referral.FromHospital.Name} for patient {referral.Patient.FullName}");

        return ApiResponse<ReferralDetailResponse>.Ok(MapDetail(referral), "Referral accepted. Patient registered.");
    }

    public async Task<ApiResponse<ReferralDetailResponse>> DeclineAsync(
        Guid id, DeclineReferralRequest request, Guid hospitalId)
    {
        var referral = await LoadForReceiver(id, hospitalId);
        if (referral == null)
            return ApiResponse<ReferralDetailResponse>.Fail("Referral not found.");

        if (referral.Status is ReferralStatus.Accepted or ReferralStatus.Completed or ReferralStatus.Cancelled)
            return ApiResponse<ReferralDetailResponse>.Fail($"Cannot decline a {referral.Status} referral.");

        referral.Status        = ReferralStatus.Declined;
        referral.DeclineReason = request.Reason;

        await _context.SaveChangesAsync();

        await _audit.LogAsync(hospitalId, "Referral", referral.Id.ToString(), AuditAction.Update,
            $"Declined referral from {referral.FromHospital.Name}: {request.Reason}");

        return ApiResponse<ReferralDetailResponse>.Ok(MapDetail(referral), "Referral declined.");
    }

    public async Task<ApiResponse<ReferralDetailResponse>> CompleteAsync(
        Guid id, CompleteReferralRequest request, Guid hospitalId)
    {
        var referral = await LoadForReceiver(id, hospitalId);
        if (referral == null)
            return ApiResponse<ReferralDetailResponse>.Fail("Referral not found.");

        if (referral.Status != ReferralStatus.Accepted)
            return ApiResponse<ReferralDetailResponse>.Fail("Can only complete an accepted referral.");

        referral.Status       = ReferralStatus.Completed;
        referral.OutcomeNotes = request.OutcomeNotes;
        referral.CompletedAt  = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _audit.LogAsync(hospitalId, "Referral", referral.Id.ToString(), AuditAction.Update,
            $"Completed referral for patient {referral.Patient.FullName}");

        return ApiResponse<ReferralDetailResponse>.Ok(MapDetail(referral), "Referral marked as completed.");
    }

    public async Task<ApiResponse<bool>> CancelAsync(Guid id, Guid fromHospitalId)
    {
        var referral = await _context.PatientReferrals
            .FirstOrDefaultAsync(r => r.Id == id && r.FromHospitalId == fromHospitalId);

        if (referral == null)
            return ApiResponse<bool>.Fail("Referral not found.");

        if (referral.Status is ReferralStatus.Accepted or ReferralStatus.Completed)
            return ApiResponse<bool>.Fail("Cannot cancel an accepted or completed referral.");

        referral.Status = ReferralStatus.Cancelled;
        await _context.SaveChangesAsync();

        await _audit.LogAsync(fromHospitalId, "Referral", referral.Id.ToString(), AuditAction.Update,
            "Referral cancelled by referring hospital");

        return ApiResponse<bool>.Ok(true, "Referral cancelled.");
    }

    public async Task<ApiResponse<List<HospitalPickerResponse>>> GetHospitalsAsync(Guid excludeHospitalId)
    {
        var hospitals = await _context.Hospitals
            .Where(h => h.Id != excludeHospitalId && h.Status == HospitalStatus.Active)
            .OrderBy(h => h.Name)
            .Select(h => new HospitalPickerResponse
            {
                Id           = h.Id,
                Name         = h.Name,
                HospitalCode = h.HospitalCode,
                City         = h.City ?? "",
                State        = h.State ?? ""
            })
            .ToListAsync();

        return ApiResponse<List<HospitalPickerResponse>>.Ok(hospitals);
    }

    public async Task<ApiResponse<int>> GetInboxCountAsync(Guid hospitalId)
    {
        var count = await _context.PatientReferrals
            .CountAsync(r => r.ToHospitalId == hospitalId &&
                             (r.Status == ReferralStatus.Sent || r.Status == ReferralStatus.Viewed));

        return ApiResponse<int>.Ok(count);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    private async Task<PatientReferral?> LoadForReceiver(Guid id, Guid hospitalId) =>
        await _context.PatientReferrals
            .Include(r => r.FromHospital)
            .Include(r => r.ToHospital)
            .Include(r => r.Patient)
            .FirstOrDefaultAsync(r => r.Id == id && r.ToHospitalId == hospitalId);

    private static string GetString(JsonElement el, string key) =>
        el.TryGetProperty(key, out var v) && v.ValueKind != JsonValueKind.Null
            ? v.GetString() ?? ""
            : "";

    private static DateTime GetDateTime(JsonElement el, string key) =>
        el.TryGetProperty(key, out var v) && v.TryGetDateTime(out var dt) ? dt : DateTime.UtcNow.AddYears(-30);

    private static ReferralListResponse MapList(PatientReferral r, string fromName, string toName, Patient p) => new()
    {
        Id                  = r.Id,
        FromHospitalId      = r.FromHospitalId,
        FromHospitalName    = fromName,
        ToHospitalId        = r.ToHospitalId,
        ToHospitalName      = toName,
        PatientId           = r.PatientId,
        PatientName         = p.FullName,
        PatientUHID         = p.UHID,
        PatientAge          = $"{p.Age} yrs",
        PatientGender       = p.Gender.ToString(),
        PatientBloodGroup   = p.BloodGroup.ToString(),
        PatientMobile       = p.MobileNumber,
        ReferringDoctorName = r.ReferringDoctorName,
        ReceivingDoctorName = r.ReceivingDoctorName,
        Status              = r.Status.ToString(),
        Urgency             = r.Urgency.ToString(),
        Reason              = r.Reason,
        ReceivedPatientId   = r.ReceivedPatientId,
        ReferredAt          = r.ReferredAt,
        AcceptedAt          = r.AcceptedAt,
        CompletedAt         = r.CompletedAt
    };

    private static ReferralDetailResponse MapDetail(PatientReferral r) => new()
    {
        Id                  = r.Id,
        FromHospitalId      = r.FromHospitalId,
        FromHospitalName    = r.FromHospital.Name,
        ToHospitalId        = r.ToHospitalId,
        ToHospitalName      = r.ToHospital.Name,
        PatientId           = r.PatientId,
        PatientName         = r.Patient.FullName,
        PatientUHID         = r.Patient.UHID,
        PatientAge          = $"{r.Patient.Age} yrs",
        PatientGender       = r.Patient.Gender.ToString(),
        PatientBloodGroup   = r.Patient.BloodGroup.ToString(),
        PatientMobile       = r.Patient.MobileNumber,
        ReferringDoctorName = r.ReferringDoctorName,
        ReceivingDoctorName = r.ReceivingDoctorName,
        Status              = r.Status.ToString(),
        Urgency             = r.Urgency.ToString(),
        Reason              = r.Reason,
        ClinicalNotes       = r.ClinicalNotes,
        DeclineReason       = r.DeclineReason,
        OutcomeNotes        = r.OutcomeNotes,
        PatientConsent      = r.PatientConsent,
        AttachedReports     = r.AttachedReports,
        PatientSnapshot     = r.PatientSnapshot,
        ReceivedPatientId   = r.ReceivedPatientId,
        ReferredAt          = r.ReferredAt,
        AcceptedAt          = r.AcceptedAt,
        CompletedAt         = r.CompletedAt
    };
}
