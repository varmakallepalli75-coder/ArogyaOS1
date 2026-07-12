using MedCareAxis.Infrastructure.Data;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace MedCareAxis.Infrastructure.Services;

public class DatabaseHealthCheck : IHealthCheck
{
    private readonly AppDbContext _context;

    public DatabaseHealthCheck(AppDbContext context)
    {
        _context = context;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        return await _context.Database.CanConnectAsync(cancellationToken)
            ? HealthCheckResult.Healthy("Database connection OK.")
            : HealthCheckResult.Unhealthy("Cannot connect to the database.");
    }
}
