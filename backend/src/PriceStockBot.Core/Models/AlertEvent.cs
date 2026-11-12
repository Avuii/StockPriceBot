using PriceStockBot.Core.Domain;

namespace PriceStockBot.Core.Models;

public sealed record AlertEvent(
    Guid RuleId,
    AlertRuleType Type,
    string Message,
    decimal? OldPrice,
    decimal? NewPrice,
    bool? OldAvailability,
    bool? NewAvailability);
