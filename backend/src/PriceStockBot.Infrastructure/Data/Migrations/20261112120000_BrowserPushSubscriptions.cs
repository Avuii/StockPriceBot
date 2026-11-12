using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace PriceStockBot.Infrastructure.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261112120000_BrowserPushSubscriptions")]
public sealed class BrowserPushSubscriptions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "BrowserPushSubscriptions",
            columns: table => new
            {
                EndpointHash = table.Column<string>(maxLength: 64, nullable: false),
                UserId = table.Column<string>(maxLength: 64, nullable: false),
                Endpoint = table.Column<string>(maxLength: 2048, nullable: false),
                P256dh = table.Column<string>(maxLength: 87, nullable: false),
                Auth = table.Column<string>(maxLength: 22, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_BrowserPushSubscriptions", row => row.EndpointHash);
                table.ForeignKey("FK_BrowserPushSubscriptions_Users_UserId", row => row.UserId,
                    "Users", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex("IX_BrowserPushSubscriptions_UserId", "BrowserPushSubscriptions", "UserId");
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropTable("BrowserPushSubscriptions");
}
