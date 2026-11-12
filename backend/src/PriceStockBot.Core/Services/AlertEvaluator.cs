using PriceStockBot.Core.Domain;
using PriceStockBot.Core.Models;

namespace PriceStockBot.Core.Services;

public sealed class AlertEvaluator
{
    public IReadOnlyList<AlertEvent> Evaluate(Product product, PriceHistory? previous, ProductSnapshot current)
    {
        var events = new List<AlertEvent>();

        foreach (var rule in product.AlertRules.Where(rule => rule.IsActive))
        {
            var alert = rule.Type switch
            {
                AlertRuleType.PriceBelowTarget => EvaluatePriceBelowTarget(rule, previous, current),
                AlertRuleType.BackInStock => EvaluateBackInStock(rule, previous, current),
                AlertRuleType.PercentDrop => EvaluatePercentDrop(rule, previous, current),
                AlertRuleType.AnyPriceChange => EvaluateAnyPriceChange(rule, previous, current),
                _ => null
            };

            if (alert is not null)
            {
                events.Add(alert);
            }
        }

        return events;
    }

    private static AlertEvent? EvaluatePriceBelowTarget(AlertRule rule, PriceHistory? previous, ProductSnapshot current)
    {
        if (current.Price is null || rule.TargetPrice is null || current.Price > rule.TargetPrice)
        {
            return null;
        }

        var previousWasAbove = previous?.Price is null || previous.Price > rule.TargetPrice;
        if (!previousWasAbove)
        {
            return null;
        }

        return new AlertEvent(
            rule.Id,
            rule.Type,
            $"Cena spadla do {current.Price:0.00} {current.Currency} (prog: {rule.TargetPrice:0.00} {current.Currency}).",
            previous?.Price,
            current.Price,
            previous?.IsAvailable,
            current.IsAvailable);
    }

    private static AlertEvent? EvaluateBackInStock(AlertRule rule, PriceHistory? previous, ProductSnapshot current)
    {
        if (previous is null || previous.IsAvailable || !current.IsAvailable)
        {
            return null;
        }

        return new AlertEvent(
            rule.Id,
            rule.Type,
            "Produkt wrocil na stock.",
            previous.Price,
            current.Price,
            previous.IsAvailable,
            current.IsAvailable);
    }

    private static AlertEvent? EvaluatePercentDrop(AlertRule rule, PriceHistory? previous, ProductSnapshot current)
    {
        if (previous?.Price is null || current.Price is null || previous.Price <= 0 || rule.PercentDrop is null)
        {
            return null;
        }

        var dropPercent = (previous.Price.Value - current.Price.Value) / previous.Price.Value * 100m;
        if (dropPercent < rule.PercentDrop)
        {
            return null;
        }

        return new AlertEvent(
            rule.Id,
            rule.Type,
            $"Cena spadla o {dropPercent:0.#}%: {previous.Price:0.00} -> {current.Price:0.00} {current.Currency}.",
            previous.Price,
            current.Price,
            previous.IsAvailable,
            current.IsAvailable);
    }

    private static AlertEvent? EvaluateAnyPriceChange(AlertRule rule, PriceHistory? previous, ProductSnapshot current)
    {
        if (previous?.Price is null || current.Price is null || previous.Price == current.Price)
        {
            return null;
        }

        return new AlertEvent(
            rule.Id,
            rule.Type,
            $"Cena zmienila sie: {previous.Price:0.00} -> {current.Price:0.00} {current.Currency}.",
            previous.Price,
            current.Price,
            previous.IsAvailable,
            current.IsAvailable);
    }
}
