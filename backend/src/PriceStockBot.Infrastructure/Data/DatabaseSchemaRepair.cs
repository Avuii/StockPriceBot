using Microsoft.EntityFrameworkCore;

namespace PriceStockBot.Infrastructure.Data;

public static class DatabaseSchemaRepair
{
    public static void EnsureUserEmailDeliveryColumns(this AppDbContext dbContext)
    {
        dbContext.Database.ExecuteSqlRaw("""
            ALTER TABLE "Users"
                ADD COLUMN IF NOT EXISTS "EmailEnableSsl" boolean NOT NULL DEFAULT TRUE,
                ADD COLUMN IF NOT EXISTS "EmailFromEmail" character varying(256) NULL,
                ADD COLUMN IF NOT EXISTS "EmailFromName" character varying(120) NULL,
                ADD COLUMN IF NOT EXISTS "EmailSmtpHost" character varying(300) NULL,
                ADD COLUMN IF NOT EXISTS "EmailSmtpPassword" character varying(1000) NULL,
                ADD COLUMN IF NOT EXISTS "EmailSmtpPort" integer NOT NULL DEFAULT 587,
                ADD COLUMN IF NOT EXISTS "EmailSmtpUserName" character varying(256) NULL,
                ADD COLUMN IF NOT EXISTS "PasswordResetTokenHash" character varying(128) NULL,
                ADD COLUMN IF NOT EXISTS "PasswordResetTokenExpiresAt" timestamp with time zone NULL,
                ADD COLUMN IF NOT EXISTS "MaxEmailsPerProductPerDay" integer NOT NULL DEFAULT 1,
                ADD COLUMN IF NOT EXISTS "DefaultCheckIntervalMinutes" integer NOT NULL DEFAULT 60;

            ALTER TABLE "Categories"
                ADD COLUMN IF NOT EXISTS "IconName" character varying(80) NULL,
                ADD COLUMN IF NOT EXISTS "ColorHex" character varying(16) NULL;

            ALTER TABLE "Products"
                ALTER COLUMN "Note" TYPE text,
                ADD COLUMN IF NOT EXISTS "MonitoringStatus" character varying(40) NOT NULL DEFAULT 'Unknown',
                ADD COLUMN IF NOT EXISTS "LastCheckMessage" character varying(500) NULL,
                ADD COLUMN IF NOT EXISTS "LastCheckError" text NULL,
                ADD COLUMN IF NOT EXISTS "LastCheckSource" character varying(40) NOT NULL DEFAULT 'Unknown',
                ADD COLUMN IF NOT EXISTS "LastSuccessfulCheckAt" timestamp with time zone NULL;

            CREATE TABLE IF NOT EXISTS "ProductCheckLogs" (
                "Id" uuid NOT NULL,
                "ProductId" uuid NOT NULL,
                "Level" character varying(20) NOT NULL,
                "Status" character varying(40) NOT NULL,
                "Message" character varying(500) NOT NULL,
                "Details" text NULL,
                "Price" numeric(18,2) NULL,
                "IsAvailable" boolean NULL,
                "Source" character varying(40) NOT NULL,
                "CheckedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_ProductCheckLogs" PRIMARY KEY ("Id"),
                CONSTRAINT "FK_ProductCheckLogs_Products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS "IX_ProductCheckLogs_ProductId_CheckedAt"
                ON "ProductCheckLogs" ("ProductId", "CheckedAt");
            """);
    }
}
