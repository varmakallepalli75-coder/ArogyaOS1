using ArogyaOS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArogyaOS.Infrastructure.Services;

// Medicine times derived from frequency pattern (morning-afternoon-night)
// e.g. "1-0-1" → 08:00 and 21:00
// e.g. "1-1-1" → 08:00, 14:00, 21:00
// e.g. "0-0-1" → 21:00 only
public class MedicineReminderJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MedicineReminderJob> _logger;

    private static readonly TimeSpan[] SlotTimes = new[]
    {
        new TimeSpan(8, 0, 0),   // Morning
        new TimeSpan(14, 0, 0),  // Afternoon
        new TimeSpan(21, 0, 0),  // Night
    };

    public MedicineReminderJob(IServiceScopeFactory scopeFactory, ILogger<MedicineReminderJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await CheckAndSendRemindersAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Medicine reminder job error");
            }

            // Run every 5 minutes
            await Task.Delay(TimeSpan.FromMinutes(5), ct);
        }
    }

    private async Task CheckAndSendRemindersAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var pushService = scope.ServiceProvider.GetRequiredService<IPushNotificationService>();

        var now = DateTime.UtcNow.TimeOfDay;

        // Find which slot(s) are within ±5 minutes of now
        var dueSlots = SlotTimes
            .Select((t, i) => (slot: i, time: t))
            .Where(x => Math.Abs((now - x.time).TotalMinutes) <= 5)
            .ToList();

        if (!dueSlots.Any()) return;

        // Load active prescriptions that are recent (issued in last 30 days)
        var cutoff = DateTime.UtcNow.AddDays(-30);
        var prescriptions = await context.Prescriptions
            .Include(p => p.Patient)
            .Include(p => p.Items)
            .Where(p => p.PrescribedOn >= cutoff && !p.IsDispensed)
            .ToListAsync(ct);

        foreach (var rx in prescriptions)
        {
            var patientId = rx.PatientId;

            // Check if this patient has any push subscription
            var hasSub = await context.PatientPushSubscriptions
                .AnyAsync(s => s.PatientId == patientId, ct);
            if (!hasSub) continue;

            var dueNow = new List<string>();

            foreach (var item in rx.Items)
            {
                var slots = ParseFrequency(item.Frequency);
                foreach (var due in dueSlots)
                {
                    if (due.slot < slots.Length && slots[due.slot])
                    {
                        var slotLabel = due.slot == 0 ? "Morning" : due.slot == 1 ? "Afternoon" : "Night";
                        var instructions = string.IsNullOrEmpty(item.Instructions) ? "" : $" ({item.Instructions})";
                        dueNow.Add($"{item.MedicineName} {item.Dosage}{instructions}");
                    }
                }
            }

            if (!dueNow.Any()) continue;

            var title = "Medicine Reminder";
            var body  = dueNow.Count == 1
                ? $"Time to take {dueNow[0]}"
                : $"Time to take your medicines:\n{string.Join("\n", dueNow.Select(m => $"• {m}"))}";

            await pushService.SendToPatientAsync(patientId, title, body, "/my-prescriptions");
            _logger.LogInformation("Sent medicine reminder to patient {PatientId} for {Count} medicine(s)", patientId, dueNow.Count);
        }
    }

    // Parses "1-0-1" → [true, false, true] (morning, afternoon, night)
    private static bool[] ParseFrequency(string frequency)
    {
        if (string.IsNullOrWhiteSpace(frequency))
            return new[] { false, false, false };

        var parts = frequency.Split('-');
        var result = new bool[3];

        for (int i = 0; i < 3 && i < parts.Length; i++)
        {
            result[i] = parts[i].Trim() is "1" or "yes" or "true";
        }

        return result;
    }
}
