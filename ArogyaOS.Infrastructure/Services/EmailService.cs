using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace ArogyaOS.Infrastructure.Services;

public interface IEmailService
{
    Task SendWelcomeEmailAsync(string toEmail, string adminName, string hospitalName,
        string hospitalCode, string password);
    Task SendAppointmentConfirmationAsync(string toEmail, string patientName,
        string doctorName, string department, DateTime appointmentTime, string hospitalName, string tokenNumber);
    Task SendSubscriptionExpiryWarningAsync(string toEmail, string hospitalName, DateTime expiryDate);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config) => _config = config;

    private SmtpSettings Settings => new()
    {
        Host     = _config["Email:Host"]     ?? "smtp.gmail.com",
        Port     = int.Parse(_config["Email:Port"] ?? "587"),
        Username = _config["Email:Username"] ?? "",
        Password = _config["Email:Password"] ?? "",
        From     = _config["Email:From"]     ?? "noreply@arogyaos.com",
        FromName = _config["Email:FromName"] ?? "ArogyaOS"
    };

    public async Task SendWelcomeEmailAsync(string toEmail, string adminName,
        string hospitalName, string hospitalCode, string password)
    {
        var html = $"""
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#1e293b;padding:24px;border-radius:12px 12px 0 0">
                <h1 style="color:#10b981;margin:0">🏥 ArogyaOS</h1>
                <p style="color:#94a3b8;margin:4px 0 0">Hospital Management System</p>
              </div>
              <div style="background:#fff;padding:32px;border:1px solid #e2e8f0">
                <h2 style="color:#1e293b">Welcome to ArogyaOS, {adminName}!</h2>
                <p style="color:#475569">Your hospital has been successfully onboarded. Here are your login credentials:</p>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
                  <table style="width:100%;border-collapse:collapse">
                    <tr><td style="padding:6px 0;color:#64748b;width:140px">Hospital</td><td style="padding:6px 0;font-weight:600;color:#1e293b">{hospitalName}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b">Hospital Code</td><td style="padding:6px 0;font-weight:700;color:#10b981;font-family:monospace">{hospitalCode}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b">Login Email</td><td style="padding:6px 0;font-weight:600;color:#1e293b">{toEmail}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b">Password</td><td style="padding:6px 0;font-weight:600;color:#1e293b;font-family:monospace">{password}</td></tr>
                  </table>
                </div>
                <p style="color:#ef4444;font-size:14px">⚠️ Please change your password after first login.</p>
                <p style="color:#475569">Your subscription trial starts now and is valid for 30 days.</p>
              </div>
              <div style="background:#f8fafc;padding:16px;border-radius:0 0 12px 12px;text-align:center">
                <p style="color:#94a3b8;font-size:12px;margin:0">© 2024 ArogyaOS · All rights reserved</p>
              </div>
            </div>
            """;

        await SendAsync(toEmail, $"Welcome to ArogyaOS — {hospitalName}", html);
    }

    public async Task SendAppointmentConfirmationAsync(string toEmail, string patientName,
        string doctorName, string department, DateTime appointmentTime, string hospitalName, string tokenNumber)
    {
        var html = $"""
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#1e293b;padding:24px;border-radius:12px 12px 0 0">
                <h1 style="color:#10b981;margin:0">🏥 ArogyaOS</h1>
              </div>
              <div style="background:#fff;padding:32px;border:1px solid #e2e8f0">
                <h2 style="color:#1e293b">✅ Appointment Confirmed</h2>
                <p style="color:#475569">Dear <strong>{patientName}</strong>, your appointment has been confirmed.</p>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0">
                  <table style="width:100%;border-collapse:collapse">
                    <tr><td style="padding:6px 0;color:#64748b;width:140px">Token No.</td><td style="padding:6px 0;font-weight:700;color:#10b981;font-family:monospace;font-size:20px">#{tokenNumber}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b">Doctor</td><td style="padding:6px 0;font-weight:600;color:#1e293b">Dr. {doctorName}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b">Department</td><td style="padding:6px 0;color:#1e293b">{department}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b">Date & Time</td><td style="padding:6px 0;font-weight:600;color:#1e293b">{appointmentTime:dddd, dd MMM yyyy 'at' hh:mm tt}</td></tr>
                    <tr><td style="padding:6px 0;color:#64748b">Hospital</td><td style="padding:6px 0;color:#1e293b">{hospitalName}</td></tr>
                  </table>
                </div>
                <p style="color:#475569;font-size:14px">Please arrive 15 minutes before your scheduled time.</p>
              </div>
              <div style="background:#f8fafc;padding:16px;border-radius:0 0 12px 12px;text-align:center">
                <p style="color:#94a3b8;font-size:12px;margin:0">© 2024 ArogyaOS · All rights reserved</p>
              </div>
            </div>
            """;

        await SendAsync(toEmail, $"Appointment Confirmed — Token #{tokenNumber}", html);
    }

    public async Task SendSubscriptionExpiryWarningAsync(string toEmail, string hospitalName, DateTime expiryDate)
    {
        var daysLeft = (expiryDate.Date - DateTime.UtcNow.Date).Days;
        var html = $"""
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#1e293b;padding:24px;border-radius:12px 12px 0 0">
                <h1 style="color:#10b981;margin:0">🏥 ArogyaOS</h1>
              </div>
              <div style="background:#fff;padding:32px;border:1px solid #e2e8f0">
                <h2 style="color:#ef4444">⚠️ Subscription Expiring Soon</h2>
                <p style="color:#475569">Dear Admin of <strong>{hospitalName}</strong>,</p>
                <p style="color:#475569">Your ArogyaOS subscription expires in <strong style="color:#ef4444">{daysLeft} day{(daysLeft != 1 ? "s" : "")}</strong> on <strong>{expiryDate:dd MMM yyyy}</strong>.</p>
                <p style="color:#475569">Please renew to avoid service interruption. Contact us at <a href="mailto:support@arogyaos.com">support@arogyaos.com</a>.</p>
              </div>
              <div style="background:#f8fafc;padding:16px;border-radius:0 0 12px 12px;text-align:center">
                <p style="color:#94a3b8;font-size:12px;margin:0">© 2024 ArogyaOS · All rights reserved</p>
              </div>
            </div>
            """;

        await SendAsync(toEmail, $"⚠️ Subscription expiring in {daysLeft} days — {hospitalName}", html);
    }

    private async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        var s = Settings;
        if (string.IsNullOrEmpty(s.Username)) return; // Email not configured — skip silently

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(s.FromName, s.From));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        using var client = new SmtpClient();
        await client.ConnectAsync(s.Host, s.Port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(s.Username, s.Password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    private record SmtpSettings
    {
        public string Host { get; init; } = "";
        public int Port { get; init; } = 587;
        public string Username { get; init; } = "";
        public string Password { get; init; } = "";
        public string From { get; init; } = "";
        public string FromName { get; init; } = "";
    }
}
