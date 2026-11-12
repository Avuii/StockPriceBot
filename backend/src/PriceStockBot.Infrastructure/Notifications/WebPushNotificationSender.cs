using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PriceStockBot.Core.Domain;
using PriceStockBot.Core.Models;
using PriceStockBot.Core.Ports;
using PriceStockBot.Infrastructure.Configuration;
using PriceStockBot.Infrastructure.Data;
using WebPush;

namespace PriceStockBot.Infrastructure.Notifications;

public sealed class WebPushNotificationSender(
    AppDbContext db,
    IHttpClientFactory clients,
    IOptions<WebPushOptions> options,
    ILogger<WebPushNotificationSender> logger) : INotificationSender
{
    public NotificationChannel Channel => NotificationChannel.WebPush;

    public async Task<bool> SendAsync(AppUser user, Product product, AlertEvent alert, CancellationToken cancellationToken)
    {
        var config = options.Value;
        if (!config.IsConfigured)
        {
            return false;
        }

        var subscriptions = await db.BrowserPushSubscriptions.Where(item => item.UserId == user.Id)
            .AsNoTracking().ToListAsync(cancellationToken);
        if (subscriptions.Count == 0)
        {
            return false;
        }

        using var http = clients.CreateClient(nameof(WebPushNotificationSender));
        using var client = new WebPushClient(http);
        var details = new VapidDetails(config.Subject, config.PublicKey, config.PrivateKey);
        var payload = JsonSerializer.Serialize(new { title = product.Name, body = alert.Message });
        var delivered = false;
        foreach (var item in subscriptions)
        {
            if (!IsBrowserEndpoint(item.Endpoint))
            {
                continue;
            }

            try
            {
                await client.SendNotificationAsync(new PushSubscription(item.Endpoint, item.P256dh, item.Auth),
                    payload, details, cancellationToken);
                delivered = true;
            }
            catch (WebPushException exception) when (exception.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Gone)
            {
                await db.BrowserPushSubscriptions
                    .Where(subscription => subscription.EndpointHash == item.EndpointHash && subscription.UserId == user.Id
                        && subscription.Auth == item.Auth && subscription.P256dh == item.P256dh)
                    .ExecuteDeleteAsync(cancellationToken);
            }
            catch (Exception exception) when (!cancellationToken.IsCancellationRequested)
            {
                logger.LogWarning("Web push delivery failed ({ErrorType})", exception.GetType().Name);
            }
        }

        return delivered;
    }

    public static bool IsBrowserEndpoint(string? value) =>
        value is { Length: > 0 and <= 2048 } && Uri.TryCreate(value, UriKind.Absolute, out var uri)
        && uri.Scheme == "https" && uri.IsDefaultPort && string.IsNullOrEmpty(uri.UserInfo)
        && string.IsNullOrEmpty(uri.Fragment)
        && (uri.IdnHost is "fcm.googleapis.com" or "updates.push.services.mozilla.com" or "web.push.apple.com"
            || uri.IdnHost.EndsWith(".notify.windows.com", StringComparison.OrdinalIgnoreCase));
}
