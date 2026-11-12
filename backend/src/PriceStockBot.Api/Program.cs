using Microsoft.EntityFrameworkCore;
using PriceStockBot.Api.Endpoints;
using PriceStockBot.Api.Hubs;
using PriceStockBot.Infrastructure;
using PriceStockBot.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddCors(options =>
{
    options.AddPolicy("app", policy =>
    {
        policy.AllowAnyHeader()
            .AllowAnyMethod()
            .SetIsOriginAllowed(_ => true);
    });
});
builder.Services.AddSignalR();

var app = builder.Build();

if (bool.TryParse(app.Configuration["Database:ApplyMigrationsOnStartup"], out var applyMigrations) && applyMigrations)
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
    dbContext.EnsureUserEmailDeliveryColumns();
}

app.UseCors("app");

app.MapGet("/", () => Results.Ok(new
{
    name = "PriceStockBot API",
    status = "ok"
}));

app.MapProductEndpoints();
app.MapCategoryEndpoints();
app.MapDashboardEndpoints();
app.MapAuthEndpoints();
app.MapAccountEndpoints();
app.MapPushEndpoints();
app.MapHub<PriceUpdatesHub>("/hubs/price-updates");

app.Run();
