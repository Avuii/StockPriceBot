namespace PriceStockBot.Core.Domain;

public sealed class Product
{
    public const string DefaultUserId = "demo-user";

    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = DefaultUserId;
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string ShopName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public decimal? BasePrice { get; set; }
    public decimal? CurrentPrice { get; set; }
    public decimal? TargetPrice { get; set; }
    public string Currency { get; set; } = "PLN";
    public string? Size { get; set; }
    public string? Color { get; set; }
    public string? Note { get; set; }
    public bool IsAvailable { get; set; }
    public DateTimeOffset? LastCheckedAt { get; set; }
    public int CheckIntervalMinutes { get; set; } = 60;
    public bool TrackStock { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public bool IsBookmarked { get; set; }
    public string? PriceSelector { get; set; }
    public string? StockSelector { get; set; }
    public string? LastRawHash { get; set; }
    public MonitorHealthStatus MonitoringStatus { get; set; } = MonitorHealthStatus.Unknown;
    public string? LastCheckMessage { get; set; }
    public string? LastCheckError { get; set; }
    public StoreDetectionSource LastCheckSource { get; set; } = StoreDetectionSource.Unknown;
    public DateTimeOffset? LastSuccessfulCheckAt { get; set; }
    public Guid? CategoryId { get; set; }
    public AppUser? User { get; set; }
    public Category? Category { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<PriceHistory> PriceHistory { get; set; } = new List<PriceHistory>();
    public ICollection<AlertRule> AlertRules { get; set; } = new List<AlertRule>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<ProductCheckLog> CheckLogs { get; set; } = new List<ProductCheckLog>();
}
