using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArogyaOS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentFeeCollection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasAmbulance",
                table: "Subscriptions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasBloodBank",
                table: "Subscriptions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasInventory",
                table: "Subscriptions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasOT",
                table: "Subscriptions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasTeleConsult",
                table: "Subscriptions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "ConsultationFee",
                table: "Appointments",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "FeeCollectedAt",
                table: "Appointments",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FeePaymentMode",
                table: "Appointments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FeeReceiptNumber",
                table: "Appointments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFeeCollected",
                table: "Appointments",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasAmbulance",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "HasBloodBank",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "HasInventory",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "HasOT",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "HasTeleConsult",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "ConsultationFee",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "FeeCollectedAt",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "FeePaymentMode",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "FeeReceiptNumber",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "IsFeeCollected",
                table: "Appointments");
        }
    }
}
