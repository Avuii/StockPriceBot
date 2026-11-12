using PriceStockBot.Core.Ports;
using Quartz;

namespace PriceStockBot.Worker.Jobs;

[DisallowConcurrentExecution]
public sealed class ProductCheckJob(
    IProductCheckService productCheckService,
    ILogger<ProductCheckJob> logger) : IJob
{
    public async Task Execute(IJobExecutionContext context)
    {
        var checkedCount = await productCheckService.CheckDueProductsAsync(
            DateTimeOffset.UtcNow,
            context.CancellationToken);

        if (checkedCount > 0)
        {
            logger.LogInformation("Checked {Count} due products.", checkedCount);
        }
    }
}
