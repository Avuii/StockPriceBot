using PriceStockBot.Core.Domain;
using PriceStockBot.Core.Models;
using PriceStockBot.Core.Ports;

namespace PriceStockBot.Infrastructure.Scraping;

public sealed class GenericStoreAdapter(ProductScraper scraper) : IStoreAdapter
{
    public bool CanHandle(Uri productUri) => productUri.Scheme is "http" or "https";

    public Task<ProductSnapshot> ScrapeAsync(Product product, CancellationToken cancellationToken)
    {
        return scraper.ScrapeAsync(product, cancellationToken);
    }
}
