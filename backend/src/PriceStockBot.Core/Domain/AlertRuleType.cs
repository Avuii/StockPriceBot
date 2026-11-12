namespace PriceStockBot.Core.Domain;

public enum AlertRuleType
{
    PriceBelowTarget = 1,
    BackInStock = 2,
    PercentDrop = 3,
    AnyPriceChange = 4
}
