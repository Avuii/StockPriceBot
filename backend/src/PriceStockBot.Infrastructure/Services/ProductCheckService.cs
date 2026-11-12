using System.Text.Json;
using System.Net;
using Microsoft.EntityFrameworkCore;
using PriceStockBot.Core.Domain;
using PriceStockBot.Core.Models;
using PriceStockBot.Core.Ports;
using PriceStockBot.Core.Services;
using PriceStockBot.Infrastructure.Data;

namespace PriceStockBot.Infrastructure.Services;

public sealed class ProductCheckService(
    AppDbContext dbContext,
    IEnumerable<IStoreAdapter> adapters,
    IEnumerable<INotificationSender> notificationSenders,
    AlertEvaluator alertEvaluator) : IProductCheckService
{
    private static readonly TimeSpan NotificationCooldown = TimeSpan.FromHours(12);

    public async Task<int> CheckDueProductsAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var dueProducts = await dbContext.Products
            .Where(product => product.IsActive)
            .Where(product => product.LastCheckedAt == null || product.LastCheckedAt <= now.AddMinutes(-product.CheckIntervalMinutes))
            .OrderBy(product => product.LastCheckedAt)
            .Select(product => product.Id)
            .Take(50)
            .ToListAsync(cancellationToken);

        foreach (var productId in dueProducts)
        {
            await CheckProductAsync(productId, cancellationToken);
        }

        return dueProducts.Count;
    }

    public async Task CheckProductAsync(Guid productId, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products
            .Include(item => item.AlertRules)
            .Include(item => item.User)
            .FirstOrDefaultAsync(item => item.Id == productId, cancellationToken);

        if (product is null || product.User is null)
        {
            return;
        }

        var checkedAt = DateTimeOffset.UtcNow;

        try
        {
            var previous = await dbContext.PriceHistory
                .Where(history => history.ProductId == product.Id && (history.Price != null
                    || history.Source == StoreDetectionSource.SavedSelector || history.Source == StoreDetectionSource.ExtensionPayload))
                .OrderByDescending(history => history.CheckedAt)
                .FirstOrDefaultAsync(cancellationToken);

            var productUri = new Uri(product.Url);
            var adapter = adapters.First(adapter => adapter.CanHandle(productUri));
            var snapshot = await adapter.ScrapeAsync(product, cancellationToken);
            var status = ResolveHealthStatus(product, snapshot);
            var message = ResolveHealthMessage(status);
            var historyPrice = status == MonitorHealthStatus.Ok ? snapshot.Price : null;
            var previousOffer = previous is null ? null : new PriceHistory
            {
                Price = previous.Currency == snapshot.Currency ? previous.Price : null,
                IsAvailable = previous.IsAvailable
            };

            product.Name = string.IsNullOrWhiteSpace(snapshot.Name) ? product.Name : snapshot.Name;
            product.ShopName = string.IsNullOrWhiteSpace(snapshot.Store) ? product.ShopName : snapshot.Store;
            product.ImageUrl = snapshot.ImageUrl ?? product.ImageUrl;
            if (historyPrice is not null)
            {
                product.CurrentPrice = historyPrice;
                product.Currency = snapshot.Currency;
                product.LastSuccessfulCheckAt = checkedAt;
            }

            if (historyPrice is not null || snapshot.Source == StoreDetectionSource.SavedSelector)
            {
                product.IsAvailable = snapshot.IsAvailable;
            }
            product.LastCheckedAt = checkedAt;
            product.LastRawHash = snapshot.RawHash;
            product.MonitoringStatus = status;
            product.LastCheckMessage = message;
            product.LastCheckError = null;
            product.LastCheckSource = snapshot.Source;
            product.UpdatedAt = checkedAt;

            dbContext.PriceHistory.Add(new PriceHistory
            {
                ProductId = product.Id,
                Price = historyPrice,
                Currency = product.Currency,
                IsAvailable = product.IsAvailable,
                CheckedAt = checkedAt,
                RawHash = snapshot.RawHash,
                Source = snapshot.Source
            });

            AddCheckLog(product, status, message, snapshot, checkedAt);

            var alerts = status == MonitorHealthStatus.Ok
                ? alertEvaluator.Evaluate(product, previousOffer, snapshot)
                : Array.Empty<AlertEvent>();
            foreach (var alert in alerts)
            {
                if (!ShouldSendForUser(product.User, alert))
                {
                    continue;
                }

                var rule = product.AlertRules.FirstOrDefault(candidate => candidate.Id == alert.RuleId);
                if (rule is null || IsInCooldown(rule, checkedAt))
                {
                    continue;
                }

                var anyNotificationSent = false;
                var emailsSentToday = await CountEmailsSentTodayAsync(product.Id, checkedAt, cancellationToken);
                foreach (var sender in notificationSenders)
                {
                    if (sender.Channel == NotificationChannel.Email && emailsSentToday >= product.User.MaxEmailsPerProductPerDay)
                    {
                        continue;
                    }

                    var sent = await sender.SendAsync(product.User, product, alert, cancellationToken);
                    if (!sent)
                    {
                        continue;
                    }

                    anyNotificationSent = true;
                    if (sender.Channel == NotificationChannel.Email)
                    {
                        emailsSentToday += 1;
                    }

                    dbContext.Notifications.Add(new Notification
                    {
                        ProductId = product.Id,
                        AlertRuleId = rule.Id,
                        Type = alert.Type,
                        Channel = sender.Channel,
                        Message = alert.Message,
                        Payload = JsonSerializer.Serialize(alert),
                        SentAt = checkedAt
                    });
                }

                if (anyNotificationSent)
                {
                    rule.LastTriggeredAt = checkedAt;
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (HttpRequestException exception) when (exception.StatusCode is HttpStatusCode.Forbidden or HttpStatusCode.TooManyRequests)
        {
            var status = MonitorHealthStatus.StoreBlocked;
            var message = ResolveHealthMessage(status);
            product.LastCheckedAt = checkedAt;
            product.MonitoringStatus = status;
            product.LastCheckMessage = message;
            product.LastCheckError = $"{exception.GetType().Name}: sklep zwrocil HTTP {(int?)exception.StatusCode} ({exception.StatusCode}).";
            product.LastCheckSource = StoreDetectionSource.Unknown;
            product.UpdatedAt = checkedAt;

            dbContext.ProductCheckLogs.Add(new ProductCheckLog
            {
                ProductId = product.Id,
                Level = ProductCheckLogLevel.Warning,
                Status = status,
                Message = message,
                Details = exception.ToString(),
                Source = StoreDetectionSource.Unknown,
                CheckedAt = checkedAt
            });

            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            var message = ResolveHealthMessage(MonitorHealthStatus.LastError);
            product.LastCheckedAt = checkedAt;
            product.MonitoringStatus = MonitorHealthStatus.LastError;
            product.LastCheckMessage = message;
            product.LastCheckError = $"{exception.GetType().Name}: {exception.Message}";
            product.LastCheckSource = StoreDetectionSource.Unknown;
            product.UpdatedAt = checkedAt;

            dbContext.ProductCheckLogs.Add(new ProductCheckLog
            {
                ProductId = product.Id,
                Level = ProductCheckLogLevel.Error,
                Status = MonitorHealthStatus.LastError,
                Message = message,
                Details = exception.ToString(),
                Source = StoreDetectionSource.Unknown,
                CheckedAt = checkedAt
            });

            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private static bool IsInCooldown(AlertRule rule, DateTimeOffset now)
    {
        return rule.LastTriggeredAt is not null && now - rule.LastTriggeredAt < NotificationCooldown;
    }

    private static bool ShouldSendForUser(AppUser user, AlertEvent alert)
    {
        return alert.Type switch
        {
            AlertRuleType.PriceBelowTarget => user.NotifyTargetPrice,
            AlertRuleType.BackInStock => user.NotifyBackInStock,
            _ => true
        };
    }

    private Task<int> CountEmailsSentTodayAsync(Guid productId, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var dayStart = now.UtcDateTime.Date;
        var from = new DateTimeOffset(dayStart, TimeSpan.Zero);
        return dbContext.Notifications.CountAsync(
            notification => notification.ProductId == productId
                && notification.Channel == NotificationChannel.Email
                && notification.SentAt >= from,
            cancellationToken);
    }

    private static MonitorHealthStatus ResolveHealthStatus(Product product, ProductSnapshot snapshot)
    {
        if (snapshot.Source == StoreDetectionSource.Unknown)
        {
            return !string.IsNullOrWhiteSpace(product.PriceSelector)
                ? MonitorHealthStatus.SelectorNeedsUpdate
                : MonitorHealthStatus.RequiresJavaScript;
        }

        if (!string.IsNullOrWhiteSpace(product.PriceSelector) && snapshot.Source == StoreDetectionSource.SavedSelector && snapshot.Price is null)
        {
            return MonitorHealthStatus.SelectorNeedsUpdate;
        }

        if (snapshot.Price is not null)
        {
            return MonitorHealthStatus.Ok;
        }

        return MonitorHealthStatus.PriceNotFound;
    }

    private static string ResolveHealthMessage(MonitorHealthStatus status)
    {
        return status switch
        {
            MonitorHealthStatus.Ok => "Cena odczytana poprawnie.",
            MonitorHealthStatus.PriceNotFound => "Nie udalo sie odczytac ceny z dostepnych danych.",
            MonitorHealthStatus.SelectorNeedsUpdate => "Selektor ceny nie zwrocil poprawnej ceny.",
            MonitorHealthStatus.RequiresJavaScript => "Strona prawdopodobnie laduje cene przez JavaScript. Rozwaz Playwright.",
            MonitorHealthStatus.LastError => "Ostatnie sprawdzenie zakonczylo sie bledem.",
            MonitorHealthStatus.StoreBlocked => "Sklep zablokowal odczyt po stronie backendu. Uzyj danych z wtyczki albo sprawdz selektor z przegladarki.",
            _ => "Produkt nie byl jeszcze sprawdzany."
        };
    }

    private void AddCheckLog(Product product, MonitorHealthStatus status, string message, ProductSnapshot snapshot, DateTimeOffset checkedAt)
    {
        dbContext.ProductCheckLogs.Add(new ProductCheckLog
        {
            ProductId = product.Id,
            Level = status == MonitorHealthStatus.Ok ? ProductCheckLogLevel.Info : ProductCheckLogLevel.Warning,
            Status = status,
            Message = message,
            Details = $"Source: {snapshot.Source}; RawHash: {snapshot.RawHash}",
            Price = status == MonitorHealthStatus.Ok ? snapshot.Price : null,
            IsAvailable = snapshot.IsAvailable,
            Source = snapshot.Source,
            CheckedAt = checkedAt
        });
    }
}
