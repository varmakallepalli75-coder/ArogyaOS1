using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace MedCareAxis.API.Security;

public static class AuthorizationPolicies
{
    public const string HospitalUser = "HospitalUser";
    public const string PatientOnly = "PatientOnly";
    public const string HospitalAdmin = "HospitalAdmin";
    public const string Patients = "Patients";
    public const string Appointments = "Appointments";
    public const string OPD = "OPD";
    public const string IPD = "IPD";
    public const string Lab = "Lab";
    public const string Pharmacy = "Pharmacy";
    public const string Billing = "Billing";
    public const string Reports = "Reports";
    public const string Staff = "Staff";

    public static IServiceCollection AddMedCareAxisAuthorization(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.AddPolicy(HospitalUser, p => p.RequireAssertion(c => IsHospitalRole(c.User) && HasHospital(c.User)));
            options.AddPolicy(PatientOnly, p => p.RequireRole("Patient"));
            options.AddPolicy(HospitalAdmin, p => p.RequireAssertion(c => IsAdmin(c.User) && HasHospital(c.User)));
            AddPermission(options, Patients, "permPatients");
            AddPermission(options, Appointments, "permAppointments");
            AddPermission(options, OPD, "permOPD");
            AddPermission(options, IPD, "permIPD");
            AddPermission(options, Lab, "permLab");
            AddPermission(options, Pharmacy, "permPharmacy");
            AddPermission(options, Billing, "permBilling");
            AddPermission(options, Reports, "permReports");
            AddPermission(options, Staff, "permStaff");
        });
        return services;
    }

    private static void AddPermission(AuthorizationOptions options, string name, string claim) =>
        options.AddPolicy(name, p => p.RequireAssertion(c => HasHospital(c.User) &&
            (IsAdmin(c.User) || string.Equals(c.User.FindFirstValue(claim), "True", StringComparison.OrdinalIgnoreCase))));

    private static bool HasHospital(ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue("hospitalId"), out var id) && id != Guid.Empty;
    private static bool IsAdmin(ClaimsPrincipal user) =>
        user.IsInRole("HospitalAdmin") || user.IsInRole("Manager") || user.IsInRole("SuperAdmin");
    private static bool IsHospitalRole(ClaimsPrincipal user) =>
        user.Identity?.IsAuthenticated == true && !user.IsInRole("Patient") && !user.IsInRole("SuperAdmin");
}
