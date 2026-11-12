namespace PriceStockBot.Core.Domain;

public sealed class AppUser
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PasswordResetTokenHash { get; set; }
    public DateTimeOffset? PasswordResetTokenExpiresAt { get; set; }
    public string? AlertEmail { get; set; }
    public bool EmailNotificationsEnabled { get; set; } = true;
    public string? EmailSmtpHost { get; set; }
    public int EmailSmtpPort { get; set; } = 587;
    public string? EmailSmtpUserName { get; set; }
    public string? EmailSmtpPassword { get; set; }
    public string? EmailFromEmail { get; set; }
    public string? EmailFromName { get; set; }
    public bool EmailEnableSsl { get; set; } = true;
    public decimal MinimumDiscountPercent { get; set; } = 20m;
    public bool NotifyOnlySelectedVariant { get; set; } = true;
    public bool NotifyBackInStock { get; set; } = true;
    public bool NotifyTargetPrice { get; set; } = true;
    public int MaxEmailsPerProductPerDay { get; set; } = 1;
    public int DefaultCheckIntervalMinutes { get; set; } = 60;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<Category> Categories { get; set; } = new List<Category>();
}
