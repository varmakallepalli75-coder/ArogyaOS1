namespace MedCareAxis.Core.Interfaces;

/// <summary>
/// Marks an entity as scoped to a single hospital. Implementing entities get an
/// automatic global query filter (see AppDbContext.OnModelCreating) restricting
/// reads to the current request's hospital.
/// </summary>
public interface ITenantEntity
{
    Guid HospitalId { get; set; }
}
