using Microsoft.EntityFrameworkCore;
using PriceStockBot.Api.Security;
using PriceStockBot.Infrastructure.Data;
using PriceStockBot.Infrastructure.Security;

namespace PriceStockBot.Api.Endpoints;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/dashboard/stats", async (
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

            var now = DateTimeOffset.UtcNow;
            var products = dbContext.Products.Where(product => product.UserId == user.Id);
            var total = await products.CountAsync(cancellationToken);
            var available = await products.CountAsync(product => product.IsAvailable, cancellationToken);
            var belowThreshold = await dbContext.Products.CountAsync(
                product => product.UserId == user.Id && product.TargetPrice != null && product.CurrentPrice != null && product.CurrentPrice <= product.TargetPrice,
                cancellationToken);
            var alerts24h = await dbContext.Notifications.CountAsync(
                notification => notification.Product.UserId == user.Id && notification.SentAt >= now.AddHours(-24),
                cancellationToken);

            return Results.Ok(new DashboardStatsResponse(total, available, belowThreshold, alerts24h));
        }).WithTags("Dashboard");

        return app;
    }
}

public sealed record DashboardStatsResponse(
    int WatchedProducts,
    int AvailableProducts,
    int BelowThresholdProducts,
    int AlertsLast24Hours);
