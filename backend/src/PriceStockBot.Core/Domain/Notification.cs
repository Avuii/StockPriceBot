namespace PriceStockBot.Core.Domain;

public sealed class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public Guid? AlertRuleId { get; set; }
    public AlertRuleType Type { get; set; }
    public NotificationChannel Channel { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Payload { get; set; } = "{}";
    public DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;
}
