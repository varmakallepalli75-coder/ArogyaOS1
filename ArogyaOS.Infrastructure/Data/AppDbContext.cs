using ArogyaOS.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ArogyaOS.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // ─── SaaS ──────────────────────────────────────────
    public DbSet<Hospital> Hospitals => Set<Hospital>();
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<SubscriptionPayment> SubscriptionPayments => Set<SubscriptionPayment>();

    // ─── Support ───────────────────────────────────────
    public DbSet<SupportTicket> SupportTickets => Set<SupportTicket>();
    public DbSet<SupportMessage> SupportMessages => Set<SupportMessage>();

    // ─── Announcements ─────────────────────────────────
    public DbSet<Announcement> Announcements => Set<Announcement>();

    // ─── Platform Settings ──────────────────────────────
    public DbSet<PlatformSetting> PlatformSettings => Set<PlatformSetting>();

    // ─── Referrals ─────────────────────────────────────
    public DbSet<PatientReferral> PatientReferrals => Set<PatientReferral>();

    // ─── Patient ───────────────────────────────────────
    public DbSet<Patient> Patients => Set<Patient>();

    // ─── Department & Doctors ──────────────────────────
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<DoctorSchedule> DoctorSchedules => Set<DoctorSchedule>();
    public DbSet<DoctorLeave> DoctorLeaves => Set<DoctorLeave>();

    // ─── Ward & Beds ───────────────────────────────────
    public DbSet<Ward> Wards => Set<Ward>();
    public DbSet<Bed> Beds => Set<Bed>();

    // ─── OPD ───────────────────────────────────────────
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<OPDVisit> OPDVisits => Set<OPDVisit>();

    // ─── IPD ───────────────────────────────────────────
    public DbSet<Admission> Admissions => Set<Admission>();
    public DbSet<AdmissionVitals> AdmissionVitals => Set<AdmissionVitals>();

    // ─── Prescription ──────────────────────────────────
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<PrescriptionItem> PrescriptionItems => Set<PrescriptionItem>();

    // ─── Lab ───────────────────────────────────────────
    public DbSet<LabTest> LabTests => Set<LabTest>();
    public DbSet<LabTestParameter> LabTestParameters => Set<LabTestParameter>();
    public DbSet<LabOrder> LabOrders => Set<LabOrder>();
    public DbSet<LabOrderItem> LabOrderItems => Set<LabOrderItem>();
    public DbSet<LabResult> LabResults => Set<LabResult>();

    // ─── Pharmacy ──────────────────────────────────────
    public DbSet<Medicine> Medicines => Set<Medicine>();
    public DbSet<MedicineBatch> MedicineBatches => Set<MedicineBatch>();
    public DbSet<StockTransaction> StockTransactions => Set<StockTransaction>();
    public DbSet<PharmacyOrder> PharmacyOrders => Set<PharmacyOrder>();
    public DbSet<PharmacyOrderItem> PharmacyOrderItems => Set<PharmacyOrderItem>();

    // ─── Billing ───────────────────────────────────────
    public DbSet<Bill> Bills => Set<Bill>();
    public DbSet<BillItem> BillItems => Set<BillItem>();
    public DbSet<Payment> Payments => Set<Payment>();

    // ─── Push Notifications ────────────────────────────
    public DbSet<PatientPushSubscription> PatientPushSubscriptions => Set<PatientPushSubscription>();

    // ─── Deposits ──────────────────────────────────────
    public DbSet<PatientDeposit> PatientDeposits => Set<PatientDeposit>();

    // ─── Operation Theatre ─────────────────────────────
    public DbSet<OTRoom> OTRooms => Set<OTRoom>();
    public DbSet<OTSchedule> OTSchedules => Set<OTSchedule>();

    // ─── Staff ─────────────────────────────────────────
    public DbSet<Staff> Staff => Set<Staff>();
    public DbSet<StaffShift> StaffShifts => Set<StaffShift>();
    public DbSet<StaffLeave> StaffLeaves => Set<StaffLeave>();
    public DbSet<StaffAttendance> StaffAttendances => Set<StaffAttendance>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ─── Soft Delete Global Filter ──────────────────
        builder.Entity<Hospital>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<Patient>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<Doctor>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<Appointment>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<OPDVisit>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<Admission>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<Bill>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<Prescription>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<LabOrder>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<PharmacyOrder>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<Medicine>().HasQueryFilter(x => !x.IsDeleted);
        builder.Entity<Staff>().HasQueryFilter(x => !x.IsDeleted);

        // ─── Hospital ──────────────────────────────────
        builder.Entity<Hospital>(e =>
        {
            e.HasIndex(x => x.HospitalCode).IsUnique();
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.HospitalCode).HasMaxLength(20);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Email).HasMaxLength(100);
        });

        // ─── Patient ───────────────────────────────────
        builder.Entity<Patient>(e =>
        {
            e.HasIndex(x => new { x.HospitalId, x.UHID }).IsUnique();
            e.HasIndex(x => x.MobileNumber);
            e.HasIndex(x => x.AadhaarNumber);
            e.HasIndex(x => x.ABHAId);
            e.Property(x => x.UHID).HasMaxLength(20);
            e.Property(x => x.FirstName).HasMaxLength(100);
            e.Property(x => x.LastName).HasMaxLength(100);
            e.Property(x => x.MobileNumber).HasMaxLength(15);
        });

        // ─── Doctor ────────────────────────────────────
        builder.Entity<Doctor>(e =>
        {
            e.HasIndex(x => new { x.HospitalId, x.EmployeeCode }).IsUnique();
            e.HasIndex(x => x.RegistrationNumber);
            e.Property(x => x.ConsultationFee).HasColumnType("decimal(10,2)");
            e.Property(x => x.FollowUpFee).HasColumnType("decimal(10,2)");
        });

        // ─── Bill ──────────────────────────────────────
        builder.Entity<Bill>(e =>
        {
            e.HasIndex(x => new { x.HospitalId, x.BillNumber }).IsUnique();
            e.Property(x => x.TotalAmount).HasColumnType("decimal(12,2)");
            e.Property(x => x.PaidAmount).HasColumnType("decimal(12,2)");
            e.Property(x => x.GSTAmount).HasColumnType("decimal(12,2)");
            e.Property(x => x.DiscountAmount).HasColumnType("decimal(12,2)");
            e.Ignore(x => x.DueAmount);
        });

        // ─── Medicine ──────────────────────────────────
        builder.Entity<Medicine>(e =>
        {
            e.HasIndex(x => new { x.HospitalId, x.Code }).IsUnique();
            e.Property(x => x.PurchasePrice).HasColumnType("decimal(10,2)");
            e.Property(x => x.SalePrice).HasColumnType("decimal(10,2)");
            e.Property(x => x.MRP).HasColumnType("decimal(10,2)");
        });

        // ─── Subscription ──────────────────────────────
       // ─── Subscription ──────────────────────────────────
        builder.Entity<Subscription>(e =>
        {
            e.Property(x => x.MonthlyAmount).HasColumnType("decimal(10,2)");
            e.Property(x => x.FinalAmount).HasColumnType("decimal(10,2)");
            e.HasOne(x => x.Hospital)
             .WithOne(x => x.Subscription)
             .HasForeignKey<Subscription>(x => x.HospitalId);
        });

        // ─── Rename Identity Tables ────────────────────
        builder.Entity<AppUser>().ToTable("Users");
        builder.Entity<IdentityRole>().ToTable("Roles");
        builder.Entity<IdentityUserRole<string>>().ToTable("UserRoles");
        builder.Entity<IdentityUserClaim<string>>().ToTable("UserClaims");
        builder.Entity<IdentityUserLogin<string>>().ToTable("UserLogins");
        builder.Entity<IdentityRoleClaim<string>>().ToTable("RoleClaims");
        builder.Entity<IdentityUserToken<string>>().ToTable("UserTokens");

        // ─── Ignore computed properties ────────────────
        builder.Entity<Patient>().Ignore(x => x.FullName);
        builder.Entity<Patient>().Ignore(x => x.Age);
        builder.Entity<Doctor>().Ignore(x => x.FullName);
        builder.Entity<Staff>().Ignore(x => x.FullName);
        builder.Entity<MedicineBatch>().Ignore(x => x.IsExpired);
    }
}