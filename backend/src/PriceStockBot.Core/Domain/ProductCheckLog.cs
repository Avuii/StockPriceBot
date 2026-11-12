namespace PriceStockBot.Core.Domain;

public sealed class ProductCheckLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public ProductCheckLogLevel Level { get; set; } = ProductCheckLogLevel.Info;
    public MonitorHealthStatus Status { get; set; } = MonitorHealthStatus.Unknown;
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }
    public decimal? Price { get; set; }
    public bool? IsAvailable { get; set; }
    public StoreDetectionSource Source { get; set; } = StoreDetectionSource.Unknown;
    public DateTimeOffset CheckedAt { get; set; } = DateTimeOffset.UtcNow;
}
