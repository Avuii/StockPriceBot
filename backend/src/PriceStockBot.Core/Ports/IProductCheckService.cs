namespace PriceStockBot.Core.Ports;

public interface IProductCheckService
{
    Task CheckProductAsync(Guid productId, CancellationToken cancellationToken);
    Task<int> CheckDueProductsAsync(DateTimeOffset now, CancellationToken cancellationToken);
}
