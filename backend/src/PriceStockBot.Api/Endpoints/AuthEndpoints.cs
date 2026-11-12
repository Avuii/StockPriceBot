using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using PriceStockBot.Api.Security;
using PriceStockBot.Core.Domain;
using PriceStockBot.Infrastructure.Data;
using PriceStockBot.Infrastructure.Notifications;
using PriceStockBot.Infrastructure.Security;

namespace PriceStockBot.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/api/auth").WithTags("Auth");

        auth.MapPost("/register", async (
            AuthRequest request,
            AppDbContext dbContext,
            PasswordHasher passwordHasher,
            SessionTokenService tokenService,
            CancellationToken cancellationToken) =>
        {
            var email = NormalizeEmail(request.Email);
            if (!IsValidAuthRequest(email, request.Password, out var error))
            {
                return Results.BadRequest(new { error });
            }

            var exists = await dbContext.Users.AnyAsync(user => user.Email == email, cancellationToken);
            if (exists)
            {
                return Results.Conflict(new { error = "Account with this email already exists." });
            }

            var user = new AppUser
            {
                Email = email,
                PasswordHash = passwordHasher.Hash(request.Password),
                AlertEmail = email,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            dbContext.Users.Add(user);
            AddStarterCategories(dbContext, user.Id);
            var response = CreateSession(user, dbContext, tokenService);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Created("/api/auth/me", response);
        });

        auth.MapPost("/login", async (
            AuthRequest request,
            AppDbContext dbContext,
            PasswordHasher passwordHasher,
            SessionTokenService tokenService,
            CancellationToken cancellationToken) =>
        {
            var email = NormalizeEmail(request.Email);
            var user = await dbContext.Users.FirstOrDefaultAsync(item => item.Email == email, cancellationToken);
            if (user is null || !passwordHasher.Verify(request.Password, user.PasswordHash))
            {
                return Results.Unauthorized();
            }

            var response = CreateSession(user, dbContext, tokenService);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(response);
        });

        auth.MapPost("/forgot-password", async (
            ForgotPasswordRequest request,
            HttpContext httpContext,
            AppDbContext dbContext,
            SessionTokenService tokenService,
            EmailNotificationSender emailSender,
            CancellationToken cancellationToken) =>
        {
            var email = NormalizeEmail(request.Email);
            if (!IsValidEmail(email))
            {
                return Results.Ok(new PasswordResetResponse("Jesli konto istnieje, wyslalismy link resetu hasla."));
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(item => item.Email == email, cancellationToken);
            if (user is not null)
            {
                var resetToken = tokenService.CreateToken();
                user.PasswordResetTokenHash = tokenService.HashToken(resetToken);
                user.PasswordResetTokenExpiresAt = DateTimeOffset.UtcNow.AddMinutes(30);
                user.UpdatedAt = DateTimeOffset.UtcNow;
                await dbContext.SaveChangesAsync(cancellationToken);

                var resetUrl = BuildPasswordResetUrl(httpContext, email, resetToken);
                await emailSender.SendPasswordResetAsync(user, resetUrl, cancellationToken);
            }

            return Results.Ok(new PasswordResetResponse("Jesli konto istnieje, wyslalismy link resetu hasla."));
        });

        auth.MapPost("/reset-password", async (
            ResetPasswordRequest request,
            AppDbContext dbContext,
            PasswordHasher passwordHasher,
            SessionTokenService tokenService,
            CancellationToken cancellationToken) =>
        {
            var email = NormalizeEmail(request.Email);
            if (!IsValidAuthRequest(email, request.Password, out var error))
            {
                return Results.BadRequest(new { error });
            }

            if (string.IsNullOrWhiteSpace(request.Token))
            {
                return Results.BadRequest(new { error = "Link resetu hasla jest niepoprawny albo wygasl." });
            }

            var tokenHash = tokenService.HashToken(request.Token.Trim());
            var user = await dbContext.Users.FirstOrDefaultAsync(item => item.Email == email, cancellationToken);
            if (user is null
                || user.PasswordResetTokenHash != tokenHash
                || user.PasswordResetTokenExpiresAt is null
                || user.PasswordResetTokenExpiresAt <= DateTimeOffset.UtcNow)
            {
                return Results.BadRequest(new { error = "Link resetu hasla jest niepoprawny albo wygasl." });
            }

            user.PasswordHash = passwordHasher.Hash(request.Password);
            user.PasswordResetTokenHash = null;
            user.PasswordResetTokenExpiresAt = null;
            user.UpdatedAt = DateTimeOffset.UtcNow;

            var sessions = await dbContext.UserSessions.Where(session => session.UserId == user.Id).ToListAsync(cancellationToken);
            dbContext.UserSessions.RemoveRange(sessions);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new PasswordResetResponse("Haslo zostalo zmienione. Mozesz sie zalogowac."));
        });

        auth.MapGet("/me", async (
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

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(UserResponse.FromEntity(user));
        });

        auth.MapPost("/logout", async (
            HttpContext httpContext,
            AppDbContext dbContext,
            SessionTokenService tokenService,
            CancellationToken cancellationToken) =>
        {
            var authorization = httpContext.Request.Headers.Authorization.ToString();
            if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return Results.NoContent();
            }

            var tokenHash = tokenService.HashToken(authorization["Bearer ".Length..].Trim());
            var sessions = await dbContext.UserSessions.Where(item => item.TokenHash == tokenHash).ToListAsync(cancellationToken);
            dbContext.UserSessions.RemoveRange(sessions);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.NoContent();
        });

        return app;
    }

    public static IEndpointRouteBuilder MapAccountEndpoints(this IEndpointRouteBuilder app)
    {
        var account = app.MapGroup("/api/account").WithTags("Account");

        account.MapGet("/settings", async (
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

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(AccountSettingsResponse.FromEntity(user));
        });

        account.MapPatch("/settings", async (
            AccountSettingsRequest request,
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

            var alertEmail = string.IsNullOrWhiteSpace(request.AlertEmail) ? user.Email : NormalizeEmail(request.AlertEmail);
            if (!IsValidEmail(alertEmail))
            {
                return Results.BadRequest(new { error = "Podaj poprawny adres e-mail do alertow." });
            }

            var fromEmail = CleanOptional(request.EmailFromEmail);
            if (fromEmail is not null && !IsValidEmail(fromEmail))
            {
                return Results.BadRequest(new { error = "Podaj poprawny adres e-mail nadawcy." });
            }

            user.AlertEmail = alertEmail;
            user.EmailNotificationsEnabled = request.EmailNotificationsEnabled;
            user.EmailSmtpHost = CleanOptional(request.EmailSmtpHost);
            user.EmailSmtpPort = Math.Clamp(request.EmailSmtpPort ?? user.EmailSmtpPort, 1, 65535);
            user.EmailSmtpUserName = CleanOptional(request.EmailSmtpUserName);
            if (!string.IsNullOrWhiteSpace(request.EmailSmtpPassword))
            {
                user.EmailSmtpPassword = request.EmailSmtpPassword.Trim();
            }
            user.EmailFromEmail = fromEmail;
            user.EmailFromName = CleanOptional(request.EmailFromName);
            user.EmailEnableSsl = request.EmailEnableSsl;
            user.MinimumDiscountPercent = Math.Clamp(request.MinimumDiscountPercent, 0m, 95m);
            user.NotifyOnlySelectedVariant = request.NotifyOnlySelectedVariant;
            user.NotifyBackInStock = request.NotifyBackInStock;
            user.NotifyTargetPrice = request.NotifyTargetPrice;
            user.MaxEmailsPerProductPerDay = Math.Clamp(request.MaxEmailsPerProductPerDay, 1, 24);
            var defaultCheckIntervalMinutes = Math.Clamp(request.DefaultCheckIntervalMinutes ?? user.DefaultCheckIntervalMinutes, 15, 1440);
            if (user.DefaultCheckIntervalMinutes != defaultCheckIntervalMinutes)
            {
                user.DefaultCheckIntervalMinutes = defaultCheckIntervalMinutes;
                await dbContext.Products
                    .Where(product => product.UserId == user.Id)
                    .ExecuteUpdateAsync(
                        setters => setters.SetProperty(product => product.CheckIntervalMinutes, defaultCheckIntervalMinutes),
                        cancellationToken);
            }
            user.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.Ok(AccountSettingsResponse.FromEntity(user));
        });

        account.MapPost("/settings/test-email", async (
            HttpContext httpContext,
            AppDbContext dbContext,
            SessionTokenService tokenService,
            EmailNotificationSender emailSender,
            CancellationToken cancellationToken) =>
        {
            var user = await CurrentUserResolver.ResolveAsync(httpContext, dbContext, tokenService, cancellationToken);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            var result = await emailSender.SendTestAsync(user, cancellationToken);
            return result.Success
                ? Results.Ok(result)
                : Results.BadRequest(result);
        });

        return app;
    }

    private static AuthResponse CreateSession(AppUser user, AppDbContext dbContext, SessionTokenService tokenService)
    {
        var token = tokenService.CreateToken();
        dbContext.UserSessions.Add(new UserSession
        {
            UserId = user.Id,
            User = user,
            TokenHash = tokenService.HashToken(token),
            CreatedAt = DateTimeOffset.UtcNow,
            LastSeenAt = DateTimeOffset.UtcNow,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(30)
        });

        return new AuthResponse(token, UserResponse.FromEntity(user));
    }

    private static void AddStarterCategories(AppDbContext dbContext, string userId)
    {
        var starterCategories = new[]
        {
            new Category { UserId = userId, Name = "Ubrania", IconName = "Shirt", ColorHex = "#38bdf8" },
            new Category { UserId = userId, Name = "Buty", IconName = "Footprints", ColorHex = "#8b5cf6" },
            new Category { UserId = userId, Name = "Elektronika", IconName = "Laptop", ColorHex = "#2563eb" },
            new Category { UserId = userId, Name = "Kosmetyki", IconName = "Sparkles", ColorHex = "#f43f5e" },
            new Category { UserId = userId, Name = "Dom", IconName = "Home", ColorHex = "#14b8a6" },
            new Category { UserId = userId, Name = "Ksiazki", IconName = "BookOpen", ColorHex = "#f97316" },
            new Category { UserId = userId, Name = "Inne", IconName = "Tag", ColorHex = "#64748b" }
        };

        dbContext.Categories.AddRange(starterCategories);
    }

    private static bool IsValidAuthRequest(string email, string password, out string error)
    {
        if (!IsValidEmail(email))
        {
            error = "Valid email is required.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
        {
            error = "Password must have at least 8 characters.";
            return false;
        }

        error = string.Empty;
        return true;
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            return new MailAddress(email).Address == email;
        }
        catch
        {
            return false;
        }
    }

    private static string NormalizeEmail(string? email) => (email ?? string.Empty).Trim().ToLowerInvariant();
    private static string? CleanOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string BuildPasswordResetUrl(HttpContext httpContext, string email, string token)
    {
        var origin = httpContext.Request.Headers.Origin.ToString();
        if (string.IsNullOrWhiteSpace(origin))
        {
            origin = $"{httpContext.Request.Scheme}://{httpContext.Request.Host}";
        }

        return $"{origin.TrimEnd('/')}/reset-password?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";
    }
}

public sealed record AuthRequest(string Email, string Password);
public sealed record ForgotPasswordRequest(string Email);
public sealed record ResetPasswordRequest(string Email, string Token, string Password);
public sealed record PasswordResetResponse(string Message);

public sealed record AuthResponse(string Token, UserResponse User);

public sealed record UserResponse(
    string Id,
    string Email,
    string? AlertEmail,
    bool EmailNotificationsEnabled,
    string? EmailSmtpHost,
    int EmailSmtpPort,
    string? EmailSmtpUserName,
    bool EmailSmtpPasswordConfigured,
    string? EmailFromEmail,
    string? EmailFromName,
    bool EmailEnableSsl,
    decimal MinimumDiscountPercent,
    bool NotifyOnlySelectedVariant,
    bool NotifyBackInStock,
    bool NotifyTargetPrice,
    int MaxEmailsPerProductPerDay,
    int DefaultCheckIntervalMinutes)
{
    public static UserResponse FromEntity(AppUser user) => new(
        user.Id,
        user.Email,
        user.AlertEmail,
        user.EmailNotificationsEnabled,
        user.EmailSmtpHost,
        user.EmailSmtpPort,
        user.EmailSmtpUserName,
        !string.IsNullOrWhiteSpace(user.EmailSmtpPassword),
        user.EmailFromEmail,
        user.EmailFromName,
        user.EmailEnableSsl,
        user.MinimumDiscountPercent,
        user.NotifyOnlySelectedVariant,
        user.NotifyBackInStock,
        user.NotifyTargetPrice,
        user.MaxEmailsPerProductPerDay,
        user.DefaultCheckIntervalMinutes);
}

public sealed record AccountSettingsRequest(
    string? AlertEmail,
    bool EmailNotificationsEnabled,
    string? EmailSmtpHost,
    int? EmailSmtpPort,
    string? EmailSmtpUserName,
    string? EmailSmtpPassword,
    string? EmailFromEmail,
    string? EmailFromName,
    bool EmailEnableSsl,
    decimal MinimumDiscountPercent,
    bool NotifyOnlySelectedVariant,
    bool NotifyBackInStock,
    bool NotifyTargetPrice,
    int MaxEmailsPerProductPerDay,
    int? DefaultCheckIntervalMinutes);

public sealed record AccountSettingsResponse(
    string? AlertEmail,
    bool EmailNotificationsEnabled,
    string? EmailSmtpHost,
    int EmailSmtpPort,
    string? EmailSmtpUserName,
    bool EmailSmtpPasswordConfigured,
    string? EmailFromEmail,
    string? EmailFromName,
    bool EmailEnableSsl,
    decimal MinimumDiscountPercent,
    bool NotifyOnlySelectedVariant,
    bool NotifyBackInStock,
    bool NotifyTargetPrice,
    int MaxEmailsPerProductPerDay,
    int DefaultCheckIntervalMinutes)
{
    public static AccountSettingsResponse FromEntity(AppUser user) => new(
        user.AlertEmail,
        user.EmailNotificationsEnabled,
        user.EmailSmtpHost,
        user.EmailSmtpPort,
        user.EmailSmtpUserName,
        !string.IsNullOrWhiteSpace(user.EmailSmtpPassword),
        user.EmailFromEmail,
        user.EmailFromName,
        user.EmailEnableSsl,
        user.MinimumDiscountPercent,
        user.NotifyOnlySelectedVariant,
        user.NotifyBackInStock,
        user.NotifyTargetPrice,
        user.MaxEmailsPerProductPerDay,
        user.DefaultCheckIntervalMinutes);
}
