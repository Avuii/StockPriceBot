namespace PriceStockBot.Core.Domain;

public enum StoreDetectionSource
{
    Unknown = 0,
    JsonLd = 1,
    MetaTags = 2,
    SavedSelector = 3,
    ExtensionPayload = 4,
    StoreAdapter = 5,
    PlaywrightFallback = 6
}
