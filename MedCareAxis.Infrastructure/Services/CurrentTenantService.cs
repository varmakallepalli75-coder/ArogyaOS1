using MedCareAxis.Core.Common;
using MedCareAxis.Core.Interfaces;
using Microsoft.AspNetCore.Http;

namespace MedCareAxis.Infrastructure.Services;

public class CurrentTenantService : ICurrentTenantService
{
    private readonly IHttpContextAccessor _http;

    public CurrentTenantService(IHttpContextAccessor http)
    {
        _http = http;
    }

    public Guid? HospitalId
    {
        get
        {
            var id = TenantClaimHelper.GetHospitalId(_http.HttpContext?.User);
            return id == Guid.Empty ? null : id;
        }
    }
}
