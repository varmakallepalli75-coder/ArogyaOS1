using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArogyaOS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHospitalIdToAuditLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "HospitalId",
                table: "AuditLogs",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HospitalId",
                table: "AuditLogs");
        }
    }
}
