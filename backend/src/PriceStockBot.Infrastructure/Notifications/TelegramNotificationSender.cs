using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PriceStockBot.Core.Domain;
using PriceStockBot.Core.Models;
using PriceStockBot.Core.Ports;
using PriceStockBot.Infrastructure.Configuration;

namespace PriceStockBot.Infrastructure.Notifications;

public sealed class TelegramNotificationSender(
    IHttpClientFactory httpClientFactory,
    IOptions<TelegramOptions> options,
    ILogger<TelegramNotificationSender> logger) : INotificationSender
{
    public NotificationChannel Channel => NotificationChannel.Telegram;

    public async Task<bool> SendAsync(AppUser user, Product product, AlertEvent alert, CancellationToken cancellationToken)
    {
        var telegram = options.Value;
        if (!telegram.Enabled || string.IsNullOrWhiteSpace(telegram.BotToken) || string.IsNullOrWhiteSpace(telegram.ChatId))
        {
            logger.LogInformation("Telegram notification skipped because the channel is not configured.");
            return false;
        }

        var text = $"""
        {alert.Message}

        {product.Name}
        Sklep: {product.ShopName}
        Link: {product.Url}
        """;

        var client = httpClientFactory.CreateClient(nameof(TelegramNotificationSender));
        var endpoint = $"https://api.telegram.org/bot{telegram.BotToken}/sendMessage";
        var response = await client.PostAsJsonAsync(endpoint, new
        {
            chat_id = telegram.ChatId,
            text,
            disable_web_page_preview = false
        }, cancellationToken);

        response.EnsureSuccessStatusCode();
        return true;
    }
}
