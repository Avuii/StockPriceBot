using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PriceStockBot.Infrastructure.Data;

#nullable disable

namespace PriceStockBot.Infrastructure.Data.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260715200000_UserDefaultCheckInterval")]
    public partial class UserDefaultCheckInterval : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DefaultCheckIntervalMinutes",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 60);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefaultCheckIntervalMinutes",
                table: "Users");
        }
    }
}
