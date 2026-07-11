using MedCareAxis.API.Extensions;
using MedCareAxis.API.Filters;
using MedCareAxis.Core.DTOs.Request;
using MedCareAxis.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;

namespace MedCareAxis.API.Controllers;

[ApiController]
[Route("api/push")]
[Authorize]
public class PushController : ControllerBase
{
    private readonly IPushNotificationService _push;
    private readonly IConfiguration _config;

    public PushController(IPushNotificationService push, IConfiguration config)
    {
        _push   = push;
        _config = config;
    }

    // Returns the VAPID public key so the client can subscribe
    [HttpGet("vapid-public-key")]
    public IActionResult GetPublicKey()
    {
        return Ok(new { publicKey = _config["VapidKeys:PublicKey"] });
    }

    // Patient portal calls this after subscribing in the browser
    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] PushSubscribeRequest request)
    {
        var patientId  = GetPatientId();
        var hospitalId = GetHospitalId();
        if (patientId == Guid.Empty) return Unauthorized();

        await _push.SubscribeAsync(patientId, hospitalId, request);
        return Ok(new { success = true, message = "Push notifications enabled." });
    }

    // Unsubscribe (patient turns off notifications)
    [HttpPost("unsubscribe")]
    public async Task<IActionResult> Unsubscribe([FromBody] UnsubscribeRequest request)
    {
        var patientId = GetPatientId();
        if (patientId == Guid.Empty) return Unauthorized();

        await _push.UnsubscribeAsync(patientId, request.Endpoint);
        return Ok(new { success = true });
    }

    // Hospital staff can send a manual broadcast to all patients (admin only)
    [HttpPost("broadcast")]
    [SubscriptionCheck]
    public async Task<IActionResult> Broadcast([FromBody] BroadcastRequest request)
    {
        var hospitalId = GetHospitalId();
        if (hospitalId == Guid.Empty) return Unauthorized();

        await _push.SendToAllAsync(hospitalId, request.Title, request.Body);
        return Ok(new { success = true, message = "Broadcast sent." });
    }

    private Guid GetPatientId() => User.GetPatientId();

    private Guid GetHospitalId() => User.GetHospitalId();
}

public class UnsubscribeRequest { public string Endpoint { get; set; } = string.Empty; }
public class BroadcastRequest  { public string Title { get; set; } = string.Empty; public string Body { get; set; } = string.Empty; }
