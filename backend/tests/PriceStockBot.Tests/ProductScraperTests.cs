using System.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
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

    [Fact]
    public async Task ScrapeAsync_SelectsShopifyVariant()
    {
        const string html = """
            <meta property="og:price:currency" content="EUR">
            <script type="application/json" id="ProductJson-main">
            {"title":"Trail Runner","variants":[
                {"id":123,"price":9000,"available":true,"option1":"S"},
                {"id":456,"price":10550,"available":false,"option1":"M"}
            ]}
            </script>
            """;
        var scraper = new ProductScraper(new StubHttpClientFactory(html));
        var snapshot = await scraper.ScrapeAsync(new Product
        {
            Url = "https://store.test/products/trail-runner?variant=456",
            Size = "M"
        }, CancellationToken.None);
        Assert.Equal(105.50m, snapshot.Price);
        Assert.Equal("EUR", snapshot.Currency);
        Assert.False(snapshot.IsAvailable);
        Assert.Equal(StoreDetectionSource.StoreAdapter, snapshot.Source);
    }

    [Fact]
    public async Task ScrapeAsync_UsesWooCommerceSalePrice()
    {
        const string html = """
            <meta property="product:price:currency" content="PLN">
            <body class="single-product"><div class="summary">
            <h1 class="product_title">Trail Runner</h1>
            <p class="price"><del><span class="woocommerce-Price-amount">1 499,00 zł</span></del>
            <ins><span class="woocommerce-Price-amount">1 199,50 zł</span></ins></p>
            </div></body>
            """;
        var scraper = new ProductScraper(new StubHttpClientFactory(html));
        var snapshot = await scraper.ScrapeAsync(new Product { Url = "https://store.test/product/trail-runner" }, CancellationToken.None);
        Assert.Equal(1199.50m, snapshot.Price);
        Assert.Equal("Trail Runner", snapshot.Name);
        Assert.Equal(StoreDetectionSource.StoreAdapter, snapshot.Source);
    }

    [Fact]
    public async Task ScrapeAsync_UsesMetadataWhenJsonLdHasNoPrice()
    {
        const string html = """
            <script type="application/ld+json">{"@type":"Product","name":"Trail Runner","offers":[]}</script>
            <meta property="product:price:amount" content="89.99">
            <meta property="product:price:currency" content="USD">
            """;
        var scraper = new ProductScraper(new StubHttpClientFactory(html));
        var snapshot = await scraper.ScrapeAsync(new Product { Url = "https://store.test/shoe" }, CancellationToken.None);
        Assert.Equal(89.99m, snapshot.Price);
        Assert.Equal(StoreDetectionSource.MetaTags, snapshot.Source);
    }

    [BrowserFact]
    public async Task ScrapeAsync_UsesPlaywrightWhenScriptAddsPrice()
    {
        const string html = """
            <html><head><title>Trail Runner</title></head><body>
            <script>
            setTimeout(() => {
                const product = document.createElement('script');
                product.type = 'application/ld+json';
                product.textContent = JSON.stringify({
                    '@type': 'Product', name: 'Trail Runner', offers: { price: 49.99, priceCurrency: 'EUR' }
                });
                document.head.appendChild(product);
            }, 100);
            </script></body></html>
            """;
        var factory = new StubHttpClientFactory(html);
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["Scraping:PlaywrightEnabled"] = "true" }).Build();
        var renderer = new PlaywrightStoreRenderer(configuration, factory, NullLogger<PlaywrightStoreRenderer>.Instance);
        var scraper = new ProductScraper(factory, renderer);
        var snapshot = await scraper.ScrapeAsync(new Product { Url = "https://store.test/shoe" }, CancellationToken.None);
        Assert.Equal(49.99m, snapshot.Price);
        Assert.Equal(StoreDetectionSource.PlaywrightFallback, snapshot.Source);
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
                Content = new StringContent(html, System.Text.Encoding.UTF8, "text/html")
            });
        }
    }
}
