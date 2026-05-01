using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ArogyaOS.Core.Enums;
using ArogyaOS.Core.Entities;
using ArogyaOS.Core.Entities;
using ArogyaOS.Infrastructure.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ArogyaOS.Infrastructure.Services;

public interface ITokenService
{
    string GenerateAccessToken(AppUser user);
    string GenerateRefreshToken();
    string GeneratePatientToken(Patient patient, Hospital hospital);
}

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateAccessToken(AppUser user)
    {
        var jwtSettings = _config.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]!;
        var issuer = jwtSettings["Issuer"]!;
        var audience = jwtSettings["Audience"]!;
        var expiryMinutes = int.Parse(jwtSettings["ExpiryMinutes"]!);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim("role", user.Role.ToString()),
            new Claim("hospitalId", user.HospitalId?.ToString() ?? ""),
            new Claim("doctorId", user.DoctorId?.ToString() ?? ""),
            new Claim("staffId", user.StaffId?.ToString() ?? ""),
            new Claim("patientId", user.PatientId?.ToString() ?? ""),
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
    public string GeneratePatientToken(Patient patient, Hospital hospital)
{
    var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, patient.Id.ToString()),
        new Claim(ClaimTypes.Email, patient.MobileNumber),
        new Claim(ClaimTypes.Name, patient.FullName),
        new Claim("role", "Patient"),
        new Claim("hospitalId", hospital.Id.ToString()),
        new Claim("patientId", patient.Id.ToString()),
        new Claim("hospitalCode", hospital.HospitalCode)
    };

    var key = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes((_config.GetSection("JwtSettings")["SecretKey"])!));
    var creds = new SigningCredentials(
        key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: (_config.GetSection("JwtSettings")["Issuer"]),
        audience: (_config.GetSection("JwtSettings")["Audience"]),
        claims: claims,
        expires: DateTime.UtcNow.AddDays(1),
        signingCredentials: creds
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
}
}