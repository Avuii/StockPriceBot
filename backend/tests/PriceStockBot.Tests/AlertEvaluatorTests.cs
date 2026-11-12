using PriceStockBot.Core.Domain;
using PriceStockBot.Core.Models;
using PriceStockBot.Core.Services;

namespace PriceStockBot.Tests;

public sealed class AlertEvaluatorTests
{
    [Fact]
    public void Evaluate_ReturnsPriceBelowTarget_WhenPriceCrossesThreshold()
    {
        var product = new Product
        {
            TargetPrice = 50m,
            AlertRules =
            {
                new AlertRule
                {
                    Type = AlertRuleType.PriceBelowTarget,
                    TargetPrice = 50m
                }
            }
        };

        var previous = new PriceHistory { Price = 59.99m, IsAvailable = true };
        var current = new ProductSnapshot("Krem", 49.99m, "PLN", null, true, "shop.test", "hash", StoreDetectionSource.JsonLd);

        var alerts = new AlertEvaluator().Evaluate(product, previous, current);

        Assert.Single(alerts);
        Assert.Equal(AlertRuleType.PriceBelowTarget, alerts[0].Type);
    }

    [Fact]
    public void Evaluate_ReturnsBackInStock_WhenAvailabilityChanges()
    {
        var product = new Product
        {
            AlertRules =
            {
                new AlertRule { Type = AlertRuleType.BackInStock }
            }
        };

        var previous = new PriceHistory { Price = 120m, IsAvailable = false };
        var current = new ProductSnapshot("Bluza", 120m, "PLN", null, true, "shop.test", "hash", StoreDetectionSource.MetaTags);

        var alerts = new AlertEvaluator().Evaluate(product, previous, current);

        Assert.Single(alerts);
        Assert.Equal(AlertRuleType.BackInStock, alerts[0].Type);
    }

    [Fact]
    public void Evaluate_DoesNotRepeatThresholdAlert_WhenPriceWasAlreadyBelowThreshold()
    {
        var product = new Product
        {
            TargetPrice = 50m,
            AlertRules =
            {
                new AlertRule
                {
                    Type = AlertRuleType.PriceBelowTarget,
                    TargetPrice = 50m
                }
            }
        };

        var previous = new PriceHistory { Price = 45m, IsAvailable = true };
        var current = new ProductSnapshot("Ksiazka", 44m, "PLN", null, true, "shop.test", "hash", StoreDetectionSource.JsonLd);

        var alerts = new AlertEvaluator().Evaluate(product, previous, current);

        Assert.Empty(alerts);
    }
}
