using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedCareAxis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantIsolationAndConcurrencyTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Wards",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "SupportTickets",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "SupportMessages",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Subscriptions",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "SubscriptionPayments",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "StockTransactions",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "StaffShifts",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "StaffLeaves",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "StaffAttendances",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Staff",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Prescriptions",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "PrescriptionItems",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "PharmacyOrders",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "PharmacyOrderItems",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Payments",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Patients",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "PatientDeposits",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "OTSchedules",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "OTRooms",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "OPDVisits",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Medicines",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "MedicineBatches",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "LabTests",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "LabTestParameters",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "LabResults",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "LabOrders",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "LabOrderItems",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Hospitals",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "DoctorSchedules",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Doctors",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "DoctorLeaves",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Departments",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Bills",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "BillItems",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Beds",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Appointments",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "AdmissionVitals",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Admissions",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Wards");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "SupportTickets");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "SupportMessages");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "SubscriptionPayments");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "StockTransactions");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "StaffShifts");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "StaffLeaves");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "StaffAttendances");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Prescriptions");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "PrescriptionItems");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "PharmacyOrders");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "PharmacyOrderItems");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "PatientDeposits");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "OTSchedules");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "OTRooms");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "OPDVisits");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Medicines");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "MedicineBatches");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "LabTests");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "LabTestParameters");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "LabResults");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "LabOrders");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "LabOrderItems");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Hospitals");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "DoctorSchedules");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "DoctorLeaves");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Departments");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Bills");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "BillItems");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Beds");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "AdmissionVitals");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Admissions");
        }
    }
}
