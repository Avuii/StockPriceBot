using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Playwright;
using PriceStockBot.Core.Models;

namespace PriceStockBot.Infrastructure.Scraping;

public sealed class PlaywrightStoreRenderer(
    IConfiguration configuration,
    IHttpClientFactory clients,
    ILogger<PlaywrightStoreRenderer> logger)
{
    private static readonly HashSet<string> PreservedHeaders = new(StringComparer.OrdinalIgnoreCase)
    {
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Credentials",
        "Content-Security-Policy",
        "Cross-Origin-Resource-Policy",
        "X-Content-Type-Options"
    };

    private readonly SemaphoreSlim browserSlot = new(1);

    public async Task<ProductSnapshot?> TryExtractAsync(
        Uri url, Func<string, ProductSnapshot> extract, CancellationToken cancellationToken)
    {
        if (!string.Equals(configuration["Scraping:PlaywrightEnabled"], "true", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (!await browserSlot.WaitAsync(TimeSpan.FromSeconds(5), cancellationToken))
        {
            return null;
        }

        try
        {
            using var budget = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            budget.CancelAfter(TimeSpan.FromSeconds(20));
            using var playwright = await Playwright.CreateAsync();
            await using var browser = await playwright.Chromium.LaunchAsync(new()
            {
                Headless = true,
                Timeout = 8_000,
                // Requests that bypass interception have no direct network route.
                Proxy = new() { Server = "http://127.0.0.1:1", Bypass = "<-loopback>" },
                Args = ["--disable-quic", "--force-webrtc-ip-handling-policy=disable_non_proxied_udp"]
            });
            await using var context = await browser.NewContextAsync(new() { ServiceWorkers = ServiceWorkerPolicy.Block });
            using var client = clients.CreateClient(nameof(ProductScraper));
            var remainingRequests = 60;
            await context.RouteAsync("**/*", async route =>
            {
                if (Interlocked.Decrement(ref remainingRequests) < 0
                    || route.Request.Method != "GET"
                    || route.Request.ResourceType is "image" or "font" or "media"
                    || !Uri.TryCreate(route.Request.Url, UriKind.Absolute, out var target)
                    || !PublicStoreHttp.CanFetch(target))
                {
                    await route.AbortAsync();
                    return;
                }

                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Get, target);
                    ProductScraper.ConfigureBrowserHeaders(request);
                    if (route.Request.Headers.TryGetValue("accept", out var accept))
                    {
                        request.Headers.Remove("Accept");
                        request.Headers.TryAddWithoutValidation("Accept", accept);
                    }
                    if (route.Request.Headers.TryGetValue("origin", out var origin))
                    {
                        request.Headers.TryAddWithoutValidation("Origin", origin);
                    }

                    using var response = await client.SendAsync(request, budget.Token);
                    await route.FulfillAsync(new()
                    {
                        Status = (int)response.StatusCode,
                        BodyBytes = await response.Content.ReadAsByteArrayAsync(budget.Token),
                        ContentType = response.Content.Headers.ContentType?.ToString(),
                        Headers = response.Headers.Where(header => PreservedHeaders.Contains(header.Key))
                            .ToDictionary(header => header.Key, header => string.Join(", ", header.Value))
                    });
                }
                catch (Exception exception) when (exception is HttpRequestException or OperationCanceledException)
                {
                    await route.AbortAsync();
                }
            });

            var page = await context.NewPageAsync();
            page.SetDefaultTimeout(8_000);
            var navigation = await page.GotoAsync(url.AbsoluteUri, new() { WaitUntil = WaitUntilState.DOMContentLoaded })
                .WaitAsync(budget.Token);
            if (navigation?.Ok != true)
            {
                return null;
            }

            while (!budget.IsCancellationRequested)
            {
                var snapshot = extract(await page.ContentAsync().WaitAsync(budget.Token));
                if (snapshot.Price is not null)
                {
                    return snapshot;
                }

                await Task.Delay(500, budget.Token);
            }
        }
        catch (Exception exception) when (!cancellationToken.IsCancellationRequested &&
            exception is PlaywrightException or TimeoutException or OperationCanceledException)
        {
            logger.LogDebug(exception, "Browser fallback did not extract a price for {Host}", url.Host);
        }
        finally
        {
            browserSlot.Release();
        }

        cancellationToken.ThrowIfCancellationRequested();
        return null;
    }
}
