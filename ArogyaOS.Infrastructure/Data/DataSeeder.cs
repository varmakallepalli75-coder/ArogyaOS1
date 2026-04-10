using ArogyaOS.Core.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace ArogyaOS.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(
        AppDbContext context,
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration)
    {
        // ─── Run Migrations ────────────────────────────
        await context.Database.MigrateAsync();

        // ─── Seed Roles ────────────────────────────────
        var roles = Enum.GetNames(typeof(UserRole));
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // ─── Seed Super Admin ──────────────────────────
        var superAdminEmail = configuration["SuperAdmin:Email"]
            ?? "admin@arogyaos.com";
        var superAdminPassword = configuration["SuperAdmin:Password"]
            ?? "Admin@12345";

        var existingAdmin = await userManager
            .FindByEmailAsync(superAdminEmail);

        if (existingAdmin == null)
        {
            var superAdmin = new AppUser
            {
                UserName = superAdminEmail,
                Email = superAdminEmail,
                FirstName = "Super",
                LastName = "Admin",
                Role = UserRole.SuperAdmin,
                HospitalId = null,
                IsActive = true,
                EmailConfirmed = true,
                PhoneNumberConfirmed = true
            };

            var result = await userManager
                .CreateAsync(superAdmin, superAdminPassword);

            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(
                    superAdmin,
                    UserRole.SuperAdmin.ToString());

                Console.WriteLine("✅ Super Admin created successfully!");
                Console.WriteLine($"   Email: {superAdminEmail}");
                Console.WriteLine($"   Password: {superAdminPassword}");
            }
            else
            {
                foreach (var error in result.Errors)
                    Console.WriteLine($"❌ {error.Description}");
            }
        }
        else
        {
            Console.WriteLine("✅ Super Admin already exists.");
        }
    }
}