using System.Security.Claims;

namespace MedCareAxis.Core.Common;

public static class TenantClaimHelper
{
    public static Guid GetHospitalId(ClaimsPrincipal? user)
    {
        var claim = user?.Claims.FirstOrDefault(c => c.Type == "hospitalId");
        if (claim == null || string.IsNullOrEmpty(claim.Value)) return Guid.Empty;
        return Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }

    public static Guid GetPatientId(ClaimsPrincipal? user)
    {
        var claim = user?.Claims.FirstOrDefault(c => c.Type == "patientId");
        if (claim == null || string.IsNullOrEmpty(claim.Value)) return Guid.Empty;
        return Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }
}
