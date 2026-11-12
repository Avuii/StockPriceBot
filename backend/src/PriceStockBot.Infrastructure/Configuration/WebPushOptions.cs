namespace PriceStockBot.Infrastructure.Configuration;

public sealed class WebPushOptions
{
    public const string SectionName = "Notifications:WebPush";
    public string Subject { get; set; } = "";
    public string PublicKey { get; set; } = "";
    public string PrivateKey { get; set; } = "";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Subject)
        && !string.IsNullOrWhiteSpace(PublicKey)
        && !string.IsNullOrWhiteSpace(PrivateKey);
}
