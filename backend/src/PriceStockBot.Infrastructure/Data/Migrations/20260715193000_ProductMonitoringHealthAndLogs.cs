using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PriceStockBot.Infrastructure.Data;

#nullable disable

namespace PriceStockBot.Infrastructure.Data.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260715193000_ProductMonitoringHealthAndLogs")]
    public partial class ProductMonitoringHealthAndLogs : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxEmailsPerProductPerDay",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "LastCheckError",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastCheckMessage",
                table: "Products",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastCheckSource",
                table: "Products",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "Unknown");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastSuccessfulCheckAt",
                table: "Products",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MonitoringStatus",
                table: "Products",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "Unknown");

            migrationBuilder.CreateTable(
                name: "ProductCheckLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Level = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Details = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    IsAvailable = table.Column<bool>(type: "boolean", nullable: true),
                    Source = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CheckedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductCheckLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductCheckLogs_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductCheckLogs_ProductId_CheckedAt",
                table: "ProductCheckLogs",
                columns: new[] { "ProductId", "CheckedAt" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "ProductCheckLogs");

            migrationBuilder.DropColumn(name: "MaxEmailsPerProductPerDay", table: "Users");
            migrationBuilder.DropColumn(name: "LastCheckError", table: "Products");
            migrationBuilder.DropColumn(name: "LastCheckMessage", table: "Products");
            migrationBuilder.DropColumn(name: "LastCheckSource", table: "Products");
            migrationBuilder.DropColumn(name: "LastSuccessfulCheckAt", table: "Products");
            migrationBuilder.DropColumn(name: "MonitoringStatus", table: "Products");
        }
    }
}
