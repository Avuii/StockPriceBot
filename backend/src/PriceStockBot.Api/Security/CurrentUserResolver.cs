using Microsoft.EntityFrameworkCore;
using PriceStockBot.Core.Domain;
using PriceStockBot.Infrastructure.Data;
using PriceStockBot.Infrastructure.Security;

namespace PriceStockBot.Api.Security;

public static class CurrentUserResolver
{
    public static async Task<AppUser?> ResolveAsync(
        HttpContext httpContext,
        AppDbContext dbContext,
        SessionTokenService tokenService,
        CancellationToken cancellationToken)
    {
        var authorization = httpContext.Request.Headers.Authorization.ToString();
        if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var token = authorization["Bearer ".Length..].Trim();
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var tokenHash = tokenService.HashToken(token);
        var now = DateTimeOffset.UtcNow;
        var session = await dbContext.UserSessions
            .Include(item => item.User)
            .FirstOrDefaultAsync(item => item.TokenHash == tokenHash && item.ExpiresAt > now, cancellationToken);

        if (session is null)
        {
            return null;
        }

        session.LastSeenAt = now;
        return session.User;
    }
}
