using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PriceStockBot.Core.Domain;
using PriceStockBot.Core.Models;
using PriceStockBot.Core.Ports;
using PriceStockBot.Infrastructure.Configuration;

namespace PriceStockBot.Infrastructure.Notifications;

public sealed class EmailNotificationSender(
    IOptions<EmailOptions> options,
    ILogger<EmailNotificationSender> logger) : INotificationSender
{
    public NotificationChannel Channel => NotificationChannel.Email;

    public async Task<bool> SendAsync(AppUser user, Product product, AlertEvent alert, CancellationToken cancellationToken)
    {
        var email = ResolveSettings(user);
        var recipient = ResolveRecipient(user);

        if (!CanSend(email, user.EmailNotificationsEnabled, recipient))
        {
            logger.LogInformation(
                "Email notification skipped for product {ProductId}. Enabled: {Enabled}, UserEnabled: {UserEnabled}, SmtpConfigured: {SmtpConfigured}, RecipientConfigured: {RecipientConfigured}.",
                product.Id,
                email.Enabled,
                user.EmailNotificationsEnabled,
                !string.IsNullOrWhiteSpace(email.SmtpHost),
                !string.IsNullOrWhiteSpace(recipient));
            return false;
        }

        if (!TryCreateMailAddress(recipient!, out var recipientAddress))
        {
            logger.LogWarning("Email notification skipped for product {ProductId} because alert recipient {Recipient} is invalid.", product.Id, recipient);
            return false;
        }

        if (!TryCreateMailAddress(email.FromEmail, out var senderAddress))
        {
            logger.LogWarning("Email notification skipped for product {ProductId} because sender address {Sender} is invalid.", product.Id, email.FromEmail);
            return false;
        }

        using var message = CreateMessage(
            email,
            senderAddress,
            recipientAddress,
            $"PriceStockBot: {product.Name}",
            BuildBody(product, alert));

        if (await SendMailAsync(email, message, cancellationToken))
        {
            logger.LogInformation("Email alert for product {ProductId} sent to {Recipient}.", product.Id, recipientAddress.Address);
            return true;
        }

        logger.LogWarning("Email alert for product {ProductId} could not be sent to {Recipient}.", product.Id, recipientAddress.Address);
        return false;
    }

    public async Task<EmailTestResult> SendTestAsync(AppUser user, CancellationToken cancellationToken)
    {
        var email = ResolveSettings(user);
        var recipient = ResolveRecipient(user);

        if (!CanSend(email, user.EmailNotificationsEnabled, recipient))
        {
            return new EmailTestResult(
                false,
                !user.EmailNotificationsEnabled
                    ? "Powiadomienia email sa wylaczone w ustawieniach konta."
                    : "Brakuje konfiguracji nadawcy SMTP po stronie aplikacji albo adresu odbiorcy alertow.");
        }

        if (!TryCreateMailAddress(recipient!, out var recipientAddress))
        {
            return new EmailTestResult(false, "Adres odbiorcy alertow jest niepoprawny.");
        }

        if (!TryCreateMailAddress(email.FromEmail, out var senderAddress))
        {
            return new EmailTestResult(false, "Adres nadawcy email jest niepoprawny.");
        }

        using var message = CreateMessage(
            email,
            senderAddress,
            recipientAddress,
            "PriceStockBot: test powiadomien email",
            BuildTestBody(user));

        var sent = await SendMailAsync(email, message, cancellationToken);
        return sent
            ? new EmailTestResult(true, $"Wyslano testowy email na {recipientAddress.Address}.")
            : new EmailTestResult(false, "Nie udalo sie wyslac testowego emaila. Sprawdz konfiguracje EMAIL_* w .env i logi backendu.");
    }

    public async Task<bool> SendPasswordResetAsync(AppUser user, string resetUrl, CancellationToken cancellationToken)
    {
        var email = ResolveSettings(user);
        var recipient = user.Email;

        if (!CanSend(email, userEnabled: true, recipient))
        {
            logger.LogWarning("Password reset email skipped for user {UserId}. SMTP configured: {SmtpConfigured}.", user.Id, !string.IsNullOrWhiteSpace(email.SmtpHost));
            return false;
        }

        if (!TryCreateMailAddress(recipient, out var recipientAddress))
        {
            logger.LogWarning("Password reset email skipped because account email {Recipient} is invalid.", recipient);
            return false;
        }

        if (!TryCreateMailAddress(email.FromEmail, out var senderAddress))
        {
            logger.LogWarning("Password reset email skipped because sender address {Sender} is invalid.", email.FromEmail);
            return false;
        }

        using var message = CreateMessage(
            email,
            senderAddress,
            recipientAddress,
            "PriceStockBot: reset hasla",
            BuildPasswordResetBody(resetUrl));

        return await SendMailAsync(email, message, cancellationToken);
    }

    private ResolvedEmailSettings ResolveSettings(AppUser user)
    {
        var configured = options.Value;
        var fromEmail = Clean(configured.FromEmail) ?? Clean(configured.UserName) ?? "alerts@pricestockbot.local";
        var fromName = Clean(configured.FromName) ?? "PriceStockBot";

        return new ResolvedEmailSettings(
            configured.Enabled,
            configured.SmtpHost,
            configured.SmtpPort,
            configured.UserName,
            configured.Password,
            fromEmail,
            fromName,
            configured.EnableSsl);
    }

    private static bool CanSend(ResolvedEmailSettings email, bool userEnabled, string? recipient)
    {
        return email.Enabled
            && userEnabled
            && !string.IsNullOrWhiteSpace(email.SmtpHost)
            && !string.IsNullOrWhiteSpace(recipient);
    }

    private static MailMessage CreateMessage(
        ResolvedEmailSettings email,
        MailAddress senderAddress,
        MailAddress recipientAddress,
        string subject,
        string body)
    {
        var message = new MailMessage
        {
            From = new MailAddress(senderAddress.Address, email.FromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = false
        };
        message.To.Add(recipientAddress);
        return message;
    }

    private async Task<bool> SendMailAsync(ResolvedEmailSettings email, MailMessage message, CancellationToken cancellationToken)
    {
        using var client = new SmtpClient(email.SmtpHost, email.SmtpPort)
        {
            EnableSsl = email.EnableSsl
        };

        if (!string.IsNullOrWhiteSpace(email.UserName))
        {
            client.Credentials = new NetworkCredential(email.UserName, email.Password);
        }

        try
        {
            await client.SendMailAsync(message, cancellationToken);
            return true;
        }
        catch (SmtpException exception)
        {
            logger.LogWarning(exception, "Email could not be sent to {Recipient}.", string.Join(", ", message.To.Select(address => address.Address)));
            return false;
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning(exception, "Email failed before it could be sent to {Recipient}.", string.Join(", ", message.To.Select(address => address.Address)));
            return false;
        }
    }

    private static string? ResolveRecipient(AppUser user)
    {
        return string.IsNullOrWhiteSpace(user.AlertEmail) ? user.Email : user.AlertEmail.Trim();
    }

    private static bool TryCreateMailAddress(string email, out MailAddress address)
    {
        try
        {
            address = new MailAddress(email);
            return address.Address.Equals(email, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            address = null!;
            return false;
        }
    }

    private static string BuildBody(Product product, AlertEvent alert)
    {
        var variant = string.Join(", ", new[] { product.Size, product.Color }.Where(value => !string.IsNullOrWhiteSpace(value)));
        if (string.IsNullOrWhiteSpace(variant))
        {
            variant = "brak wariantu";
        }

        return $"""
        {alert.Message}

        Produkt: {product.Name}
        Sklep: {product.ShopName}
        Wariant: {variant}
        Cena aktualna: {product.CurrentPrice:0.00} {product.Currency}
        Cena docelowa: {product.TargetPrice:0.00} {product.Currency}
        Status: {(product.IsAvailable ? "dostepny" : "niedostepny")}

        Link: {product.Url}
        """;
    }

    private static string BuildTestBody(AppUser user)
    {
        return $"""
        To jest test powiadomien email z PriceStockBot.

        Konto: {user.Email}
        Adres alertow: {ResolveRecipient(user)}

        Jesli widzisz ten email, konfiguracja SMTP dziala poprawnie.
        """;
    }

    private static string BuildPasswordResetBody(string resetUrl)
    {
        return $"""
        Otrzymalismy prosbe o reset hasla do konta PriceStockBot.

        Kliknij link ponizej, aby ustawic nowe haslo:
        {resetUrl}

        Link jest wazny przez 30 minut. Jesli to nie Ty prosilas/prosiles o reset, zignoruj te wiadomosc.
        """;
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private sealed record ResolvedEmailSettings(
        bool Enabled,
        string? SmtpHost,
        int SmtpPort,
        string? UserName,
        string? Password,
        string FromEmail,
        string FromName,
        bool EnableSsl);
}

public sealed record EmailTestResult(bool Success, string Message);
