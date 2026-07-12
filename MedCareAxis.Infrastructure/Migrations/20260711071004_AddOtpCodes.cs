using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedCareAxis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOtpCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OtpCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Purpose = table.Column<int>(type: "integer", nullable: false),
                    Identifier = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CodeHash = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Attempts = table.Column<int>(type: "integer", nullable: false),
                    Consumed = table.Column<bool>(type: "boolean", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OtpCodes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OtpCodes_Purpose_Identifier_Consumed",
                table: "OtpCodes",
                columns: new[] { "Purpose", "Identifier", "Consumed" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OtpCodes");
        }
    }
}
