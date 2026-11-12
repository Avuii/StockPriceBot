using PriceStockBot.Core.Domain;
using PriceStockBot.Core.Models;

namespace PriceStockBot.Core.Ports;

public interface INotificationSender
{
    NotificationChannel Channel { get; }
    Task<bool> SendAsync(AppUser user, Product product, AlertEvent alert, CancellationToken cancellationToken);
}
