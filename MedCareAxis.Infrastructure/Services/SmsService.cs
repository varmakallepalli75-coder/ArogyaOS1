using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MedCareAxis.Infrastructure.Services;

public interface ISmsService
{
    Task SendOtpAsync(string mobileNumber, string otp);
}

public class Msg91SmsService : ISmsService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<Msg91SmsService> _logger;

    public Msg91SmsService(HttpClient http, IConfiguration config, ILogger<Msg91SmsService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task SendOtpAsync(string mobileNumber, string otp)
    {
        var authKey = _config["Msg91:AuthKey"] ?? "";
        if (string.IsNullOrEmpty(authKey))
        {
            // MSG91 not configured (e.g. local dev) — log instead of sending so the
            // OTP flow can still be exercised end-to-end without real credentials.
            _logger.LogInformation("MSG91 not configured — OTP for {Mobile} is {Otp}", mobileNumber, otp);
            return;
        }

        var templateId = _config["Msg91:TemplateId"] ?? "";
        var mobile = mobileNumber.StartsWith("91") ? mobileNumber : $"91{mobileNumber}";

        var query = $"otp={otp}&mobile={mobile}&authkey={authKey}"
            + (string.IsNullOrEmpty(templateId) ? "" : $"&template_id={templateId}");

        var response = await _http.GetAsync($"https://control.msg91.com/api/v5/otp?{query}");
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("MSG91 OTP send failed for {Mobile}: {Status} {Body}", mobileNumber, response.StatusCode, body);
        }
    }
}
