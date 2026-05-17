using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedCareAxis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDepositsAndOT : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OTRooms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HospitalId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OTRooms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OTRooms_Hospitals_HospitalId",
                        column: x => x.HospitalId,
                        principalTable: "Hospitals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PatientDeposits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HospitalId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    AdmissionId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReceiptNumber = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    PaymentMode = table.Column<int>(type: "integer", nullable: false),
                    TransactionId = table.Column<string>(type: "text", nullable: true),
                    ChequeNumber = table.Column<string>(type: "text", nullable: true),
                    BankName = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CollectedBy = table.Column<string>(type: "text", nullable: true),
                    DepositDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    IsAdjusted = table.Column<bool>(type: "boolean", nullable: false),
                    AdjustedAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    AdjustedAgainstBillId = table.Column<Guid>(type: "uuid", nullable: true),
                    AdjustedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    IsRefunded = table.Column<bool>(type: "boolean", nullable: false),
                    RefundedAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    RefundMode = table.Column<int>(type: "integer", nullable: true),
                    RefundTransactionId = table.Column<string>(type: "text", nullable: true),
                    RefundNotes = table.Column<string>(type: "text", nullable: true),
                    RefundedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    RefundedBy = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientDeposits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PatientDeposits_Admissions_AdmissionId",
                        column: x => x.AdmissionId,
                        principalTable: "Admissions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PatientDeposits_Hospitals_HospitalId",
                        column: x => x.HospitalId,
                        principalTable: "Hospitals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PatientDeposits_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OTSchedules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HospitalId = table.Column<Guid>(type: "uuid", nullable: false),
                    OTRoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    AdmissionId = table.Column<Guid>(type: "uuid", nullable: true),
                    SurgeonId = table.Column<Guid>(type: "uuid", nullable: false),
                    AnesthetistId = table.Column<Guid>(type: "uuid", nullable: true),
                    AssistantSurgeons = table.Column<string>(type: "text", nullable: true),
                    ScrubNurses = table.Column<string>(type: "text", nullable: true),
                    SurgeryType = table.Column<string>(type: "text", nullable: false),
                    Diagnosis = table.Column<string>(type: "text", nullable: true),
                    AnesthesiaType = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    ScheduledDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    ActualStartTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ActualEndTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ConsentSigned = table.Column<bool>(type: "boolean", nullable: false),
                    BloodGroupConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    AnesthesiaAssessmentDone = table.Column<bool>(type: "boolean", nullable: false),
                    FastingConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    InvestigationsReviewed = table.Column<bool>(type: "boolean", nullable: false),
                    PreOpNotes = table.Column<string>(type: "text", nullable: true),
                    SurgicalNotes = table.Column<string>(type: "text", nullable: true),
                    PostOpNotes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OTSchedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OTSchedules_Admissions_AdmissionId",
                        column: x => x.AdmissionId,
                        principalTable: "Admissions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_OTSchedules_Doctors_AnesthetistId",
                        column: x => x.AnesthetistId,
                        principalTable: "Doctors",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_OTSchedules_Doctors_SurgeonId",
                        column: x => x.SurgeonId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OTSchedules_Hospitals_HospitalId",
                        column: x => x.HospitalId,
                        principalTable: "Hospitals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OTSchedules_OTRooms_OTRoomId",
                        column: x => x.OTRoomId,
                        principalTable: "OTRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OTSchedules_Patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "Patients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OTRooms_HospitalId",
                table: "OTRooms",
                column: "HospitalId");

            migrationBuilder.CreateIndex(
                name: "IX_OTSchedules_AdmissionId",
                table: "OTSchedules",
                column: "AdmissionId");

            migrationBuilder.CreateIndex(
                name: "IX_OTSchedules_AnesthetistId",
                table: "OTSchedules",
                column: "AnesthetistId");

            migrationBuilder.CreateIndex(
                name: "IX_OTSchedules_HospitalId",
                table: "OTSchedules",
                column: "HospitalId");

            migrationBuilder.CreateIndex(
                name: "IX_OTSchedules_OTRoomId",
                table: "OTSchedules",
                column: "OTRoomId");

            migrationBuilder.CreateIndex(
                name: "IX_OTSchedules_PatientId",
                table: "OTSchedules",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_OTSchedules_SurgeonId",
                table: "OTSchedules",
                column: "SurgeonId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientDeposits_AdmissionId",
                table: "PatientDeposits",
                column: "AdmissionId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientDeposits_HospitalId",
                table: "PatientDeposits",
                column: "HospitalId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientDeposits_PatientId",
                table: "PatientDeposits",
                column: "PatientId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OTSchedules");

            migrationBuilder.DropTable(
                name: "PatientDeposits");

            migrationBuilder.DropTable(
                name: "OTRooms");
        }
    }
}
