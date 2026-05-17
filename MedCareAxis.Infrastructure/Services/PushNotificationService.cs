using System.Text.Json;
using MedCareAxis.Core.DTOs.Request;
using MedCareAxis.Core.Entities;
using MedCareAxis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WebPush;

namespace MedCareAxis.Infrastructure.Services;

public interface IPushNotificationService
{
    Task SubscribeAsync(Guid patientId, Guid hospitalId, PushSubscribeRequest request);
    Task UnsubscribeAsync(Guid patientId, string endpoint);
    Task SendToPatientAsync(Guid patientId, string title, string body, string? url = null);
    Task SendToAllAsync(Guid hospitalId, string title, string body);
}

public class PushNotificationService : IPushNotificationService
{
    private readonly AppDbContext _context;
    private readonly WebPushClient _client;
    private readonly string _publicKey;
    private readonly string _privateKey;
    private readonly string _subject;

    public PushNotificationService(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _publicKey  = config["VapidKeys:PublicKey"]!;
        _privateKey = config["VapidKeys:PrivateKey"]!;
        _subject    = config["VapidKeys:Subject"]!;
        _client = new WebPushClient();
    }

    public async Task SubscribeAsync(Guid patientId, Guid hospitalId, PushSubscribeRequest request)
    {
        var existing = await _context.PatientPushSubscriptions
            .FirstOrDefaultAsync(s => s.PatientId == patientId && s.Endpoint == request.Endpoint);

        if (existing != null)
        {
            existing.P256dh = request.P256dh;
            existing.Auth   = request.Auth;
        }
        else
        {
            _context.PatientPushSubscriptions.Add(new PatientPushSubscription
            {
                PatientId  = patientId,
                HospitalId = hospitalId,
                Endpoint   = request.Endpoint,
                P256dh     = request.P256dh,
                Auth       = request.Auth,
            });
        }

        await _context.SaveChangesAsync();
    }

    public async Task UnsubscribeAsync(Guid patientId, string endpoint)
    {
        var sub = await _context.PatientPushSubscriptions
            .FirstOrDefaultAsync(s => s.PatientId == patientId && s.Endpoint == endpoint);
        if (sub != null)
        {
            _context.PatientPushSubscriptions.Remove(sub);
            await _context.SaveChangesAsync();
        }
    }

    public async Task SendToPatientAsync(Guid patientId, string title, string body, string? url = null)
    {
        var subs = await _context.PatientPushSubscriptions
            .Where(s => s.PatientId == patientId)
            .ToListAsync();

        await SendToSubscriptionsAsync(subs, title, body, url);
    }

    public async Task SendToAllAsync(Guid hospitalId, string title, string body)
    {
        var subs = await _context.PatientPushSubscriptions
            .Where(s => s.HospitalId == hospitalId)
            .ToListAsync();

        await SendToSubscriptionsAsync(subs, title, body, null);
    }

    private async Task SendToSubscriptionsAsync(
        IEnumerable<PatientPushSubscription> subs, string title, string body, string? url)
    {
        var payload = JsonSerializer.Serialize(new { title, body, url });
        var vapid   = new VapidDetails(_subject, _publicKey, _privateKey);
        var dead    = new List<PatientPushSubscription>();

        foreach (var sub in subs)
        {
            try
            {
                var pushSub = new PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);
                await _client.SendNotificationAsync(pushSub, payload, vapid);
            }
            catch (WebPushException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Gone
                                            || ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                dead.Add(sub);
            }
            catch { /* network error – keep subscription, retry next time */ }
        }

        if (dead.Any())
        {
            _context.PatientPushSubscriptions.RemoveRange(dead);
            await _context.SaveChangesAsync();
        }
    }
}
