using System.Collections.Concurrent;
using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Playwright;
using static Microsoft.Playwright.Assertions;

namespace PriceStockBot.Tests;

public sealed class BrowserWorkflowTests
{
    private const string Origin = "http://localhost:5080";
    private static string Repository => FindRepository();

    [BrowserFact]
    public async Task Dashboard_ImportsOffers_ComparesPrices_AndManagesBrowserPush()
    {
        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync();
        await using var context = await browser.NewContextAsync(new() { ViewportSize = new() { Width = 1440, Height = 960 } });
        await context.AddInitScriptAsync("""
            localStorage.setItem('pricestockbot.token', 'test-token');
            localStorage.setItem('pricestockbot.language', 'en');
            let subscription = null;
            const endpoint = 'https://fcm.googleapis.com/fcm/send/test';
            const registration = { pushManager: {
                getSubscription: async () => subscription,
                subscribe: async () => subscription = {
                    endpoint,
                    toJSON: () => ({ endpoint, keys: { p256dh: 'fixture-key', auth: 'fixture-auth' } }),
                    unsubscribe: async () => { subscription = null; return true; }
                }
            }};
            Object.defineProperty(navigator, 'serviceWorker', { value: {
                getRegistration: async () => registration,
                register: async () => registration,
                ready: Promise.resolve(registration)
            }});
            Notification.requestPermission = async () => 'granted';
            """);

        var imported = new ConcurrentDictionary<string, JsonElement>();
        var attempts = 0;
        var pushRequests = new ConcurrentQueue<(string Method, string? Body)>();
        var pushConfigured = false;
        await context.RouteAsync("**/*", async route =>
        {
            var uri = new Uri(route.Request.Url);
            if (uri.GetLeftPart(UriPartial.Authority) != Origin)
            {
                await route.AbortAsync();
                return;
            }

            switch (uri.AbsolutePath)
            {
                case "/api/auth/me":
                    await Json(route, new { id = "test", email = "test@example.test" });
                    break;
                case "/api/dashboard/stats":
                    await Json(route, new { watchedProducts = imported.Count, availableProducts = imported.Count,
                        belowThresholdProducts = 0, alertsLast24Hours = 0 });
                    break;
                case "/api/categories":
                    await Json(route, Array.Empty<object>());
                    break;
                case "/api/account/settings":
                    await Json(route, new { notifyBackInStock = true, notifyTargetPrice = true, minimumDiscountPercent = 20,
                        maxEmailsPerProductPerDay = 1, defaultCheckIntervalMinutes = 60 });
                    break;
                case "/api/products" when route.Request.Method == "POST":
                    using (var payload = JsonDocument.Parse(route.Request.PostData!))
                    {
                        var product = payload.RootElement.Clone();
                        var url = product.GetProperty("url").GetString()!;
                        if (url.Contains("store-b") && Interlocked.Increment(ref attempts) == 1)
                        {
                            await Json(route, new { error = "Temporary fixture failure" }, 503);
                        }
                        else
                        {
                            imported[url] = product;
                            await Json(route, product, 201);
                        }
                    }
                    break;
                case "/api/products":
                    await Json(route, imported.Values.Select(ProductView).ToArray());
                    break;
                case "/api/products/store-a.test":
                    var offer = imported.Values.Single(item => item.GetProperty("shopName").GetString() == "store-a.test");
                    await Json(route, new
                    {
                        product = ProductView(offer),
                        history = new[] { 100, 120, 110 }.Select((price, index) => new
                        {
                            price, currency = "USD", isAvailable = true, observedPrice = true, source = "JsonLd",
                            checkedAt = DateTimeOffset.UtcNow.AddDays(-index - 1)
                        }),
                        notifications = Array.Empty<object>(), checkLogs = Array.Empty<object>(), alertRules = Array.Empty<object>()
                    });
                    break;
                case "/api/account/push/key":
                    await Json(route, new { publicKey = pushConfigured ? Convert.ToBase64String(new byte[65]).TrimEnd('=') : null });
                    break;
                case "/api/account/push/subscription":
                    pushRequests.Enqueue((route.Request.Method, route.Request.PostData));
                    await route.FulfillAsync(new() { Status = 204 });
                    break;
                default:
                    if (uri.AbsolutePath.StartsWith("/hubs/"))
                    {
                        await route.AbortAsync();
                        break;
                    }
                    var relative = uri.AbsolutePath == "/" ? "index.html" : uri.AbsolutePath.TrimStart('/');
                    var file = Path.Combine(Repository, "frontend", "dashboard", "dist", relative);
                    if (!File.Exists(file))
                    {
                        await route.FulfillAsync(new() { Status = 404 });
                        break;
                    }
                    await route.FulfillAsync(new() { Path = file });
                    break;
            }
        });

        var page = await context.NewPageAsync();
        await page.GotoAsync(Origin);
        await page.Locator("nav").GetByRole(AriaRole.Button, new() { Name = "Products", Exact = true }).ClickAsync();
        await page.GetByRole(AriaRole.Button, new() { Name = "Import wishlist", Exact = true }).ClickAsync();
        var csv = """"
            URL;Product name;Currency;Price;Size
            https://store-a.test/shoe;"Trail ""Runner""";USD;90;M
            https://store-b.test/shoe;Trail Runner;USD;110;M
            https://store-a.test/shoe#details;Duplicate;USD;90;M
            invalid;Broken;USD;100;M
            """";
        await page.Locator("input[type=file]").SetInputFilesAsync(new FilePayload
        {
            Name = "offers.csv", MimeType = "text/csv", Buffer = System.Text.Encoding.UTF8.GetBytes(csv)
        });
        await Expect(page.GetByRole(AriaRole.Status)).ToContainTextAsync("Ready to import 2");
        await Expect(page.GetByText("Invalid product URL", new() { Exact = false })).ToBeVisibleAsync();
        var importButton = page.GetByRole(AriaRole.Button, new() { Name = "Import products", Exact = true });
        await importButton.ClickAsync();
        await Expect(page.GetByRole(AriaRole.Status)).ToContainTextAsync("Imported 1");
        await Expect(page.GetByText("Temporary fixture failure", new() { Exact = false })).ToBeVisibleAsync();
        await importButton.ClickAsync();
        await Expect(page.GetByRole(AriaRole.Status)).ToContainTextAsync("Imported 2");
        Assert.Equal(2, imported.Count);
        Assert.Equal("Trail \"Runner\"", imported["https://store-a.test/shoe"].GetProperty("name").GetString());

        await page.GetByRole(AriaRole.Button, new() { Name = "Close", Exact = true }).ClickAsync();
        var checkboxes = page.GetByRole(AriaRole.Checkbox, new() { Name = "Bulk actions" });
        await checkboxes.Nth(0).CheckAsync();
        await checkboxes.Nth(1).CheckAsync();
        await page.GetByRole(AriaRole.Button, new() { Name = "Compare prices", Exact = true }).ClickAsync();
        var comparison = page.GetByRole(AriaRole.Dialog);
        await Expect(comparison.GetByRole(AriaRole.Row).Filter(new() { HasText = "store-a.test" }))
            .ToContainTextAsync("Lowest available price");
        await Expect(comparison.GetByText("store-b.test", new() { Exact = true })).ToBeVisibleAsync();
        await comparison.GetByRole(AriaRole.Button, new() { Name = "Close" }).ClickAsync();
        await page.GetByRole(AriaRole.Button, new() { NameRegex = new("Trail \"Runner\"") }).ClickAsync();
        await Expect(page.GetByText("Consider buying. The price is near its recent low.")).ToBeVisibleAsync();

        await page.GetByRole(AriaRole.Button, new() { Name = "Close", Exact = true }).ClickAsync();
        await page.Locator("nav").GetByRole(AriaRole.Button, new() { Name = "Settings", Exact = true }).ClickAsync();
        var enablePush = page.GetByRole(AriaRole.Button, new() { Name = "Enable browser notifications" });
        await Expect(enablePush).ToBeDisabledAsync();
        pushConfigured = true;
        await page.Locator("nav").GetByRole(AriaRole.Button, new() { Name = "Products", Exact = true }).ClickAsync();
        await page.GetByRole(AriaRole.Button, new() { Name = "Import wishlist", Exact = true }).ClickAsync();
        await page.GetByRole(AriaRole.Textbox, new() { Name = "Paste product URLs" }).FillAsync("https://store-c.test/shoe https://store-d.test/shoe\nhttps://store-c.test/shoe#duplicate");
        await Expect(page.GetByRole(AriaRole.Status)).ToContainTextAsync("Ready to import 2");
        await page.GetByRole(AriaRole.Button, new() { Name = "Close", Exact = true }).ClickAsync();

        await page.Locator("nav").GetByRole(AriaRole.Button, new() { Name = "Settings", Exact = true }).ClickAsync();
        await enablePush.ClickAsync();
        var disablePush = page.GetByRole(AriaRole.Button, new() { Name = "Disable browser notifications" });
        await disablePush.ClickAsync();
        await Expect(enablePush).ToBeEnabledAsync();
        Assert.Equal(new[] { "PUT", "DELETE" }, pushRequests.Select(request => request.Method));
        Assert.All(pushRequests, request => Assert.Contains("https://fcm.googleapis.com/fcm/send/test", request.Body));
    }

    [BrowserFact]
    public async Task Extension_ExtractsProductFromTab_AndPostsCapturedPrice()
    {
        var builder = WebApplication.CreateSlimBuilder();
        builder.WebHost.ConfigureKestrel(server => server.Listen(IPAddress.Loopback, 0));
        await using var api = builder.Build();
        var saved = new TaskCompletionSource<(string? Authorization, JsonElement Product)>(TaskCreationOptions.RunContinuationsAsynchronously);
        api.MapGet("/api/categories", () => Results.Ok(Array.Empty<object>()));
        api.MapPost("/api/products", async (HttpContext http) =>
        {
            var product = await http.Request.ReadFromJsonAsync<JsonElement>();
            saved.TrySetResult((http.Request.Headers.Authorization.ToString(), product));
            return Results.Created("/api/products/captured", new { id = "captured" });
        });
        await api.StartAsync();
        var apiUrl = api.Urls.Single();

        using var playwright = await Playwright.CreateAsync();
        var work = Directory.CreateTempSubdirectory("stockpricebot-extension-");
        var extension = Path.Combine(work.FullName, "extension");
        try
        {
            var extensionId = PrepareExtension(extension);
            await using var context = await playwright.Chromium.LaunchPersistentContextAsync(Path.Combine(work.FullName, "profile"), new()
            {
                Channel = "chromium",
                Headless = true,
                Args = [$"--disable-extensions-except={extension}", $"--load-extension={extension}"]
            });
            await context.RouteAsync("https://store.test/**", route => route.FulfillAsync(new()
            {
                ContentType = "text/html",
                Body = """
                    <html><head><title>Trail Runner</title>
                    <script type="application/ld+json">
                    {"@type":"Product","name":"Trail Runner","offers":{"@type":"Offer","price":89.99,"priceCurrency":"USD","availability":"https://schema.org/InStock"}}
                    </script></head><body><h1>Trail Runner</h1></body></html>
                    """
            }));

            var storePage = await context.NewPageAsync();
            await storePage.GotoAsync("https://store.test/shoe");
            var popup = await context.NewPageAsync();
            await popup.GotoAsync($"chrome-extension://{extensionId}/test-setup.html");
            var tabId = await popup.EvaluateAsync<int>("""
                async (apiBaseUrl) => {
                    await chrome.storage.sync.set({
                        apiBaseUrl, authToken: 'test-token', popupLanguage: 'en'
                    });
                    return (await chrome.tabs.query({ url: 'https://store.test/*' }))[0].id;
                }
                """, apiUrl);
            await popup.GotoAsync($"chrome-extension://{extensionId}/index.html?sourceTabId={tabId}");
            await Expect(popup.GetByText("Trail Runner", new() { Exact = true })).ToBeVisibleAsync();
            await popup.GetByRole(AriaRole.Button, new() { Name = "Save", Exact = true }).ClickAsync();
            var request = await saved.Task.WaitAsync(TimeSpan.FromSeconds(10));
            Assert.Equal("Bearer test-token", request.Authorization);
            Assert.Equal("https://store.test/shoe", request.Product.GetProperty("url").GetString());
            Assert.Equal(89.99m, request.Product.GetProperty("currentPrice").GetDecimal());
            Assert.Equal("USD", request.Product.GetProperty("currency").GetString());
        }
        finally
        {
            work.Delete(recursive: true);
        }
    }

    private static string PrepareExtension(string destination)
    {
        var source = Path.Combine(Repository, "frontend", "extension", "dist");
        foreach (var file in Directory.GetFiles(source, "*", SearchOption.AllDirectories))
        {
            var copy = Path.Combine(destination, Path.GetRelativePath(source, file));
            Directory.CreateDirectory(Path.GetDirectoryName(copy)!);
            File.Copy(file, copy);
        }

        File.WriteAllText(Path.Combine(destination, "test-setup.html"), "<!doctype html><title>Extension test setup</title>");
        using var key = RSA.Create(2048);
        var publicKey = key.ExportSubjectPublicKeyInfo();
        var manifestPath = Path.Combine(destination, "manifest.json");
        var manifest = JsonNode.Parse(File.ReadAllText(manifestPath))!.AsObject();
        manifest["key"] = Convert.ToBase64String(publicKey);
        File.WriteAllText(manifestPath, manifest.ToJsonString());

        var idHex = Convert.ToHexString(SHA256.HashData(publicKey))[..32];
        return new string(idHex.Select(digit => (char)('a' + Convert.ToInt32(digit.ToString(), 16))).ToArray());
    }

    private static object ProductView(JsonElement product) => new
    {
        id = product.GetProperty("shopName").GetString(),
        name = product.GetProperty("name").GetString(),
        shopName = product.GetProperty("shopName").GetString(),
        url = product.GetProperty("url").GetString(),
        currency = product.GetProperty("currency").GetString(),
        currentPrice = product.GetProperty("currentPrice").GetDecimal(),
        size = product.GetProperty("size").GetString(),
        isAvailable = true, isActive = true, checkIntervalMinutes = 60, trackStock = true,
        createdAt = DateTimeOffset.UtcNow, updatedAt = DateTimeOffset.UtcNow,
        lastSuccessfulCheckAt = DateTimeOffset.UtcNow, monitoringStatus = "Ok"
    };

    private static Task Json(IRoute route, object body, int status = 200) =>
        route.FulfillAsync(new() { Status = status, ContentType = "application/json", Body = JsonSerializer.Serialize(body) });

    private static string FindRepository()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "PriceStockBot.slnx")))
        {
            directory = directory.Parent;
        }

        return directory?.FullName ?? throw new DirectoryNotFoundException("Could not find the repository.");
    }
}

public sealed class BrowserFactAttribute : FactAttribute
{
    public BrowserFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("RUN_BROWSER_TESTS") != "1")
        {
            Skip = "Set RUN_BROWSER_TESTS=1 after building the dashboard and extension and installing Chromium.";
        }
    }
}
