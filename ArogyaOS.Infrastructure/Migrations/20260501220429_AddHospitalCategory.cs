using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArogyaOS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHospitalCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Category",
                table: "Hospitals",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Hospitals");
        }
    }
}
