using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PriceStockBot.Api.Security;
using PriceStockBot.Infrastructure.Configuration;
using PriceStockBot.Infrastructure.Data;
using PriceStockBot.Infrastructure.Notifications;
using PriceStockBot.Infrastructure.Security;
using System.Security.Cryptography;
using System.Text;

namespace PriceStockBot.Api.Endpoints;

public static class PushEndpoints
{
    public static void MapPushEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/account/push");

        group.MapGet("/key", (IOptions<WebPushOptions> options) =>
            Results.Ok(new { publicKey = options.Value.IsConfigured ? options.Value.PublicKey : null }));

        group.MapPut("/subscription", async (SubscriptionRequest request, HttpContext http,
            AppDbContext db, SessionTokenService tokens, IOptions<WebPushOptions> options, CancellationToken token) =>
        {
            var user = await CurrentUserResolver.ResolveAsync(http, db, tokens, token);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            if (!options.Value.IsConfigured)
            {
                return Results.Problem("Web push is not configured.", statusCode: 503);
            }

            if (!WebPushNotificationSender.IsBrowserEndpoint(request.Endpoint)
                || !IsKey(request.P256dh, 65, 4) || !IsKey(request.Auth, 16))
            {
                return Results.BadRequest(new { error = "Invalid browser push subscription." });
            }

            var endpoint = request.Endpoint!;
            var updated = await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "BrowserPushSubscriptions" ("EndpointHash", "UserId", "Endpoint", "P256dh", "Auth")
                VALUES ({Hash(endpoint)}, {user.Id}, {endpoint}, {request.P256dh}, {request.Auth})
                ON CONFLICT ("EndpointHash") DO UPDATE SET
                    "UserId" = EXCLUDED."UserId", "P256dh" = EXCLUDED."P256dh", "Auth" = EXCLUDED."Auth"
                WHERE "BrowserPushSubscriptions"."UserId" = EXCLUDED."UserId"
                   OR ("BrowserPushSubscriptions"."P256dh" = EXCLUDED."P256dh"
                       AND "BrowserPushSubscriptions"."Auth" = EXCLUDED."Auth")
                """, token);

            return updated > 0 ? Results.NoContent() : Results.Conflict(new { error = "Push endpoint is already registered." });
        });

        group.MapDelete("/subscription", async ([Microsoft.AspNetCore.Mvc.FromBody] RemoveSubscriptionRequest request, HttpContext http, AppDbContext db,
            SessionTokenService tokens, CancellationToken token) =>
        {
            var user = await CurrentUserResolver.ResolveAsync(http, db, tokens, token);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            if (request.Endpoint is not { Length: > 0 and <= 2048 } endpoint)
            {
                return Results.BadRequest();
            }

            var hash = Hash(endpoint);
            await db.BrowserPushSubscriptions.Where(item => item.UserId == user.Id && item.EndpointHash == hash)
                .ExecuteDeleteAsync(token);
            return Results.NoContent();
        });
    }

    private static string Hash(string endpoint) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(endpoint)));

    private static bool IsKey(string? key, int length, byte? prefix = null)
    {
        if (key is null || key.Length != (length * 8 + 5) / 6
            || key.Any(character => !char.IsAsciiLetterOrDigit(character) && character is not ('_' or '-')))
        {
            return false;
        }

        var bytes = Convert.FromBase64String(key.Replace('-', '+').Replace('_', '/').PadRight((key.Length + 3) / 4 * 4, '='));
        return bytes.Length == length && (prefix is null || bytes[0] == prefix);
    }

    public sealed record RemoveSubscriptionRequest(string? Endpoint);
    public sealed record SubscriptionRequest(string? Endpoint, string? P256dh, string? Auth);
}
