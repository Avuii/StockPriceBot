namespace PriceStockBot.Infrastructure.Configuration;

public sealed class EmailOptions
{
    public const string SectionName = "Notifications:Email";

    public bool Enabled { get; set; }
    public string? SmtpHost { get; set; }
    public int SmtpPort { get; set; } = 587;
    public string? UserName { get; set; }
    public string? Password { get; set; }
    public string FromEmail { get; set; } = "alerts@pricestockbot.local";
    public string FromName { get; set; } = "PriceStockBot";
    public bool EnableSsl { get; set; } = true;
}
