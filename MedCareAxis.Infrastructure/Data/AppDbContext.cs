using System.Reflection;
using MedCareAxis.Core.Entities;
using MedCareAxis.Core.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace MedCareAxis.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    private readonly ICurrentTenantService _tenant;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentTenantService tenant) : base(options)
    {
        _tenant = tenant;
    }

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

    // ─── Patient Health Records (cross-hospital) ───────
    public DbSet<PatientDocument> PatientDocuments => Set<PatientDocument>();

    // ─── Operation Theatre ─────────────────────────────
    public DbSet<OTRoom> OTRooms => Set<OTRoom>();
    public DbSet<OTSchedule> OTSchedules => Set<OTSchedule>();

    // ─── Staff ─────────────────────────────────────────
    public DbSet<Staff> Staff => Set<Staff>();
    public DbSet<StaffShift> StaffShifts => Set<StaffShift>();
    public DbSet<StaffLeave> StaffLeaves => Set<StaffLeave>();
    public DbSet<StaffAttendance> StaffAttendances => Set<StaffAttendance>();

    // ─── OTP ───────────────────────────────────────────
    public DbSet<OtpCode> OtpCodes => Set<OtpCode>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ─── Soft delete + tenant isolation global filters ──
        // Every BaseEntity gets a soft-delete filter; entities that also implement
        // ITenantEntity additionally get scoped to the current request's hospital.
        // _tenant.HospitalId is null for SuperAdmin requests and non-HTTP contexts
        // (background jobs, startup seeding), which intentionally bypasses tenant
        // scoping while still respecting soft-delete.
        var setTenantFilter = GetType().GetMethod(nameof(SetTenantQueryFilter), BindingFlags.NonPublic | BindingFlags.Instance)!;
        var setSoftDeleteFilter = GetType().GetMethod(nameof(SetSoftDeleteQueryFilter), BindingFlags.NonPublic | BindingFlags.Instance)!;

        foreach (var entityType in builder.Model.GetEntityTypes().ToList())
        {
            var clrType = entityType.ClrType;
            if (!typeof(BaseEntity).IsAssignableFrom(clrType)) continue;

            if (typeof(ITenantEntity).IsAssignableFrom(clrType))
                setTenantFilter.MakeGenericMethod(clrType).Invoke(this, new object[] { builder });
            else
                setSoftDeleteFilter.MakeGenericMethod(clrType).Invoke(this, new object[] { builder });

            // Free optimistic concurrency via Postgres' xmin system column — no migration needed.
            builder.Entity(clrType).Property<uint>("xmin")
                .HasColumnName("xmin")
                .ValueGeneratedOnAddOrUpdate()
                .IsConcurrencyToken();
        }

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

        // ─── OTP ───────────────────────────────────────
        builder.Entity<OtpCode>(e =>
        {
            e.HasIndex(x => new { x.Purpose, x.Identifier, x.Consumed });
            e.Property(x => x.Identifier).HasMaxLength(100);
            e.Property(x => x.CodeHash).HasMaxLength(100);
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

    private void SetTenantQueryFilter<TEntity>(ModelBuilder builder)
        where TEntity : BaseEntity, ITenantEntity
    {
        builder.Entity<TEntity>().HasQueryFilter(e =>
            !e.IsDeleted && (_tenant.HospitalId == null || e.HospitalId == _tenant.HospitalId));
    }

    private void SetSoftDeleteQueryFilter<TEntity>(ModelBuilder builder)
        where TEntity : BaseEntity
    {
        builder.Entity<TEntity>().HasQueryFilter(e => !e.IsDeleted);
    }
}