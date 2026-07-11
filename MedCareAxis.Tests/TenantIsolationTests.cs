using MedCareAxis.Core.Entities;
using MedCareAxis.Core.Interfaces;
using MedCareAxis.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MedCareAxis.Tests;

public class FakeCurrentTenantService : ICurrentTenantService
{
    public Guid? HospitalId { get; set; }
}

public class TenantIsolationTests
{
    private static (AppDbContext Context, Guid HospitalA, Guid HospitalB) SeedTwoHospitals(FakeCurrentTenantService tenant)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var hospitalA = Guid.NewGuid();
        var hospitalB = Guid.NewGuid();

        // Seed with tenant bypassed so both hospitals' rows can be written in one context.
        tenant.HospitalId = null;
        using (var seedContext = new AppDbContext(options, tenant))
        {
            seedContext.Patients.AddRange(
                new Patient { Id = Guid.NewGuid(), HospitalId = hospitalA, FirstName = "Alice", UHID = "A-001" },
                new Patient { Id = Guid.NewGuid(), HospitalId = hospitalA, FirstName = "Alice-Deleted", UHID = "A-002", IsDeleted = true },
                new Patient { Id = Guid.NewGuid(), HospitalId = hospitalB, FirstName = "Bob", UHID = "B-001" }
            );
            seedContext.SaveChanges();
        }

        var context = new AppDbContext(options, tenant);
        return (context, hospitalA, hospitalB);
    }

    [Fact]
    public void HospitalScopedContext_OnlySeesOwnHospitalPatients()
    {
        var tenant = new FakeCurrentTenantService();
        var (context, hospitalA, hospitalB) = SeedTwoHospitals(tenant);
        tenant.HospitalId = hospitalA;

        var patients = context.Patients.ToList();

        Assert.Single(patients);
        Assert.Equal(hospitalA, patients[0].HospitalId);
        Assert.All(patients, p => Assert.NotEqual(hospitalB, p.HospitalId));
    }

    [Fact]
    public void HospitalScopedContext_ExcludesSoftDeletedRows_EvenWithinOwnHospital()
    {
        var tenant = new FakeCurrentTenantService();
        var (context, hospitalA, _) = SeedTwoHospitals(tenant);
        tenant.HospitalId = hospitalA;

        var patients = context.Patients.ToList();

        Assert.DoesNotContain(patients, p => p.FirstName == "Alice-Deleted");
    }

    [Fact]
    public void NullTenantContext_SeesAllNonDeletedPatientsAcrossHospitals()
    {
        var tenant = new FakeCurrentTenantService();
        var (context, hospitalA, hospitalB) = SeedTwoHospitals(tenant);
        tenant.HospitalId = null; // SuperAdmin / background-job context

        var patients = context.Patients.ToList();

        Assert.Equal(2, patients.Count);
        Assert.Contains(patients, p => p.HospitalId == hospitalA);
        Assert.Contains(patients, p => p.HospitalId == hospitalB);
        Assert.DoesNotContain(patients, p => p.FirstName == "Alice-Deleted");
    }

    [Fact]
    public void HospitalScopedContext_CannotSeeOtherHospitalsPatientsById()
    {
        var tenant = new FakeCurrentTenantService();
        var (context, hospitalA, hospitalB) = SeedTwoHospitals(tenant);
        tenant.HospitalId = hospitalA;

        var bobFromOtherHospital = context.Patients.FirstOrDefault(p => p.HospitalId == hospitalB);

        Assert.Null(bobFromOtherHospital);
    }
}
