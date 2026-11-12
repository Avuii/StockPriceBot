using Microsoft.EntityFrameworkCore;
using PriceStockBot.Core.Domain;

namespace PriceStockBot.Infrastructure.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<PriceHistory> PriceHistory => Set<PriceHistory>();
    public DbSet<AlertRule> AlertRules => Set<AlertRule>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ProductCheckLog> ProductCheckLogs => Set<ProductCheckLog>();

    public DbSet<BrowserPushSubscription> BrowserPushSubscriptions => Set<BrowserPushSubscription>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(user => user.Id);
            entity.HasIndex(user => user.Email).IsUnique();
            entity.Property(user => user.Id).HasMaxLength(64);
            entity.Property(user => user.Email).HasMaxLength(256).IsRequired();
            entity.Property(user => user.PasswordHash).HasMaxLength(500).IsRequired();
            entity.Property(user => user.PasswordResetTokenHash).HasMaxLength(128);
            entity.Property(user => user.AlertEmail).HasMaxLength(256);
            entity.Property(user => user.EmailSmtpHost).HasMaxLength(300);
            entity.Property(user => user.EmailSmtpUserName).HasMaxLength(256);
            entity.Property(user => user.EmailSmtpPassword).HasMaxLength(1000);
            entity.Property(user => user.EmailFromEmail).HasMaxLength(256);
            entity.Property(user => user.EmailFromName).HasMaxLength(120);
            entity.Property(user => user.MinimumDiscountPercent).HasPrecision(5, 2);

            entity.HasMany(user => user.Sessions)
                .WithOne(session => session.User)
                .HasForeignKey(session => session.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(user => user.Products)
                .WithOne(product => product.User)
                .HasForeignKey(product => product.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(user => user.Categories)
                .WithOne(category => category.User)
                .HasForeignKey(category => category.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasData(new AppUser
            {
                Id = Product.DefaultUserId,
                Email = "demo@pricestockbot.local",
                PasswordHash = "disabled",
                AlertEmail = "demo@pricestockbot.local",
                EmailNotificationsEnabled = false,
                EmailSmtpPort = 587,
                EmailEnableSsl = true,
                MinimumDiscountPercent = 20m,
                NotifyOnlySelectedVariant = true,
                NotifyBackInStock = true,
                NotifyTargetPrice = true,
                MaxEmailsPerProductPerDay = 1,
                DefaultCheckIntervalMinutes = 60,
                CreatedAt = new DateTimeOffset(2026, 7, 5, 0, 0, 0, TimeSpan.Zero),
                UpdatedAt = new DateTimeOffset(2026, 7, 5, 0, 0, 0, TimeSpan.Zero)
            });
        });

        modelBuilder.Entity<BrowserPushSubscription>(entity =>
        {
            entity.HasKey(item => item.EndpointHash);
            entity.Property(item => item.EndpointHash).HasMaxLength(64);
            entity.Property(item => item.UserId).HasMaxLength(64);
            entity.Property(item => item.Endpoint).HasMaxLength(2048);
            entity.Property(item => item.P256dh).HasMaxLength(87);
            entity.Property(item => item.Auth).HasMaxLength(22);
            entity.HasOne<AppUser>().WithMany().HasForeignKey(item => item.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.HasIndex(session => session.TokenHash).IsUnique();
            entity.HasIndex(session => new { session.UserId, session.ExpiresAt });
            entity.Property(session => session.UserId).HasMaxLength(64).IsRequired();
            entity.Property(session => session.TokenHash).HasMaxLength(128).IsRequired();
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasIndex(product => product.Url);
            entity.HasIndex(product => new { product.UserId, product.IsActive });
            entity.HasIndex(product => new { product.UserId, product.IsBookmarked });
            entity.Property(product => product.UserId).HasMaxLength(64).IsRequired();
            entity.Property(product => product.Name).HasMaxLength(300).IsRequired();
            entity.Property(product => product.Url).HasMaxLength(2048).IsRequired();
            entity.Property(product => product.ShopName).HasMaxLength(120).IsRequired();
            entity.Property(product => product.ImageUrl).HasMaxLength(2048);
            entity.Property(product => product.Currency).HasMaxLength(8).IsRequired();
            entity.Property(product => product.BasePrice).HasPrecision(18, 2);
            entity.Property(product => product.CurrentPrice).HasPrecision(18, 2);
            entity.Property(product => product.TargetPrice).HasPrecision(18, 2);
            entity.Property(product => product.Size).HasMaxLength(80);
            entity.Property(product => product.Color).HasMaxLength(120);
            entity.Property(product => product.Note).HasColumnType("text");
            entity.Property(product => product.PriceSelector).HasMaxLength(500);
            entity.Property(product => product.StockSelector).HasMaxLength(500);
            entity.Property(product => product.LastRawHash).HasMaxLength(128);
            entity.Property(product => product.MonitoringStatus).HasConversion<string>().HasMaxLength(40);
            entity.Property(product => product.LastCheckMessage).HasMaxLength(500);
            entity.Property(product => product.LastCheckError).HasColumnType("text");
            entity.Property(product => product.LastCheckSource).HasConversion<string>().HasMaxLength(40);

            entity.HasMany(product => product.PriceHistory)
                .WithOne(history => history.Product)
                .HasForeignKey(history => history.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(product => product.AlertRules)
                .WithOne(rule => rule.Product)
                .HasForeignKey(rule => rule.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(product => product.Notifications)
                .WithOne(notification => notification.Product)
                .HasForeignKey(notification => notification.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(product => product.CheckLogs)
                .WithOne(log => log.Product)
                .HasForeignKey(log => log.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasIndex(category => new { category.UserId, category.Name }).IsUnique();
            entity.Property(category => category.UserId).HasMaxLength(64).IsRequired();
            entity.Property(category => category.Name).HasMaxLength(120).IsRequired();
            entity.Property(category => category.IconName).HasMaxLength(80);
            entity.Property(category => category.ColorHex).HasMaxLength(16);
        });

        modelBuilder.Entity<PriceHistory>(entity =>
        {
            entity.HasIndex(history => new { history.ProductId, history.CheckedAt });
            entity.Property(history => history.Price).HasPrecision(18, 2);
            entity.Property(history => history.Currency).HasMaxLength(8).IsRequired();
            entity.Property(history => history.RawHash).HasMaxLength(128);
            entity.Property(history => history.Source).HasConversion<string>().HasMaxLength(40);
        });

        modelBuilder.Entity<AlertRule>(entity =>
        {
            entity.HasIndex(rule => new { rule.ProductId, rule.Type, rule.IsActive });
            entity.Property(rule => rule.Type).HasConversion<string>().HasMaxLength(40);
            entity.Property(rule => rule.TargetPrice).HasPrecision(18, 2);
            entity.Property(rule => rule.PercentDrop).HasPrecision(5, 2);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasIndex(notification => new { notification.ProductId, notification.SentAt });
            entity.Property(notification => notification.Type).HasConversion<string>().HasMaxLength(40);
            entity.Property(notification => notification.Channel).HasConversion<string>().HasMaxLength(40);
            entity.Property(notification => notification.Message).HasMaxLength(1000).IsRequired();
            entity.Property(notification => notification.Payload).HasColumnType("jsonb");
        });

        modelBuilder.Entity<ProductCheckLog>(entity =>
        {
            entity.HasIndex(log => new { log.ProductId, log.CheckedAt });
            entity.Property(log => log.Level).HasConversion<string>().HasMaxLength(20);
            entity.Property(log => log.Status).HasConversion<string>().HasMaxLength(40);
            entity.Property(log => log.Source).HasConversion<string>().HasMaxLength(40);
            entity.Property(log => log.Message).HasMaxLength(500).IsRequired();
            entity.Property(log => log.Details).HasColumnType("text");
            entity.Property(log => log.Price).HasPrecision(18, 2);
        });
    }
}
