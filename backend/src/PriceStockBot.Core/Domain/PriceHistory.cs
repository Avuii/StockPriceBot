namespace PriceStockBot.Core.Domain;

public sealed class PriceHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal? Price { get; set; }
    public string Currency { get; set; } = "PLN";
    public bool IsAvailable { get; set; }
    public DateTimeOffset CheckedAt { get; set; } = DateTimeOffset.UtcNow;
    public string RawHash { get; set; } = string.Empty;
    public StoreDetectionSource Source { get; set; } = StoreDetectionSource.Unknown;
}
