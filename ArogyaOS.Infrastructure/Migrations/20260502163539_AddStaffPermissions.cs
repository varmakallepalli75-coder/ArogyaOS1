using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArogyaOS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffPermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "PermAppointments",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PermBilling",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PermIPD",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PermLab",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PermOPD",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PermPatients",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PermPharmacy",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PermReports",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PermStaff",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PermAppointments",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PermBilling",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PermIPD",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PermLab",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PermOPD",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PermPatients",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PermPharmacy",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PermReports",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PermStaff",
                table: "Users");
        }
    }
}
