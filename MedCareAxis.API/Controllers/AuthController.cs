using MedCareAxis.Core.DTOs.Request;
using MedCareAxis.Core.DTOs.Response;
using MedCareAxis.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace MedCareAxis.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    private string? UserId => User.FindFirstValue(ClaimTypes.NameIdentifier);

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
    // ─── POST api/auth/patient-login/request-otp ──────
    [HttpPost("patient-login/request-otp")]
    [AllowAnonymous]
    public async Task<IActionResult> RequestPatientLoginOtp([FromBody] PatientOtpRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _authService.RequestPatientOtpAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── POST api/auth/patient-login ──────────────────
    [HttpPost("patient-login")]
    [AllowAnonymous]
    public async Task<IActionResult> PatientLogin([FromBody] PatientLoginRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _authService.PatientLoginAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── POST api/auth/patient-unified-login/request-otp ──
    [HttpPost("patient-unified-login/request-otp")]
    [AllowAnonymous]
    public async Task<IActionResult> RequestUnifiedPatientLoginOtp([FromBody] UnifiedPatientOtpRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _authService.RequestUnifiedPatientOtpAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── POST api/auth/patient-unified-login ──────────
    [HttpPost("patient-unified-login")]
    [AllowAnonymous]
    public async Task<IActionResult> PatientUnifiedLogin([FromBody] UnifiedPatientLoginRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _authService.UnifiedPatientLoginAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── POST api/auth/forgot-password ─────────────────
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _authService.ForgotPasswordAsync(request);
        return Ok(result);
    }

    // ─── POST api/auth/reset-password ──────────────────
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _authService.ResetPasswordAsync(request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ─── POST api/auth/verify-registration-otp ─────────
    [HttpPost("verify-registration-otp")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyRegistrationOtp([FromBody] VerifyRegistrationOtpRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _authService.VerifyRegistrationOtpAsync(request);
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

    // ─── POST api/auth/logout ─────────────────────────
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        if (UserId == null) return Unauthorized();
        var result = await _authService.LogoutAsync(UserId);
        return Ok(result);
    }

    // ─── POST api/auth/change-password ────────────────
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (UserId == null) return Unauthorized();
        var result = await _authService.ChangePasswordAsync(UserId, request);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}