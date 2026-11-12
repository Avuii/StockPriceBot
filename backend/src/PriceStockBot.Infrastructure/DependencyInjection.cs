using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PriceStockBot.Core.Ports;
using PriceStockBot.Core.Services;
using PriceStockBot.Infrastructure.Configuration;
using PriceStockBot.Infrastructure.Data;
using PriceStockBot.Infrastructure.Notifications;
using PriceStockBot.Infrastructure.Scraping;
using PriceStockBot.Infrastructure.Security;
using PriceStockBot.Infrastructure.Services;

namespace PriceStockBot.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres")
            ?? "Host=localhost;Port=5432;Database=pricestockbot;Username=postgres;Password=postgres";

        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
        services.Configure<TelegramOptions>(configuration.GetSection(TelegramOptions.SectionName));
        services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.SectionName));
        services.AddHttpClient();
        services.AddHttpClient(nameof(ProductScraper), client =>
        {
            client.Timeout = TimeSpan.FromSeconds(25);
        });
        services.AddSingleton<PasswordHasher>();
        services.AddSingleton<SessionTokenService>();
        services.AddScoped<AlertEvaluator>();
        services.AddScoped<IStoreAdapter, GenericStoreAdapter>();
        services.AddScoped<ProductScraper>();
        services.AddScoped<IProductCheckService, ProductCheckService>();
        services.AddScoped<INotificationSender, TelegramNotificationSender>();
        services.AddScoped<EmailNotificationSender>();
        services.AddScoped<INotificationSender>(provider => provider.GetRequiredService<EmailNotificationSender>());

        return services;
    }
}
