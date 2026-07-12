using MedCareAxis.API.Middleware;
using MedCareAxis.Infrastructure;
using MedCareAxis.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ─── Sentry ───────────────────────────────────────────
builder.WebHost.UseSentry(o =>
{
    o.Dsn = builder.Configuration["Sentry:Dsn"] ?? "";
    o.TracesSampleRate = 0.2;
    o.Environment = builder.Environment.EnvironmentName;
    o.AttachStacktrace = true;
});

// ─── Infrastructure (DB + Identity) ───────────────────
builder.Services.AddInfrastructure(builder.Configuration);

// ─── Application Services ─────────────────────────────
// Note: ITokenService, IAuthService, IPatientService, IDepartmentService, IAppointmentService,
// IDashboardService, IBillingService, IOPDService are already registered by AddInfrastructure() above.
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.ISuperAdminService,   MedCareAxis.Infrastructure.Services.SuperAdminService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IPdfService,          MedCareAxis.Infrastructure.Services.PdfService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IEmailService,        MedCareAxis.Infrastructure.Services.EmailService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IIPDService,           MedCareAxis.Infrastructure.Services.IPDService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.ILabService,           MedCareAxis.Infrastructure.Services.LabService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IPharmacyService,      MedCareAxis.Infrastructure.Services.PharmacyService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IStaffService,         MedCareAxis.Infrastructure.Services.StaffService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IAuditService,          MedCareAxis.Infrastructure.Services.AuditService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IReferralService,       MedCareAxis.Infrastructure.Services.ReferralService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IReportService,         MedCareAxis.Infrastructure.Services.ReportService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IPushNotificationService, MedCareAxis.Infrastructure.Services.PushNotificationService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IAlertService,            MedCareAxis.Infrastructure.Services.AlertService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.ISupportService,          MedCareAxis.Infrastructure.Services.SupportService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IOTService,               MedCareAxis.Infrastructure.Services.OTService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IDepositService,           MedCareAxis.Infrastructure.Services.DepositService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IHealthRecordsService,    MedCareAxis.Infrastructure.Services.HealthRecordsService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IOtpService,               MedCareAxis.Infrastructure.Services.OtpService>();
builder.Services.AddHttpClient<MedCareAxis.Infrastructure.Services.ISmsService, MedCareAxis.Infrastructure.Services.Msg91SmsService>();
builder.Services.AddHostedService<MedCareAxis.Infrastructure.Services.MedicineReminderJob>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddTransient<ExceptionHandlingMiddleware>();
builder.Services.AddHealthChecks()
    .AddCheck<MedCareAxis.Infrastructure.Services.DatabaseHealthCheck>("database");

// ─── JWT Authentication ────────────────────────────────
// Prevent the JWT handler from remapping short claim names (e.g. "role" → long URN)
// so that RoleClaimType = "role" matches the claims in the token as-is.
Microsoft.IdentityModel.JsonWebTokens.JsonWebTokenHandler.DefaultInboundClaimTypeMap?.Clear();
System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = jwtSettings["Issuer"],
        ValidAudience            = jwtSettings["Audience"],
        IssuerSigningKey         = new SymmetricSecurityKey(
                                       Encoding.UTF8.GetBytes(secretKey)),
        RoleClaimType            = "role",
        NameClaimType            = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
    };
});

// ─── Controllers ──────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddOpenApi();

// ─── CORS ─────────────────────────────────────────────
// A comma-separated string (not a JSON array) so appsettings.Development.json fully
// overrides appsettings.json rather than merging by index (ASP.NET Core config arrays
// merge per-element across providers, which would otherwise leak the prod origins into dev).
var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(options =>
{
    options.AddPolicy("MedCareAxisPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ─── Build App ────────────────────────────────────────
var app = builder.Build();

// ─── Auto migrate + seed ──────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db          = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var config      = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    await DataSeeder.SeedAsync(db, userManager, roleManager, config);
}

// ─── Middleware ───────────────────────────────────────
if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseSentryTracing();
app.UseCors("MedCareAxisPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
