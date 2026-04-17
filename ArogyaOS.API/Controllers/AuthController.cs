using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Core.DTOs.Response;
using ArogyaOS.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace ArogyaOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // ─── POST api/auth/login ───────────────────────────
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.LoginAsync(request);

        if (!result.Success)
            return Unauthorized(result);

        return Ok(result);
    }

    // ─── POST api/auth/register-hospital ──────────────
    [HttpPost("register-hospital")]
    public async Task<IActionResult> RegisterHospital(
        [FromBody] RegisterHospitalRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService
            .RegisterHospitalAsync(request);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
    // ─── POST api/auth/patient-login ──────────────────
[HttpPost("patient-login")]
[AllowAnonymous]
public async Task<IActionResult> PatientLogin(
    [FromBody] PatientLoginRequest request)
{
    if (!ModelState.IsValid) return BadRequest(ModelState);
    var result = await _authService.PatientLoginAsync(request);
    if (!result.Success) return BadRequest(result);
    return Ok(result);
}

    // ─── POST api/auth/refresh-token ──────────────────
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken(
        [FromBody] RefreshTokenRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService
            .RefreshTokenAsync(request.RefreshToken);

        if (!result.Success)
            return Unauthorized(result);

        return Ok(result);
    }
}