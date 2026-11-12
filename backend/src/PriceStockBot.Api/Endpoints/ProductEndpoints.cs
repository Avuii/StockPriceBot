using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PriceStockBot.Api.Hubs;
using PriceStockBot.Api.Security;
using PriceStockBot.Core.Domain;
using PriceStockBot.Core.Ports;
using PriceStockBot.Infrastructure.Data;
using PriceStockBot.Infrastructure.Scraping;
using PriceStockBot.Infrastructure.Security;

namespace PriceStockBot.Api.Endpoints;

public static class ProductEndpoints
{
    private const int MaxNameLength = 300;
    private const int MaxUrlLength = 2048;
    private const int MaxShopNameLength = 120;
    private const int MaxImageUrlLength = 2048;
    private const int MaxCurrencyLength = 8;
    private const int MaxSizeLength = 80;
    private const int MaxColorLength = 120;
    private const int MaxSelectorLength = 500;
    private const int MaxRawHashLength = 128;
    private const int MaxCategoryNameLength = 120;
    private const int MaxNoteLength = 1000;

    public static IEndpointRouteBuilder MapProductEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/products").WithTags("Products");

        group.MapGet("/", async (
            HttpContext httpContext,
            AppDbContext dbContext,
            SessionTokenService tokenService,
            CancellationToken cancellationToken) =>
        {
            var user = await CurrentUserResolver.ResolveAsync(httpContext, dbContext, tokenService, cancellationToken);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            var products = await dbContext.Products
                .Include(product => product.Category)
                .Include(product => product.PriceHistory.OrderByDescending(history => history.CheckedAt).Take(120))
                .Where(product => product.UserId == user.Id)
                .OrderByDescending(product => product.CreatedAt)
                .ToListAsync(cancellationToken);

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(products.Select(ProductResponse.FromEntity));
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            HttpContext httpContext,
            AppDbContext dbContext,
            SessionTokenService tokenService,
            CancellationToken cancellationToken) =>
        {
            var user = await CurrentUserResolver.ResolveAsync(httpContext, dbContext, tokenService, cancellationToken);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            var product = await dbContext.Products
                .Include(item => item.Category)
                .Include(item => item.AlertRules)
                .Include(item => item.PriceHistory.OrderByDescending(history => history.CheckedAt).Take(120))
                .Include(item => item.Notifications.OrderByDescending(notification => notification.SentAt).Take(80))
                .Include(item => item.CheckLogs.OrderByDescending(log => log.CheckedAt).Take(80))
                .FirstOrDefaultAsync(item => item.Id == id && item.UserId == user.Id, cancellationToken);

            await dbContext.SaveChangesAsync(cancellationToken);
            return product is null
                ? Results.NotFound()
                : Results.Ok(ProductDetailResponse.FromEntity(product));
        });

        group.MapPost("/", async (
            CreateProductRequest request,
            HttpContext httpContext,
            AppDbContext dbContext,
            SessionTokenService tokenService,
            IHubContext<PriceUpdatesHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var user = await CurrentUserResolver.ResolveAsync(httpContext, dbContext, tokenService, cancellationToken);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            if (!Uri.TryCreate(request.Url, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https"))
            {
                return Results.BadRequest(new { error = "A valid http(s) product URL is required." });
            }

            var normalizedUrl = uri.ToString();
            if (normalizedUrl.Length > MaxUrlLength)
            {
                return Results.BadRequest(new { error = "Product URL is too long." });
            }

            var category = await FindOrCreateCategoryAsync(dbContext, user.Id, request.CategoryName, cancellationToken);
            var now = DateTimeOffset.UtcNow;
            var product = new Product
            {
                UserId = user.Id,
                Name = CleanRequired(request.Name, uri.Host, MaxNameLength),
                Url = normalizedUrl,
                ShopName = CleanRequired(request.ShopName, uri.Host.Replace("www.", string.Empty), MaxShopNameLength),
                ImageUrl = CleanOptional(request.ImageUrl, MaxImageUrlLength),
                BasePrice = request.BasePrice ?? request.CurrentPrice,
                CurrentPrice = request.CurrentPrice,
                TargetPrice = request.TargetPrice,
                Currency = CleanCurrency(request.Currency),
                Size = CleanOptional(request.Size, MaxSizeLength),
                Color = CleanOptional(request.Color, MaxColorLength),
                Note = CleanOptional(request.Note, MaxNoteLength),
                IsAvailable = request.IsAvailable ?? true,
                TrackStock = request.TrackStock ?? true,
                IsActive = request.IsActive ?? true,
                IsBookmarked = request.IsBookmarked ?? false,
                CheckIntervalMinutes = Math.Clamp(request.CheckIntervalMinutes ?? user.DefaultCheckIntervalMinutes, 15, 1440),
                PriceSelector = CleanOptional(request.PriceSelector, MaxSelectorLength),
                StockSelector = CleanOptional(request.StockSelector, MaxSelectorLength),
                Category = category,
                LastCheckedAt = now,
                MonitoringStatus = request.CurrentPrice is not null ? MonitorHealthStatus.Ok : MonitorHealthStatus.Unknown,
                LastCheckMessage = request.CurrentPrice is not null ? "Produkt dodany z ceny odczytanej przez wtyczke." : "Produkt dodany bez ceny poczatkowej.",
                LastCheckSource = request.CurrentPrice is not null ? StoreDetectionSource.ExtensionPayload : StoreDetectionSource.Unknown,
                LastSuccessfulCheckAt = request.CurrentPrice is not null ? now : null,
                CreatedAt = now,
                UpdatedAt = now,
                LastRawHash = CleanOptional(request.RawHash, MaxRawHashLength)
            };

            ConfigureRules(product, user, request.TargetPrice, request.AlertOnPriceDrop, request.AlertOnBackInStock, request.PercentDrop, request.AlertOnAnyPriceChange);

            if (request.CurrentPrice is not null || request.IsAvailable is not null)
            {
                product.PriceHistory.Add(new PriceHistory
                {
                    Price = request.CurrentPrice,
                    Currency = product.Currency,
                    IsAvailable = product.IsAvailable,
                    CheckedAt = now,
                    RawHash = product.LastRawHash ?? string.Empty,
                    Source = StoreDetectionSource.ExtensionPayload
                });

                product.CheckLogs.Add(new ProductCheckLog
                {
                    Level = ProductCheckLogLevel.Info,
                    Status = MonitorHealthStatus.Ok,
                    Message = "Produkt dodany z danych odczytanych przez wtyczke.",
                    Price = request.CurrentPrice,
                    IsAvailable = product.IsAvailable,
                    Source = StoreDetectionSource.ExtensionPayload,
                    CheckedAt = now
                });
            }

            dbContext.Products.Add(product);
            await dbContext.SaveChangesAsync(cancellationToken);
            await hubContext.Clients.All.SendAsync("productCreated", ProductResponse.FromEntity(product), cancellationToken);

            return Results.Created($"/api/products/{product.Id}", ProductResponse.FromEntity(product));
        });

        group.MapPatch("/{id:guid}", async (
            Guid id,
            UpdateProductRequest request,
            HttpContext httpContext,
            AppDbContext dbContext,
            SessionTokenService tokenService,
            IHubContext<PriceUpdatesHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var user = await CurrentUserResolver.ResolveAsync(httpContext, dbContext, tokenService, cancellationToken);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            var product = await dbContext.Products
                .Include(item => item.AlertRules)
                .Include(item => item.Category)
                .FirstOrDefaultAsync(item => item.Id == id && item.UserId == user.Id, cancellationToken);

            if (product is null)
            {
                return Results.NotFound();
            }

            Uri? uri = null;
            if (!string.IsNullOrWhiteSpace(request.Url) && (!Uri.TryCreate(request.Url, UriKind.Absolute, out uri) || uri.Scheme is not ("http" or "https")))
            {
                return Results.BadRequest(new { error = "A valid http(s) product URL is required." });
            }

            var normalizedUrl = uri?.ToString();
            if (normalizedUrl?.Length > MaxUrlLength)
            {
                return Results.BadRequest(new { error = "Product URL is too long." });
            }

            product.Name = CleanOptional(request.Name, MaxNameLength) ?? product.Name;
            product.Url = normalizedUrl ?? product.Url;
            product.ShopName = CleanOptional(request.ShopName, MaxShopNameLength) ?? product.ShopName;
            product.ImageUrl = request.ImageUrl is null ? product.ImageUrl : CleanOptional(request.ImageUrl, MaxImageUrlLength);
            product.BasePrice = request.BasePrice;
            product.CurrentPrice = request.CurrentPrice;
            product.TargetPrice = request.TargetPrice;
            product.Currency = string.IsNullOrWhiteSpace(request.Currency) ? product.Currency : CleanCurrency(request.Currency);
            product.Size = CleanOptional(request.Size, MaxSizeLength);
            product.Color = CleanOptional(request.Color, MaxColorLength);
            product.Note = CleanOptional(request.Note, MaxNoteLength);
            product.IsAvailable = request.IsAvailable;
            product.TrackStock = request.TrackStock;
            product.IsActive = request.IsActive;
            product.IsBookmarked = request.IsBookmarked ?? product.IsBookmarked;
            product.CheckIntervalMinutes = Math.Clamp(request.CheckIntervalMinutes, 15, 1440);
            product.PriceSelector = CleanOptional(request.PriceSelector, MaxSelectorLength);
            product.StockSelector = CleanOptional(request.StockSelector, MaxSelectorLength);
            product.Category = await FindOrCreateCategoryAsync(dbContext, user.Id, request.CategoryName, cancellationToken);
            product.UpdatedAt = DateTimeOffset.UtcNow;

            EnsurePriceRule(product);
            EnsureStockRule(product);
            EnsurePercentRule(product, request.PercentDrop ?? user.MinimumDiscountPercent);

            await dbContext.SaveChangesAsync(cancellationToken);
            var response = ProductResponse.FromEntity(product);
            await hubContext.Clients.All.SendAsync("productUpdated", response, cancellationToken);
            return Results.Ok(response);
        });

        group.MapDelete("/{id:guid}", async (
            Guid id,
            HttpContext httpContext,
            AppDbContext dbContext,
            SessionTokenService tokenService,
            IHubContext<PriceUpdatesHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var user = await CurrentUserResolver.ResolveAsync(httpContext, dbContext, tokenService, cancellationToken);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            var product = await dbContext.Products.FirstOrDefaultAsync(item => item.Id == id && item.UserId == user.Id, cancellationToken);
            if (product is null)
            {
                return Results.NotFound();
            }

            dbContext.Products.Remove(product);
            await dbContext.SaveChangesAsync(cancellationToken);
            await hubContext.Clients.All.SendAsync("productDeleted", id, cancellationToken);
            return Results.NoContent();
        });

        group.MapGet("/{id:guid}/history", async (
            Guid id,
            HttpContext httpContext,
            AppDbContext dbContext,
            SessionTokenService tokenService,
            CancellationToken cancellationToken) =>
        {
            var user = await CurrentUserResolver.ResolveAsync(httpContext, dbContext, tokenService, cancellationToken);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            var product = await dbContext.Products
                .Where(item => item.Id == id && item.UserId == user.Id)
                .Select(item => new { item.Id, item.CurrentPrice })
                .FirstOrDefaultAsync(cancellationToken);
            if (product is null)
            {
                return Results.NotFound();
            }

            var historyRows = await dbContext.PriceHistory
                .Where(item => item.ProductId == id)
                .OrderBy(item => item.CheckedAt)
                .Take(500)
                .ToListAsync(cancellationToken);

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(PriceHistoryResponse.FromHistory(historyRows, product.CurrentPrice));
        });

        group.MapPost("/{id:guid}/check", async (
            Guid id,
            HttpContext httpContext,
            IProductCheckService checker,
            AppDbContext dbContext,
            SessionTokenService tokenService,
            IHubContext<PriceUpdatesHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var user = await CurrentUserResolver.ResolveAsync(httpContext, dbContext, tokenService, cancellationToken);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            var exists = await dbContext.Products.AnyAsync(item => item.Id == id && item.UserId == user.Id, cancellationToken);
            if (!exists)
            {
                return Results.NotFound();
            }

            await checker.CheckProductAsync(id, cancellationToken);
            var product = await dbContext.Products.Include(item => item.Category).FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
            if (product is null)
            {
                return Results.NotFound();
            }

            var response = ProductResponse.FromEntity(product);
            await hubContext.Clients.All.SendAsync("productChecked", response, cancellationToken);
            return Results.Ok(response);
        });

        group.MapPost("/preview", async (
            ProductPreviewRequest request,
            HttpContext httpContext,
            ProductScraper scraper,
            AppDbContext dbContext,
            SessionTokenService tokenService,
            CancellationToken cancellationToken) =>
        {
            var user = await CurrentUserResolver.ResolveAsync(httpContext, dbContext, tokenService, cancellationToken);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            if (!Uri.TryCreate(request.Url, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https"))
            {
                return Results.BadRequest(new { error = "A valid http(s) product URL is required." });
            }

            var snapshot = await scraper.ScrapeAsync(new Product
            {
                UserId = user.Id,
                Url = uri.ToString(),
                Name = string.Empty,
                ShopName = uri.Host.Replace("www.", string.Empty),
                PriceSelector = request.PriceSelector,
                StockSelector = request.StockSelector
            }, cancellationToken);

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(snapshot);
        });

        return app;
    }

    private static async Task<Category?> FindOrCreateCategoryAsync(AppDbContext dbContext, string userId, string? categoryName, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(categoryName))
        {
            return null;
        }

        var name = CleanOptional(categoryName, MaxCategoryNameLength);
        if (name is null)
        {
            return null;
        }

        var existing = await dbContext.Categories.FirstOrDefaultAsync(
            category => category.UserId == userId && category.Name == name,
            cancellationToken);

        if (existing is not null)
        {
            return existing;
        }

        var category = new Category { UserId = userId, Name = name };
        dbContext.Categories.Add(category);
        return category;
    }

    private static void ConfigureRules(
        Product product,
        AppUser user,
        decimal? targetPrice,
        bool? alertOnPriceDrop,
        bool? alertOnBackInStock,
        decimal? percentDrop,
        bool? alertOnAnyPriceChange)
    {
        if (targetPrice is not null && alertOnPriceDrop.GetValueOrDefault(true))
        {
            product.AlertRules.Add(new AlertRule
            {
                Type = AlertRuleType.PriceBelowTarget,
                TargetPrice = targetPrice
            });
        }

        if (product.TrackStock && alertOnBackInStock.GetValueOrDefault(user.NotifyBackInStock))
        {
            product.AlertRules.Add(new AlertRule { Type = AlertRuleType.BackInStock });
        }

        var drop = percentDrop ?? user.MinimumDiscountPercent;
        if (drop > 0)
        {
            product.AlertRules.Add(new AlertRule
            {
                Type = AlertRuleType.PercentDrop,
                PercentDrop = drop
            });
        }

        if (alertOnAnyPriceChange.GetValueOrDefault(false))
        {
            product.AlertRules.Add(new AlertRule { Type = AlertRuleType.AnyPriceChange });
        }
    }

    private static void EnsurePriceRule(Product product)
    {
        var rule = product.AlertRules.FirstOrDefault(candidate => candidate.Type == AlertRuleType.PriceBelowTarget);
        if (product.TargetPrice is null)
        {
            if (rule is not null)
            {
                rule.IsActive = false;
            }
            return;
        }

        if (rule is null)
        {
            product.AlertRules.Add(new AlertRule
            {
                Type = AlertRuleType.PriceBelowTarget,
                TargetPrice = product.TargetPrice
            });
            return;
        }

        rule.TargetPrice = product.TargetPrice;
        rule.IsActive = true;
    }

    private static void EnsureStockRule(Product product)
    {
        var rule = product.AlertRules.FirstOrDefault(candidate => candidate.Type == AlertRuleType.BackInStock);
        if (product.TrackStock && rule is null)
        {
            product.AlertRules.Add(new AlertRule { Type = AlertRuleType.BackInStock });
        }
        else if (rule is not null)
        {
            rule.IsActive = product.TrackStock;
        }
    }

    private static void EnsurePercentRule(Product product, decimal percentDrop)
    {
        var rule = product.AlertRules.FirstOrDefault(candidate => candidate.Type == AlertRuleType.PercentDrop);
        if (percentDrop <= 0)
        {
            if (rule is not null)
            {
                rule.IsActive = false;
            }
            return;
        }

        if (rule is null)
        {
            product.AlertRules.Add(new AlertRule
            {
                Type = AlertRuleType.PercentDrop,
                PercentDrop = percentDrop
            });
            return;
        }

        rule.PercentDrop = percentDrop;
        rule.IsActive = true;
    }

    private static string CleanRequired(string? value, string fallback, int maxLength) =>
        CleanOptional(value, maxLength) ?? TrimToMax(fallback.Trim(), maxLength);

    private static string CleanCurrency(string? value) =>
        TrimToMax(string.IsNullOrWhiteSpace(value) ? "PLN" : value.Trim().ToUpperInvariant(), MaxCurrencyLength);

    private static string? CleanOptional(string? value, int? maxLength = null)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        return maxLength is null ? trimmed : TrimToMax(trimmed, maxLength.Value);
    }

    private static string TrimToMax(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength].TrimEnd();
}

public sealed record CreateProductRequest(
    string? Name,
    string Url,
    string? ShopName,
    string? ImageUrl,
    decimal? BasePrice,
    decimal? CurrentPrice,
    decimal? TargetPrice,
    string? Currency,
    string? Size,
    string? Color,
    string? Note,
    bool? IsAvailable,
    bool? TrackStock,
    bool? IsActive,
    bool? IsBookmarked,
    bool? AlertOnPriceDrop,
    bool? AlertOnBackInStock,
    decimal? PercentDrop,
    bool? AlertOnAnyPriceChange,
    int? CheckIntervalMinutes,
    string? CategoryName,
    string? PriceSelector,
    string? StockSelector,
    string? RawHash);

public sealed record UpdateProductRequest(
    string? Name,
    string? Url,
    string? ShopName,
    string? ImageUrl,
    decimal? BasePrice,
    decimal? CurrentPrice,
    decimal? TargetPrice,
    string? Currency,
    string? Size,
    string? Color,
    string? Note,
    bool IsAvailable,
    bool TrackStock,
    bool IsActive,
    bool? IsBookmarked,
    decimal? PercentDrop,
    int CheckIntervalMinutes,
    string? CategoryName,
    string? PriceSelector,
    string? StockSelector);

public sealed record ProductPreviewRequest(string Url, string? PriceSelector, string? StockSelector);

public sealed record ProductResponse(
    Guid Id,
    string Name,
    string Url,
    string ShopName,
    string? ImageUrl,
    decimal? BasePrice,
    decimal? CurrentPrice,
    decimal? TargetPrice,
    string Currency,
    string? Size,
    string? Color,
    string? Note,
    bool IsAvailable,
    DateTimeOffset? LastCheckedAt,
    int CheckIntervalMinutes,
    bool TrackStock,
    bool IsActive,
    bool IsBookmarked,
    string? CategoryName,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    decimal? DiscountPercent,
    decimal? DistanceToTarget,
    decimal? LowestHistoryPrice,
    decimal? AverageHistoryPrice,
    decimal? CurrentVsAveragePercent,
    int PriceHistoryCount,
    int DistinctHistoryPriceCount,
    bool HasPriceHistoryChange,
    bool IsCurrentLowestHistoricalPrice,
    decimal? LatestPriceDropAmount,
    decimal? LatestPriceDropPercent,
    bool HasRecentRestock,
    string MonitoringStatus,
    string? LastCheckMessage,
    string? LastCheckError,
    string LastCheckSource,
    DateTimeOffset? LastSuccessfulCheckAt,
    string? PriceSelector,
    string? StockSelector)
{
    public static ProductResponse FromEntity(Product product) => new(
        product.Id,
        product.Name,
        product.Url,
        product.ShopName,
        product.ImageUrl,
        product.BasePrice,
        product.CurrentPrice,
        product.TargetPrice,
        product.Currency,
        product.Size,
        product.Color,
        product.Note,
        product.IsAvailable,
        product.LastCheckedAt,
        product.CheckIntervalMinutes,
        product.TrackStock,
        product.IsActive,
        product.IsBookmarked,
        product.Category?.Name,
        product.CreatedAt,
        product.UpdatedAt,
        CalculateDiscount(product),
        CalculateDistance(product),
        CalculateLowestPrice(product),
        CalculateAveragePrice(product),
        CalculateCurrentVsAverage(product),
        CountHistoryPrices(product),
        CountDistinctHistoryPrices(product),
        CalculateHasPriceHistoryChange(product),
        CalculateIsCurrentLowestHistoricalPrice(product),
        CalculateLatestPriceDropAmount(product),
        CalculateLatestPriceDropPercent(product),
        CalculateHasRecentRestock(product),
        product.MonitoringStatus.ToString(),
        product.LastCheckMessage,
        product.LastCheckError,
        product.LastCheckSource.ToString(),
        product.LastSuccessfulCheckAt,
        product.PriceSelector,
        product.StockSelector);

    private static decimal? CalculateDiscount(Product product)
    {
        if (product.BasePrice is null || product.CurrentPrice is null || product.BasePrice <= 0 || product.CurrentPrice >= product.BasePrice)
        {
            return null;
        }

        return Math.Round((product.BasePrice.Value - product.CurrentPrice.Value) / product.BasePrice.Value * 100m, 2);
    }

    private static decimal? CalculateDistance(Product product)
    {
        if (product.CurrentPrice is null || product.TargetPrice is null)
        {
            return null;
        }

        return Math.Round(product.CurrentPrice.Value - product.TargetPrice.Value, 2);
    }

    private static decimal? CalculateLowestPrice(Product product)
    {
        var prices = product.PriceHistory
            .Select(history => history.Price)
            .Where(price => price is > 0)
            .Select(price => price!.Value)
            .ToList();

        if (product.CurrentPrice is > 0)
        {
            prices.Add(product.CurrentPrice.Value);
        }

        return prices.Count == 0 ? null : Math.Round(prices.Min(), 2);
    }

    private static decimal? CalculateAveragePrice(Product product)
    {
        var prices = product.PriceHistory
            .Select(history => history.Price)
            .Where(price => price is > 0)
            .Select(price => price!.Value)
            .ToList();

        if (product.CurrentPrice is > 0)
        {
            prices.Add(product.CurrentPrice.Value);
        }

        return prices.Count == 0 ? null : Math.Round(prices.Average(), 2);
    }

    private static decimal? CalculateCurrentVsAverage(Product product)
    {
        var average = CalculateAveragePrice(product);
        if (average is null || average <= 0 || product.CurrentPrice is null)
        {
            return null;
        }

        return Math.Round((product.CurrentPrice.Value - average.Value) / average.Value * 100m, 2);
    }

    private static int CountHistoryPrices(Product product) => HistoricalPrices(product).Count;

    private static int CountDistinctHistoryPrices(Product product) => HistoricalPrices(product).Distinct().Count();

    private static bool CalculateHasPriceHistoryChange(Product product) => CountDistinctHistoryPrices(product) > 1;

    private static bool CalculateIsCurrentLowestHistoricalPrice(Product product)
    {
        var prices = HistoricalPrices(product);
        if (product.CurrentPrice is not > 0 || prices.Count < 2 || prices.Distinct().Count() < 2)
        {
            return false;
        }

        return product.CurrentPrice.Value <= prices.Min() + 0.01m;
    }

    private static decimal? CalculateLatestPriceDropAmount(Product product)
    {
        var prices = HistoricalPrices(product);
        if (prices.Count < 2)
        {
            return null;
        }

        var previous = prices[^2];
        var current = prices[^1];
        if (previous <= current)
        {
            return null;
        }

        return Math.Round(previous - current, 2);
    }

    private static decimal? CalculateLatestPriceDropPercent(Product product)
    {
        var prices = HistoricalPrices(product);
        if (prices.Count < 2)
        {
            return null;
        }

        var previous = prices[^2];
        var current = prices[^1];
        if (previous <= 0 || previous <= current)
        {
            return null;
        }

        return Math.Round((previous - current) / previous * 100m, 2);
    }

    private static bool CalculateHasRecentRestock(Product product)
    {
        var availability = product.PriceHistory
            .OrderBy(history => history.CheckedAt)
            .Select(history => history.IsAvailable)
            .ToList();

        if (!product.IsAvailable || availability.Count < 2)
        {
            return false;
        }

        return availability[^2] == false && availability[^1] == true;
    }

    private static List<decimal> HistoricalPrices(Product product) => product.PriceHistory
        .OrderBy(history => history.CheckedAt)
        .Select(history => history.Price)
        .Where(price => price is > 0)
        .Select(price => price!.Value)
        .ToList();
}

public sealed record ProductDetailResponse(
    ProductResponse Product,
    IReadOnlyList<AlertRuleResponse> AlertRules,
    IReadOnlyList<PriceHistoryResponse> History,
    IReadOnlyList<NotificationResponse> Notifications,
    IReadOnlyList<ProductCheckLogResponse> CheckLogs)
{
    public static ProductDetailResponse FromEntity(Product product) => new(
        ProductResponse.FromEntity(product),
        product.AlertRules
            .OrderBy(rule => rule.Type)
            .Select(rule => new AlertRuleResponse(rule.Id, rule.Type.ToString(), rule.TargetPrice, rule.PercentDrop, rule.IsActive, rule.LastTriggeredAt))
            .ToList(),
        PriceHistoryResponse.FromHistory(product.PriceHistory, product.CurrentPrice),
        product.Notifications
            .OrderByDescending(notification => notification.SentAt)
            .Select(notification => new NotificationResponse(notification.Id, notification.Type.ToString(), notification.Channel.ToString(), notification.Message, notification.SentAt))
            .ToList(),
        product.CheckLogs
            .OrderByDescending(log => log.CheckedAt)
            .Select(log => new ProductCheckLogResponse(log.Id, log.Level.ToString(), log.Status.ToString(), log.Message, log.Details, log.Price, log.IsAvailable, log.Source.ToString(), log.CheckedAt))
            .ToList());
}

public sealed record AlertRuleResponse(
    Guid Id,
    string Type,
    decimal? TargetPrice,
    decimal? PercentDrop,
    bool IsActive,
    DateTimeOffset? LastTriggeredAt);

public sealed record PriceHistoryResponse(
    decimal? Price,
    string Currency,
    bool IsAvailable,
    DateTimeOffset CheckedAt,
    string Source)
{
    public static IReadOnlyList<PriceHistoryResponse> FromHistory(IEnumerable<PriceHistory> history, decimal? fallbackPrice)
    {
        decimal? lastKnownPrice = null;
        var rows = new List<PriceHistoryResponse>();

        foreach (var item in history.OrderBy(item => item.CheckedAt))
        {
            if (item.Price is > 0)
            {
                lastKnownPrice = item.Price;
            }

            rows.Add(new PriceHistoryResponse(
                item.Price ?? lastKnownPrice ?? fallbackPrice,
                item.Currency,
                item.IsAvailable,
                item.CheckedAt,
                item.Source.ToString()));
        }

        return rows;
    }
}

public sealed record NotificationResponse(
    Guid Id,
    string Type,
    string Channel,
    string Message,
    DateTimeOffset SentAt);

public sealed record ProductCheckLogResponse(
    Guid Id,
    string Level,
    string Status,
    string Message,
    string? Details,
    decimal? Price,
    bool? IsAvailable,
    string Source,
    DateTimeOffset CheckedAt);
