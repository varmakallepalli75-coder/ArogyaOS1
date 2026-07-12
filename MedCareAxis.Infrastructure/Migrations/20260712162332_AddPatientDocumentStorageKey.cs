using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedCareAxis.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientDocumentStorageKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "FileBase64",
                table: "PatientDocuments",
                newName: "StorageKey");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "StorageKey",
                table: "PatientDocuments",
                newName: "FileBase64");
        }
    }
}
