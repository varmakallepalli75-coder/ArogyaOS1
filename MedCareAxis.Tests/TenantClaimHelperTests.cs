using System.Security.Claims;
using MedCareAxis.Core.Common;
using Xunit;

namespace MedCareAxis.Tests;

public class TenantClaimHelperTests
{
    private static ClaimsPrincipal PrincipalWith(params Claim[] claims) =>
        new(new ClaimsIdentity(claims, "TestAuth"));

    [Fact]
    public void GetHospitalId_ReturnsEmpty_WhenClaimMissing()
    {
        var user = PrincipalWith();

        Assert.Equal(Guid.Empty, TenantClaimHelper.GetHospitalId(user));
    }

    [Fact]
    public void GetHospitalId_ReturnsEmpty_WhenClaimIsEmptyString()
    {
        var user = PrincipalWith(new Claim("hospitalId", ""));

        Assert.Equal(Guid.Empty, TenantClaimHelper.GetHospitalId(user));
    }

    [Fact]
    public void GetHospitalId_ReturnsEmpty_WhenClaimIsMalformed()
    {
        var user = PrincipalWith(new Claim("hospitalId", "not-a-guid"));

        Assert.Equal(Guid.Empty, TenantClaimHelper.GetHospitalId(user));
    }

    [Fact]
    public void GetHospitalId_ReturnsParsedGuid_WhenClaimIsValid()
    {
        var id = Guid.NewGuid();
        var user = PrincipalWith(new Claim("hospitalId", id.ToString()));

        Assert.Equal(id, TenantClaimHelper.GetHospitalId(user));
    }

    [Fact]
    public void GetHospitalId_ReturnsEmpty_WhenUserIsNull()
    {
        Assert.Equal(Guid.Empty, TenantClaimHelper.GetHospitalId(null));
    }

    [Fact]
    public void GetPatientId_ReturnsParsedGuid_WhenClaimIsValid()
    {
        var id = Guid.NewGuid();
        var user = PrincipalWith(new Claim("patientId", id.ToString()));

        Assert.Equal(id, TenantClaimHelper.GetPatientId(user));
    }

    [Fact]
    public void GetPatientId_ReturnsEmpty_WhenClaimMissing()
    {
        var user = PrincipalWith();

        Assert.Equal(Guid.Empty, TenantClaimHelper.GetPatientId(user));
    }
}
