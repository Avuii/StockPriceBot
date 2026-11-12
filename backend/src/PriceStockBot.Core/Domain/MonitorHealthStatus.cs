namespace PriceStockBot.Core.Domain;

public enum MonitorHealthStatus
{
    Unknown = 0,
    Ok = 1,
    PriceNotFound = 2,
    SelectorNeedsUpdate = 3,
    RequiresJavaScript = 4,
    LastError = 5,
    StoreBlocked = 6
}
