using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PriceStockBot.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    [Migration("20260707170000_UserEmailDeliverySettings")]
    public partial class UserEmailDeliverySettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EmailEnableSsl",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailFromEmail",
                table: "Users",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailFromName",
                table: "Users",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailSmtpHost",
                table: "Users",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailSmtpPassword",
                table: "Users",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EmailSmtpPort",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 587);

            migrationBuilder.AddColumn<string>(
                name: "EmailSmtpUserName",
                table: "Users",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailEnableSsl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailFromEmail",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailFromName",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailSmtpHost",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailSmtpPassword",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailSmtpPort",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailSmtpUserName",
                table: "Users");
        }
    }
}
