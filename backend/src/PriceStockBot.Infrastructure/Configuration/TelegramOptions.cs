namespace PriceStockBot.Infrastructure.Configuration;

public sealed class TelegramOptions
{
    public const string SectionName = "Notifications:Telegram";

    public bool Enabled { get; set; }
    public string? BotToken { get; set; }
    public string? ChatId { get; set; }
}
