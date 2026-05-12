using ArogyaOS.Infrastructure;
using ArogyaOS.Infrastructure.Data;
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
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.ITokenService,        ArogyaOS.Infrastructure.Services.TokenService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IAuthService,         ArogyaOS.Infrastructure.Services.AuthService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IPatientService,      ArogyaOS.Infrastructure.Services.PatientService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IDepartmentService,   ArogyaOS.Infrastructure.Services.DepartmentService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IAppointmentService,  ArogyaOS.Infrastructure.Services.AppointmentService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IDashboardService,    ArogyaOS.Infrastructure.Services.DashboardService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IBillingService,      ArogyaOS.Infrastructure.Services.BillingService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IOPDService,          ArogyaOS.Infrastructure.Services.OPDService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.ISuperAdminService,   ArogyaOS.Infrastructure.Services.SuperAdminService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IPdfService,          ArogyaOS.Infrastructure.Services.PdfService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IEmailService,        ArogyaOS.Infrastructure.Services.EmailService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IIPDService,           ArogyaOS.Infrastructure.Services.IPDService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.ILabService,           ArogyaOS.Infrastructure.Services.LabService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IPharmacyService,      ArogyaOS.Infrastructure.Services.PharmacyService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IStaffService,         ArogyaOS.Infrastructure.Services.StaffService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IAuditService,          ArogyaOS.Infrastructure.Services.AuditService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IReferralService,       ArogyaOS.Infrastructure.Services.ReferralService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IReportService,         ArogyaOS.Infrastructure.Services.ReportService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IPushNotificationService, ArogyaOS.Infrastructure.Services.PushNotificationService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IAlertService,            ArogyaOS.Infrastructure.Services.AlertService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.ISupportService,          ArogyaOS.Infrastructure.Services.SupportService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IOTService,               ArogyaOS.Infrastructure.Services.OTService>();
builder.Services.AddScoped<ArogyaOS.Infrastructure.Services.IDepositService,           ArogyaOS.Infrastructure.Services.DepositService>();
builder.Services.AddHostedService<ArogyaOS.Infrastructure.Services.MedicineReminderJob>();
builder.Services.AddHttpContextAccessor();

// ─── JWT Authentication ────────────────────────────────
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
                                       Encoding.UTF8.GetBytes(secretKey))
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
builder.Services.AddCors(options =>
{
    options.AddPolicy("ArogyaOSPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:3002",
                "http://localhost:3003",
                "http://localhost:5173"
            )
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

app.UseSentryTracing();
app.UseCors("ArogyaOSPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
