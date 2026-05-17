using MedCareAxis.Core.Enums;

namespace MedCareAxis.Core.Entities;

public class Hospital : BaseEntity
{
    // ─── Basic Info ────────────────────────────────────
    public string HospitalCode { get; set; } = string.Empty;   // e.g. MCA-HOS-001
    public string Name { get; set; } = string.Empty;
    public string? Logo { get; set; }
    public string? Website { get; set; }
    public HospitalStatus Status { get; set; } = HospitalStatus.Pending;

    // ─── Contact ───────────────────────────────────────
    public string Phone { get; set; } = string.Empty;
    public string? AlternatePhone { get; set; }
    public string Email { get; set; } = string.Empty;

    // ─── Address ───────────────────────────────────────
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PinCode { get; set; } = string.Empty;

    // ─── Legal & Tax ───────────────────────────────────
    public string? GSTNumber { get; set; }
    public string? PANNumber { get; set; }
    public string? RegistrationNumber { get; set; }   // Hospital reg. number
    public string? NABHAccreditation { get; set; }    // NABH number if accredited

    // ─── Hospital Details ──────────────────────────────
    public int TotalBeds { get; set; }
    public string? HospitalType { get; set; }         // Government, Private, Trust
    public HospitalCategory? Category { get; set; }  // Dental, Eye, General, etc.
    public string? Specialities { get; set; }         // Comma separated

    // ─── Admin Contact ─────────────────────────────────
    public string AdminName { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string AdminPhone { get; set; } = string.Empty;

    // ─── Subscription ──────────────────────────────────
    public Guid? SubscriptionId { get; set; }
    public Subscription? Subscription { get; set; }

    // ─── Navigation ────────────────────────────────────
    public ICollection<Department> Departments { get; set; } = new List<Department>();
    public ICollection<Patient> Patients { get; set; } = new List<Patient>();
    public ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();
    public ICollection<Ward> Wards { get; set; } = new List<Ward>();
    public ICollection<Bill> Bills { get; set; } = new List<Bill>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}