namespace PriceStockBot.Core.Domain;

public sealed class AlertRule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public AlertRuleType Type { get; set; }
    public decimal? TargetPrice { get; set; }
    public decimal? PercentDrop { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? LastTriggeredAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
