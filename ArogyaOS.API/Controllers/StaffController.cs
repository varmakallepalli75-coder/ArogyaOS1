using ArogyaOS.API.Filters;
using ArogyaOS.Core.DTOs.Request;
using ArogyaOS.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ArogyaOS.API.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize]
[SubscriptionCheck]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staff;

    public StaffController(IStaffService staff) => _staff = staff;

    private Guid HospitalId => Guid.Parse(User.FindFirstValue("hospitalId")!);

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string search = "")
    {
        var res = await _staff.GetAllAsync(HospitalId, search);
        return Ok(res);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var res = await _staff.GetByIdAsync(id, HospitalId);
        return res.Success ? Ok(res) : NotFound(res);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStaffRequest request)
    {
        var res = await _staff.CreateAsync(request, HospitalId);
        return res.Success ? Ok(res) : BadRequest(res);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateStaffRequest request)
    {
        var res = await _staff.UpdateAsync(id, request, HospitalId);
        return res.Success ? Ok(res) : BadRequest(res);
    }

    [HttpPut("{id}/permissions")]
    public async Task<IActionResult> UpdatePermissions(string id, [FromBody] StaffPermissionsRequest request)
    {
        var res = await _staff.UpdatePermissionsAsync(id, request, HospitalId);
        return res.Success ? Ok(res) : BadRequest(res);
    }

    [HttpPut("{id}/toggle-status")]
    public async Task<IActionResult> ToggleStatus(string id)
    {
        var res = await _staff.ToggleStatusAsync(id, HospitalId);
        return res.Success ? Ok(res) : BadRequest(res);
    }

    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(string id, [FromBody] ResetStaffPasswordRequest request)
    {
        var res = await _staff.ResetPasswordAsync(id, request.NewPassword, HospitalId);
        return res.Success ? Ok(res) : BadRequest(res);
    }
}
