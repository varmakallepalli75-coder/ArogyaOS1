using System.Security.Cryptography;
using System.Text;
using MedCareAxis.Core.DTOs.Response;
using MedCareAxis.Core.Entities;
using MedCareAxis.Core.Enums;
using MedCareAxis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace MedCareAxis.Infrastructure.Services;

public interface IOtpService
{
    Task<ApiResponse<bool>> RequestOtpAsync(OtpPurpose purpose, string identifier);
    Task<ApiResponse<bool>> VerifyOtpAsync(OtpPurpose purpose, string identifier, string code);
}

public class OtpService : IOtpService
{
    private const int ExpiryMinutes = 5;
    private const int MaxAttempts = 5;
    private const int ResendCooldownSeconds = 60;
    private const int MaxRequestsPerHour = 5;

    private readonly AppDbContext _context;
    private readonly ISmsService _sms;
    private readonly IEmailService _email;
    private readonly IConfiguration _config;

    public OtpService(AppDbContext context, ISmsService sms, IEmailService email, IConfiguration config)
    {
        _context = context;
        _sms = sms;
        _email = email;
        _config = config;
    }

    public async Task<ApiResponse<bool>> RequestOtpAsync(OtpPurpose purpose, string identifier)
    {
        var normalized = Normalize(purpose, identifier);
        var since = DateTime.UtcNow.AddHours(-1);

        var recent = await _context.OtpCodes
            .Where(o => o.Purpose == purpose && o.Identifier == normalized && o.CreatedAt > since)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        if (recent.Count > 0 && recent[0].CreatedAt > DateTime.UtcNow.AddSeconds(-ResendCooldownSeconds))
            return ApiResponse<bool>.Fail("Please wait before requesting another code.");

        if (recent.Count >= MaxRequestsPerHour)
            return ApiResponse<bool>.Fail("Too many requests. Please try again later.");

        // Invalidate any prior outstanding codes for this purpose+identifier.
        foreach (var old in recent.Where(o => !o.Consumed))
            old.Consumed = true;

        var code = GenerateCode();
        _context.OtpCodes.Add(new OtpCode
        {
            Purpose = purpose,
            Identifier = normalized,
            CodeHash = Hash(code),
            ExpiresAt = DateTime.UtcNow.AddMinutes(ExpiryMinutes)
        });
        await _context.SaveChangesAsync();

        await DispatchAsync(purpose, normalized, code);

        return ApiResponse<bool>.Ok(true, "Verification code sent.");
    }

    public async Task<ApiResponse<bool>> VerifyOtpAsync(OtpPurpose purpose, string identifier, string code)
    {
        var normalized = Normalize(purpose, identifier);

        var otp = await _context.OtpCodes
            .Where(o => o.Purpose == purpose && o.Identifier == normalized
                     && !o.Consumed && o.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();

        if (otp == null)
            return ApiResponse<bool>.Fail("Invalid or expired code.");

        if (otp.Attempts >= MaxAttempts)
            return ApiResponse<bool>.Fail("Too many failed attempts. Please request a new code.");

        if (otp.CodeHash != Hash(code))
        {
            otp.Attempts++;
            await _context.SaveChangesAsync();
            return ApiResponse<bool>.Fail("Invalid or expired code.");
        }

        otp.Consumed = true;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.Ok(true, "Code verified.");
    }

    private async Task DispatchAsync(OtpPurpose purpose, string identifier, string code)
    {
        switch (purpose)
        {
            case OtpPurpose.PatientLogin:
                await _sms.SendOtpAsync(identifier, code);
                break;
            case OtpPurpose.StaffPasswordReset:
                await _email.SendOtpEmailAsync(identifier, code, "reset your password");
                break;
            case OtpPurpose.HospitalRegistration:
                await _email.SendOtpEmailAsync(identifier, code, "verify your email");
                break;
        }
    }

    private static string Normalize(OtpPurpose purpose, string identifier) =>
        purpose == OtpPurpose.PatientLogin
            ? new string(identifier.Where(char.IsDigit).ToArray())
            : identifier.Trim().ToLowerInvariant();

    private static string GenerateCode() =>
        RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

    private string Hash(string code)
    {
        var pepper = _config["OtpSettings:Pepper"] ?? "MedCareAxis@Otp@Pepper";
        var bytes = Encoding.UTF8.GetBytes(code + pepper);
        return Convert.ToHexString(SHA256.HashData(bytes));
    }
}
