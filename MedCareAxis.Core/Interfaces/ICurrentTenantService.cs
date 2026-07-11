namespace MedCareAxis.Core.Interfaces;

/// <summary>
/// Resolves the tenant (hospital) scope of the current request from JWT claims.
/// Null means "no single-tenant scope" — SuperAdmin requests, background jobs,
/// and startup seeding all resolve to null and are intentionally unscoped.
/// </summary>
public interface ICurrentTenantService
{
    Guid? HospitalId { get; }
}
