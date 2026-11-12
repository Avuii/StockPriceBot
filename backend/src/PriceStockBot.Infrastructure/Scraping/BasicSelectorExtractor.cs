using System.Net;
using System.Text.RegularExpressions;

namespace PriceStockBot.Infrastructure.Scraping;

internal static partial class BasicSelectorExtractor
{
    public static string? ExtractText(string html, string? selector)
    {
        if (string.IsNullOrWhiteSpace(selector))
        {
            return null;
        }

        selector = selector.Trim();
        if (selector.StartsWith('#'))
        {
            return ExtractByAttribute(html, "id", selector[1..]);
        }

        if (selector.StartsWith('.'))
        {
            return ExtractByClass(html, selector[1..]);
        }

        if (selector.StartsWith("[itemprop=", StringComparison.OrdinalIgnoreCase))
        {
            var itemProp = selector.Trim('[', ']').Split('=', 2).Last().Trim('\'', '"');
            return ExtractByAttribute(html, "itemprop", itemProp);
        }

        return null;
    }

    private static string? ExtractByClass(string html, string className)
    {
        var escaped = Regex.Escape(className);
        var match = Regex.Match(
            html,
            $"""<(?<tag>[a-zA-Z0-9]+)(?=[^>]*class=["'][^"']*\b{escaped}\b[^"']*["'])[^>]*>(?<value>.*?)</\k<tag>>""",
            RegexOptions.IgnoreCase | RegexOptions.Singleline);

        return Clean(match.Groups["value"].Value);
    }

    private static string? ExtractByAttribute(string html, string attribute, string value)
    {
        var match = Regex.Match(
            html,
            $"""<(?<tag>[a-zA-Z0-9]+)(?=[^>]*{Regex.Escape(attribute)}=["']{Regex.Escape(value)}["'])[^>]*>(?<value>.*?)</\k<tag>>""",
            RegexOptions.IgnoreCase | RegexOptions.Singleline);

        return Clean(match.Groups["value"].Value);
    }

    private static string? Clean(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var withoutTags = Regex.Replace(value, "<.*?>", " ");
        var decoded = WebUtility.HtmlDecode(withoutTags);
        return WhitespaceRegex().Replace(decoded, " ").Trim();
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRegex();
}
