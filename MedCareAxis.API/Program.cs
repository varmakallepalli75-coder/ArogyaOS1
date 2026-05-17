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
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.ITokenService,        MedCareAxis.Infrastructure.Services.TokenService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IAuthService,         MedCareAxis.Infrastructure.Services.AuthService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IPatientService,      MedCareAxis.Infrastructure.Services.PatientService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IDepartmentService,   MedCareAxis.Infrastructure.Services.DepartmentService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IAppointmentService,  MedCareAxis.Infrastructure.Services.AppointmentService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IDashboardService,    MedCareAxis.Infrastructure.Services.DashboardService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IBillingService,      MedCareAxis.Infrastructure.Services.BillingService>();
builder.Services.AddScoped<MedCareAxis.Infrastructure.Services.IOPDService,          MedCareAxis.Infrastructure.Services.OPDService>();
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
builder.Services.AddHostedService<MedCareAxis.Infrastructure.Services.MedicineReminderJob>();
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
    options.AddPolicy("MedCareAxisPolicy", policy =>
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
app.UseCors("MedCareAxisPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
