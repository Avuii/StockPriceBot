namespace PriceStockBot.Core.Domain;

public sealed class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = Product.DefaultUserId;
    public AppUser? User { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? IconName { get; set; }
    public string? ColorHex { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
