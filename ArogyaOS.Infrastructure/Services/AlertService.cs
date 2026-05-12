using ArogyaOS.Core.DTOs.Response;
using ArogyaOS.Core.Enums;
using ArogyaOS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArogyaOS.Infrastructure.Services;

public class AlertItem
{
    public string Type { get; set; } = string.Empty;     // low_stock | pending_lab | unpaid_bills | pending_rx | todays_appointments
    public string Severity { get; set; } = "info";       // info | warning | error
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int Count { get; set; }
}

public interface IAlertService
{
    Task<ApiResponse<List<AlertItem>>> GetAlertsAsync(Guid hospitalId);
}

public class AlertService : IAlertService
{
    private readonly AppDbContext _context;

    public AlertService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<AlertItem>>> GetAlertsAsync(Guid hospitalId)
    {
        var alerts = new List<AlertItem>();
        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);

        // ─── Low stock medicines ───────────────────────
        var lowStock = await _context.Medicines
            .Where(m => m.HospitalId == hospitalId
                && m.IsActive
                && m.CurrentStock <= m.MinimumStock)
            .CountAsync();

        if (lowStock > 0)
            alerts.Add(new AlertItem
            {
                Type     = "low_stock",
                Severity = lowStock >= 5 ? "error" : "warning",
                Title    = "Low Medicine Stock",
                Message  = $"{lowStock} medicine{(lowStock > 1 ? "s are" : " is")} running low",
                Count    = lowStock
            });

        // ─── Pending lab results ───────────────────────
        var pendingLab = await _context.LabOrders
            .Where(l => l.HospitalId == hospitalId
                && (l.Status == LabOrderStatus.Ordered
                    || l.Status == LabOrderStatus.SampleCollected
                    || l.Status == LabOrderStatus.InProcess))
            .CountAsync();

        if (pendingLab > 0)
            alerts.Add(new AlertItem
            {
                Type     = "pending_lab",
                Severity = "warning",
                Title    = "Pending Lab Results",
                Message  = $"{pendingLab} lab order{(pendingLab > 1 ? "s" : "")} awaiting results",
                Count    = pendingLab
            });

        // ─── Pending prescriptions (not dispensed) ────
        var pendingRx = await _context.Prescriptions
            .Where(p => p.HospitalId == hospitalId
                && !p.IsDispensed
                && p.PrescribedOn >= today)
            .CountAsync();

        if (pendingRx > 0)
            alerts.Add(new AlertItem
            {
                Type     = "pending_rx",
                Severity = "info",
                Title    = "Prescriptions to Dispense",
                Message  = $"{pendingRx} prescription{(pendingRx > 1 ? "s" : "")} waiting at pharmacy",
                Count    = pendingRx
            });

        // ─── Unpaid bills ──────────────────────────────
        var unpaidBills = await _context.Bills
            .Where(b => b.HospitalId == hospitalId
                && (b.Status == BillStatus.Generated || b.Status == BillStatus.PartiallyPaid))
            .CountAsync();

        if (unpaidBills > 0)
            alerts.Add(new AlertItem
            {
                Type     = "unpaid_bills",
                Severity = "info",
                Title    = "Outstanding Bills",
                Message  = $"{unpaidBills} bill{(unpaidBills > 1 ? "s" : "")} with pending payment",
                Count    = unpaidBills
            });

        // ─── Today's scheduled appointments ───────────
        var todayApts = await _context.Appointments
            .Where(a => a.HospitalId == hospitalId
                && a.AppointmentDateTime >= today
                && a.AppointmentDateTime < tomorrow
                && (a.Status == AppointmentStatus.Scheduled || a.Status == AppointmentStatus.Confirmed))
            .CountAsync();

        if (todayApts > 0)
            alerts.Add(new AlertItem
            {
                Type     = "todays_appointments",
                Severity = "info",
                Title    = "Today's Appointments",
                Message  = $"{todayApts} appointment{(todayApts > 1 ? "s" : "")} scheduled for today",
                Count    = todayApts
            });

        return ApiResponse<List<AlertItem>>.Ok(alerts);
    }
}
