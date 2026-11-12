using System.Net;
using PriceStockBot.Core.Domain;
using PriceStockBot.Infrastructure.Scraping;

namespace PriceStockBot.Tests;

public sealed class ProductScraperTests
{
    [Fact]
    public async Task ScrapeAsync_ReadsJsonLdProduct()
    {
        const string html = """
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Nike Air Force 1",
              "image": "https://cdn.test/air-force.jpg",
              "offers": {
                "@type": "Offer",
                "price": "419.99",
                "priceCurrency": "PLN",
                "availability": "https://schema.org/InStock"
              }
            }
            </script>
          </head>
        </html>
        """;

        var scraper = new ProductScraper(new StubHttpClientFactory(html));
        var snapshot = await scraper.ScrapeAsync(new Product
        {
            Url = "https://reserved.test/product/123",
            Name = string.Empty,
            ShopName = "reserved.test"
        }, CancellationToken.None);

        Assert.Equal("Nike Air Force 1", snapshot.Name);
        Assert.Equal(419.99m, snapshot.Price);
        Assert.Equal("PLN", snapshot.Currency);
        Assert.True(snapshot.IsAvailable);
        Assert.Equal(StoreDetectionSource.JsonLd, snapshot.Source);
    }

    [Fact]
    public async Task ScrapeAsync_SendsBrowserLikeHeaders()
    {
        const string html = """
        <html>
          <head>
            <meta property="og:title" content="Maszynka do slushy Ninja SLUSHi FS301EU" />
            <meta property="product:price:amount" content="938.99" />
            <meta property="product:price:currency" content="PLN" />
          </head>
        </html>
        """;

        var factory = new StubHttpClientFactory(html);
        var scraper = new ProductScraper(factory);

        await scraper.ScrapeAsync(new Product
        {
            Url = "https://allegro.pl/produkt/maszynka-do-slushy",
            Name = string.Empty,
            ShopName = "allegro.pl"
        }, CancellationToken.None);

        Assert.Contains("Mozilla/5.0", factory.LastUserAgent);
        Assert.Contains("pl-PL", factory.LastAcceptLanguage);
        Assert.Equal("https://allegro.pl/", factory.LastReferrer);
    }

    private sealed class StubHttpClientFactory(string html) : IHttpClientFactory
    {
        public string LastUserAgent { get; private set; } = string.Empty;
        public string LastAcceptLanguage { get; private set; } = string.Empty;
        public string LastReferrer { get; private set; } = string.Empty;

        public HttpClient CreateClient(string name)
        {
            return new HttpClient(new StubHandler(html, this));
        }

        public void Capture(HttpRequestMessage request)
        {
            LastUserAgent = request.Headers.UserAgent.ToString();
            LastAcceptLanguage = string.Join(",", request.Headers.AcceptLanguage.Select(item => item.ToString()));
            LastReferrer = request.Headers.Referrer?.ToString() ?? string.Empty;
        }
    }

    private sealed class StubHandler(string html, StubHttpClientFactory factory) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            factory.Capture(request);
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(html)
            });
        }
    }
}
