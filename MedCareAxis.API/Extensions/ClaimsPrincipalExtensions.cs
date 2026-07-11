using System.Security.Claims;
using MedCareAxis.Core.Common;

namespace MedCareAxis.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetHospitalId(this ClaimsPrincipal user) => TenantClaimHelper.GetHospitalId(user);

    public static Guid GetPatientId(this ClaimsPrincipal user) => TenantClaimHelper.GetPatientId(user);
}
