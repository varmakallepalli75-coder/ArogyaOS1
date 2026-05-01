using ArogyaOS.Infrastructure;
using ArogyaOS.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ─── Infrastructure (DB + Identity) ───────────────────
builder.Services.AddInfrastructure(builder.Configuration);
// ─── Register Services Manually ───────────────────────
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.ITokenService, ArogyaOS.Infrastructure.Services.TokenService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IAuthService, ArogyaOS.Infrastructure.Services.AuthService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IPatientService, ArogyaOS.Infrastructure.Services.PatientService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IDepartmentService, ArogyaOS.Infrastructure.Services.DepartmentService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IAppointmentService, ArogyaOS.Infrastructure.Services.AppointmentService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IDashboardService, ArogyaOS.Infrastructure.Services.DashboardService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IBillingService, ArogyaOS.Infrastructure.Services.BillingService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IOPDService, ArogyaOS.Infrastructure.Services.OPDService>();

// ─── JWT Authentication ────────────────────────────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(secretKey))
    };
});

// ─── Controllers ──────────────────────────────────────
builder.Services.AddControllers();

// ─── OpenAPI (built-in .NET 10) ───────────────────────
builder.Services.AddOpenApi();

// ─── CORS ─────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("ArogyaOSPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:3002",
                "http://localhost:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ─── Build App ────────────────────────────────────────
var app = builder.Build();

// ─── Auto migrate database on startup ─────────────────
// ─── Auto migrate + seed database on startup ──────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();
    var userManager = scope.ServiceProvider
        .GetRequiredService<UserManager<AppUser>>();
    var roleManager = scope.ServiceProvider
        .GetRequiredService<RoleManager<IdentityRole>>();
    var config = scope.ServiceProvider
        .GetRequiredService<IConfiguration>();

    await DataSeeder.SeedAsync(db, userManager, roleManager, config);
}

// ─── Middleware ───────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("ArogyaOSPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();