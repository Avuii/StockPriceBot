using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using PriceStockBot.Core.Domain;
using PriceStockBot.Core.Models;

namespace PriceStockBot.Infrastructure.Scraping;

public sealed partial class ProductScraper(IHttpClientFactory httpClientFactory, PlaywrightStoreRenderer? renderer = null)
{
    private const string BrowserUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

    public async Task<ProductSnapshot> ScrapeAsync(Product product, CancellationToken cancellationToken)
    {
        var uri = new Uri(product.Url);
        if (!PublicStoreHttp.CanFetch(uri))
        {
            throw new HttpRequestException("A public store URL on a standard HTTP port is required.");
        }

        using var client = httpClientFactory.CreateClient(nameof(ProductScraper));
        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        ConfigureBrowserHeaders(request);
        using var response = await client.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        uri = response.RequestMessage?.RequestUri ?? uri;
        var html = await response.Content.ReadAsStringAsync(cancellationToken);
        var snapshot = Extract(product, uri, html);
        if (snapshot.Price is null && renderer is not null)
        {
            var rendered = await renderer.TryExtractAsync(uri, content => Extract(product, uri, content), cancellationToken);
            if (rendered is not null)
            {
                return rendered with { Source = StoreDetectionSource.PlaywrightFallback };
            }
        }

        return snapshot;
    }

    private static ProductSnapshot Extract(Product product, Uri uri, string html)
    {
        var rawHash = ComputeHash(html);
        var store = string.IsNullOrWhiteSpace(product.ShopName) ? uri.Host : product.ShopName;
        var adapter = StoreMarkup.Read(product, html, uri, store, rawHash);
        if (adapter is not null) return Merge(product, adapter);

        var jsonLd = TryReadJsonLd(html, store, rawHash);
        if (jsonLd?.Price is not null) return Merge(product, jsonLd);

        var meta = TryReadMetaTags(html, store, rawHash);
        if (meta?.Price is not null) return Merge(product, meta);

        var saved = TryReadSavedSelectors(product, html, store, rawHash);
        var snapshot = saved ?? jsonLd ?? meta;

        return snapshot is null
            ? new ProductSnapshot(product.Name, null, product.Currency, product.ImageUrl, product.IsAvailable,
                store, rawHash, StoreDetectionSource.Unknown)
            : Merge(product, snapshot);
    }

    private static ProductSnapshot Merge(Product product, ProductSnapshot snapshot)
    {
        return snapshot with
        {
            Name = string.IsNullOrWhiteSpace(snapshot.Name) ? product.Name : snapshot.Name,
            Currency = NormalizeCurrency(snapshot.Currency) ?? product.Currency,
            ImageUrl = string.IsNullOrWhiteSpace(snapshot.ImageUrl) ? product.ImageUrl : snapshot.ImageUrl
        };
    }

    private static string? NormalizeCurrency(string currency)
    {
        var normalized = currency.Trim().ToUpperInvariant();
        return normalized.Length == 3 && normalized.All(char.IsAsciiLetterUpper) ? normalized : null;
    }

    internal static void ConfigureBrowserHeaders(HttpRequestMessage request)
    {
        request.Headers.UserAgent.ParseAdd(BrowserUserAgent);
        request.Headers.TryAddWithoutValidation("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8");
        request.Headers.TryAddWithoutValidation("Accept-Language", "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7");
        request.Headers.TryAddWithoutValidation("Cache-Control", "no-cache");
        request.Headers.TryAddWithoutValidation("Pragma", "no-cache");
        request.Headers.TryAddWithoutValidation("Upgrade-Insecure-Requests", "1");
        request.Headers.TryAddWithoutValidation("Sec-Fetch-Dest", "document");
        request.Headers.TryAddWithoutValidation("Sec-Fetch-Mode", "navigate");
        request.Headers.TryAddWithoutValidation("Sec-Fetch-Site", "none");
        request.Headers.TryAddWithoutValidation("Sec-Fetch-User", "?1");

        if (request.RequestUri is not null)
        {
            request.Headers.Referrer = new Uri($"{request.RequestUri.Scheme}://{request.RequestUri.Host}/");
        }
    }

    private static ProductSnapshot? TryReadJsonLd(string html, string store, string rawHash)
    {
        foreach (Match match in JsonLdRegex().Matches(html))
        {
            var json = WebUtility.HtmlDecode(match.Groups["json"].Value.Trim());
            try
            {
                using var document = JsonDocument.Parse(json);
                var product = FindProductNode(document.RootElement);
                if (product is null)
                {
                    continue;
                }

                var root = product.Value;
                var name = ReadString(root, "name") ?? string.Empty;
                var image = ReadImage(root);
                var offers = ReadOffers(root);

                if (string.IsNullOrWhiteSpace(name) && offers.Price is null)
                {
                    continue;
                }

                return new ProductSnapshot(
                    name,
                    offers.Price,
                    offers.Currency ?? string.Empty,
                    image,
                    offers.IsAvailable,
                    store,
                    rawHash,
                    StoreDetectionSource.JsonLd);
            }
            catch (JsonException)
            {
                continue;
            }
        }

        return null;
    }

    private static JsonElement? FindProductNode(JsonElement element)
    {
        if (IsProduct(element))
        {
            return element;
        }

        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var child in element.EnumerateArray())
            {
                var found = FindProductNode(child);
                if (found is not null)
                {
                    return found;
                }
            }
        }

        if (element.ValueKind == JsonValueKind.Object)
        {
            if (element.TryGetProperty("@graph", out var graph))
            {
                return FindProductNode(graph);
            }

            foreach (var property in element.EnumerateObject())
            {
                if (property.Value.ValueKind is JsonValueKind.Object or JsonValueKind.Array)
                {
                    var found = FindProductNode(property.Value);
                    if (found is not null)
                    {
                        return found;
                    }
                }
            }
        }

        return null;
    }

    private static bool IsProduct(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object || !element.TryGetProperty("@type", out var type))
        {
            return false;
        }

        if (type.ValueKind == JsonValueKind.String)
        {
            return type.GetString()?.Contains("Product", StringComparison.OrdinalIgnoreCase) == true;
        }

        if (type.ValueKind == JsonValueKind.Array)
        {
            return type.EnumerateArray().Any(value => value.ValueKind == JsonValueKind.String && value.GetString()?.Contains("Product", StringComparison.OrdinalIgnoreCase) == true);
        }

        return false;
    }

    private static (decimal? Price, string? Currency, bool IsAvailable) ReadOffers(JsonElement root)
    {
        if (!root.TryGetProperty("offers", out var offers))
        {
            return (null, null, true);
        }

        var offer = offers.ValueKind == JsonValueKind.Array ? offers.EnumerateArray().FirstOrDefault() : offers;
        var price = ReadDecimal(offer, "price") ?? ReadDecimal(offer, "lowPrice");
        var currency = ReadString(offer, "priceCurrency");
        var availability = ReadString(offer, "availability");
        var isAvailable = availability is null || !OutOfStockRegex().IsMatch(availability);

        return (price, currency, isAvailable);
    }

    private static ProductSnapshot? TryReadMetaTags(string html, string store, string rawHash)
    {
        var title = ReadMeta(html, "og:title") ?? ReadMeta(html, "twitter:title") ?? ReadTitle(html);
        var priceText = ReadMeta(html, "product:price:amount") ?? ReadMeta(html, "og:price:amount");
        var price = ParsePrice(priceText);
        var currency = ReadMeta(html, "product:price:currency") ?? ReadMeta(html, "og:price:currency") ?? string.Empty;
        var image = ReadMeta(html, "og:image") ?? ReadMeta(html, "twitter:image");
        var availability = ReadMeta(html, "product:availability") ?? ReadMeta(html, "availability");

        if (price is null && string.IsNullOrWhiteSpace(title))
        {
            return null;
        }

        return new ProductSnapshot(
            title ?? string.Empty,
            price,
            currency,
            image,
            availability is null || !OutOfStockRegex().IsMatch(availability),
            store,
            rawHash,
            StoreDetectionSource.MetaTags);
    }

    private static ProductSnapshot? TryReadSavedSelectors(Product product, string html, string store, string rawHash)
    {
        var priceText = BasicSelectorExtractor.ExtractText(html, product.PriceSelector);
        var stockText = BasicSelectorExtractor.ExtractText(html, product.StockSelector);
        var price = ParsePrice(priceText);

        if (price is null && string.IsNullOrWhiteSpace(stockText))
        {
            return null;
        }

        var isAvailable = string.IsNullOrWhiteSpace(stockText)
            ? product.IsAvailable
            : !OutOfStockRegex().IsMatch(stockText);

        return new ProductSnapshot(
            product.Name,
            price,
            product.Currency,
            product.ImageUrl,
            isAvailable,
            store,
            rawHash,
            StoreDetectionSource.SavedSelector);
    }

    private static string? ReadString(JsonElement element, string propertyName)
    {
        return element.ValueKind == JsonValueKind.Object && element.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }

    private static decimal? ReadDecimal(JsonElement element, string propertyName)
    {
        if (element.ValueKind != JsonValueKind.Object || !element.TryGetProperty(propertyName, out var value))
        {
            return null;
        }

        return value.ValueKind switch
        {
            JsonValueKind.Number when value.TryGetDecimal(out var number) => number,
            JsonValueKind.String => ParsePrice(value.GetString()),
            _ => null
        };
    }

    private static string? ReadImage(JsonElement element)
    {
        if (!element.TryGetProperty("image", out var image))
        {
            return null;
        }

        return image.ValueKind switch
        {
            JsonValueKind.String => image.GetString(),
            JsonValueKind.Array => image.EnumerateArray().FirstOrDefault(value => value.ValueKind == JsonValueKind.String) is { ValueKind: JsonValueKind.String } first ? first.GetString() : null,
            JsonValueKind.Object => ReadString(image, "url"),
            _ => null
        };
    }

    private static string? ReadMeta(string html, string name)
    {
        foreach (Match match in MetaRegex().Matches(html))
        {
            var attributes = match.Groups["attributes"].Value;
            var key = ReadAttribute(attributes, "property") ?? ReadAttribute(attributes, "name");
            if (!string.Equals(key, name, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            return WebUtility.HtmlDecode(ReadAttribute(attributes, "content"));
        }

        return null;
    }

    private static string? ReadTitle(string html)
    {
        var match = TitleRegex().Match(html);
        return match.Success ? WebUtility.HtmlDecode(match.Groups["title"].Value.Trim()) : null;
    }

    private static string? ReadAttribute(string attributes, string name)
    {
        var match = Regex.Match(attributes, $"""{name}\s*=\s*["'](?<value>.*?)["']""", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        return match.Success ? match.Groups["value"].Value.Trim() : null;
    }

    internal static decimal? ParsePrice(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var match = PriceRegex().Match(value);
        if (!match.Success)
        {
            return null;
        }

        var normalized = Regex.Replace(match.Value, @"\s+", string.Empty);
        var separator = Math.Max(normalized.LastIndexOf(','), normalized.LastIndexOf('.'));
        normalized = separator >= 0 && normalized.Length - separator <= 3
            ? normalized[..separator].Replace(",", "").Replace(".", "") + "." + normalized[(separator + 1)..]
            : normalized.Replace(",", "").Replace(".", "");
        return decimal.TryParse(normalized, NumberStyles.Number, CultureInfo.InvariantCulture, out var price) ? price : null;
    }

    private static string ComputeHash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    [GeneratedRegex("""<script[^>]+type=["']application/ld\+json["'][^>]*>(?<json>.*?)</script>""", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex JsonLdRegex();

    [GeneratedRegex("""<meta(?<attributes>[^>]+)>""", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex MetaRegex();

    [GeneratedRegex("""<title[^>]*>(?<title>.*?)</title>""", RegexOptions.IgnoreCase | RegexOptions.Singleline)]
    private static partial Regex TitleRegex();

    [GeneratedRegex(@"\d+(?:[\s.,]\d{3})*(?:[,.]\d{1,2})?")]
    private static partial Regex PriceRegex();

    [GeneratedRegex("niedost[eę]pn|brak|out[ _-]*of[ _-]*stock|unavailable|sold[ _-]*out|discontinued", RegexOptions.IgnoreCase)]
    private static partial Regex OutOfStockRegex();
}
