using PriceStockBot.Core.Domain;
using PriceStockBot.Core.Models;

namespace PriceStockBot.Core.Ports;

public interface IStoreAdapter
{
    bool CanHandle(Uri productUri);
    Task<ProductSnapshot> ScrapeAsync(Product product, CancellationToken cancellationToken);
}
