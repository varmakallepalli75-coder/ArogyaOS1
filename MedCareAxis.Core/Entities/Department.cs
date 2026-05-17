namespace MedCareAxis.Core.Entities;

public class Department : BaseEntity
{
    // ─── Tenant ────────────────────────────────────────
    public Guid HospitalId { get; set; }

    // ─── Details ───────────────────────────────────────
    public string Code { get; set; } = string.Empty;      // e.g. CARD, NEUR, ORTH
    public string Name { get; set; } = string.Empty;      // e.g. Cardiology
    public string? Description { get; set; }
    public string? ContactExtension { get; set; }
    public string? Location { get; set; }                 // e.g. Block A, Floor 2
    public string? HeadDoctorId { get; set; }
    public bool IsActive { get; set; } = true;

    // ─── Navigation ────────────────────────────────────
    public Hospital? Hospital { get; set; }
    public ICollection<Doctor> Doctors { get; set; }
        = new List<Doctor>();
    public ICollection<Ward> Wards { get; set; }
        = new List<Ward>();
    public ICollection<Appointment> Appointments { get; set; }
        = new List<Appointment>();
}