using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PriceStockBot.Infrastructure.Data;

#nullable disable

namespace PriceStockBot.Infrastructure.Data.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260715202000_ProductBookmarks")]
    public partial class ProductBookmarks : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsBookmarked",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Products_UserId_IsBookmarked",
                table: "Products",
                columns: new[] { "UserId", "IsBookmarked" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_UserId_IsBookmarked",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsBookmarked",
                table: "Products");
        }
    }
}
