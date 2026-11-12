using PriceStockBot.Core.Domain;

namespace PriceStockBot.Core.Models;

public sealed record ProductSnapshot(
    string Name,
    decimal? Price,
    string Currency,
    string? ImageUrl,
    bool IsAvailable,
    string Store,
    string RawHash,
    StoreDetectionSource Source);
