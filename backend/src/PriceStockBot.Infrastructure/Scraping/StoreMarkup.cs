using System.Text.Json;
using AngleSharp.Dom;
using AngleSharp.Html.Parser;
using PriceStockBot.Core.Domain;
using PriceStockBot.Core.Models;

namespace PriceStockBot.Infrastructure.Scraping;

internal static class StoreMarkup
{
    public static ProductSnapshot? Read(Product product, string html, Uri uri, string store, string rawHash)
    {
        if (!html.Contains("ProductJson", StringComparison.OrdinalIgnoreCase)
            && !html.Contains("data-product-json", StringComparison.OrdinalIgnoreCase)
            && !html.Contains("woocommerce-Price-amount", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        using var document = new HtmlParser().ParseDocument(html);
        var currency = document.QuerySelector("meta[property='product:price:currency'], meta[property='og:price:currency'], meta[itemprop='priceCurrency']")
            ?.GetAttribute("content")?.Trim().ToUpperInvariant();
        var validCurrency = currency is { Length: 3 } && currency.All(char.IsAsciiLetterUpper) ? currency : null;
        return (validCurrency is null ? null : ReadShopify(product, document, uri, validCurrency, store, rawHash))
            ?? ReadWooCommerce(product, document, validCurrency, store, rawHash);
    }

    private static ProductSnapshot? ReadShopify(
        Product product, IDocument document, Uri uri, string currency, string store, string rawHash)
    {
        var variantId = uri.Query.TrimStart('?').Split('&')
            .FirstOrDefault(part => part.StartsWith("variant=", StringComparison.Ordinal))?["variant=".Length..];
        foreach (var script in document.QuerySelectorAll("script[type='application/json'][id^='ProductJson'], script[type='application/json'][data-product-json]"))
        {
            try
            {
                using var json = JsonDocument.Parse(script.TextContent);
                var item = json.RootElement;
                if (item.ValueKind != JsonValueKind.Object
                    || !item.TryGetProperty("variants", out var variants) || variants.ValueKind != JsonValueKind.Array)
                {
                    continue;
                }

                var candidates = variants.EnumerateArray().Where(variant => variant.ValueKind == JsonValueKind.Object)
                    .Where(variant => variantId is null || (variant.TryGetProperty("id", out var id) && id.ToString() == variantId))
                    .Where(variant => MatchesOption(variant, product.Size) && MatchesOption(variant, product.Color))
                    .Take(2).ToArray();
                if (candidates.Length != 1 || !candidates[0].TryGetProperty("price", out var price)
                    || price.ValueKind != JsonValueKind.Number || !price.TryGetDecimal(out var cents) || cents < 0
                    || !candidates[0].TryGetProperty("available", out var available)
                    || available.ValueKind is not (JsonValueKind.True or JsonValueKind.False))
                {
                    continue;
                }

                return new ProductSnapshot(ReadString(item, "title") ?? "", cents / 100m, currency,
                    ReadString(item, "featured_image"), available.GetBoolean(), store, rawHash, StoreDetectionSource.StoreAdapter);
            }
            catch (JsonException)
            {
                // Other theme scripts and generic metadata can still supply the price.
            }
        }

        return null;
    }

    private static ProductSnapshot? ReadWooCommerce(
        Product product, IDocument document, string? currency, string store, string rawHash)
    {
        if (document.Body?.ClassList.Contains("single-product") != true
            || !string.IsNullOrWhiteSpace(product.Size) || !string.IsNullOrWhiteSpace(product.Color)
            || document.QuerySelector(".summary form.variations_form") is not null)
        {
            return null;
        }

        var amounts = document.QuerySelectorAll(".summary .price .woocommerce-Price-amount")
            .Where(element => element.Closest("del") is null).Take(2).ToArray();
        var amount = amounts.Length == 1 ? ProductScraper.ParsePrice(amounts[0].TextContent) : null;
        if (amount is null) return null;

        currency ??= amounts[0].QuerySelector(".woocommerce-Price-currencySymbol")?.TextContent.Trim() switch
        {
            "zł" => "PLN",
            "€" => "EUR",
            "£" => "GBP",
            "US$" => "USD",
            "CA$" => "CAD",
            "AU$" => "AUD",
            _ => null
        };
        if (currency is null)
        {
            return null;
        }

        return new ProductSnapshot(document.QuerySelector(".summary .product_title")?.TextContent.Trim() ?? "",
            amount, currency, document.QuerySelector("meta[property='og:image']")?.GetAttribute("content"),
            document.QuerySelector(".summary .stock.out-of-stock") is null,
            store, rawHash, StoreDetectionSource.StoreAdapter);
    }

    private static bool MatchesOption(JsonElement variant, string? value) =>
        string.IsNullOrWhiteSpace(value) || new[] { "option1", "option2", "option3" }
            .Any(option => string.Equals(ReadString(variant, option)?.Trim(), value.Trim(), StringComparison.OrdinalIgnoreCase));

    private static string? ReadString(JsonElement element, string key) =>
        element.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
}
