using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArogyaOS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientReferrals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PatientReferrals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FromHospitalId = table.Column<Guid>(type: "uuid", nullable: false),
                    ToHospitalId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReceivedPatientId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReferringDoctorName = table.Column<string>(type: "text", nullable: false),
                    ReceivingDoctorName = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Urgency = table.Column<int>(type: "integer", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: false),
                    ClinicalNotes = table.Column<string>(type: "text", nullable: true),
                    DeclineReason = table.Column<string>(type: "text", nullable: true),
                    OutcomeNotes = table.Column<string>(type: "text", nullable: true),
                    PatientConsent = table.Column<bool>(type: "boolean", nullable: false),
                    PatientSnapshot = table.Column<string>(type: "text", nullable: false),
                    AttachedReports = table.Column<string>(type: "text", nullable: true),
                    ReferredAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    AcceptedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientReferrals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PatientReferrals_Hospitals_FromHospitalId",
                        column: x => x.FromHospitalId,
                        principalTable: "Hospitals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PatientReferrals_Hospitals_ToHospitalId",
                        column: x => x.ToHospitalId,
                        principalTable: "Hospitals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PatientReferrals_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PatientReferrals_FromHospitalId",
                table: "PatientReferrals",
                column: "FromHospitalId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientReferrals_PatientId",
                table: "PatientReferrals",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientReferrals_ToHospitalId",
                table: "PatientReferrals",
                column: "ToHospitalId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PatientReferrals");
        }
    }
}
