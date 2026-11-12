using Microsoft.EntityFrameworkCore;
using PriceStockBot.Infrastructure;
using PriceStockBot.Infrastructure.Data;
using PriceStockBot.Worker.Jobs;
using Quartz;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);

var intervalSeconds = int.TryParse(builder.Configuration["Worker:SchedulerIntervalSeconds"], out var configuredInterval)
    ? configuredInterval
    : 300;

builder.Services.AddQuartz(configure =>
{
    var jobKey = new JobKey(nameof(ProductCheckJob));

    configure.AddJob<ProductCheckJob>(job => job.WithIdentity(jobKey));
    configure.AddTrigger(trigger => trigger
        .ForJob(jobKey)
        .WithIdentity($"{nameof(ProductCheckJob)}Trigger")
        .StartNow()
        .WithSimpleSchedule(schedule => schedule
            .WithIntervalInSeconds(Math.Max(30, intervalSeconds))
            .RepeatForever()));
});

builder.Services.AddQuartzHostedService(options =>
{
    options.WaitForJobsToComplete = true;
});

var host = builder.Build();

if (bool.TryParse(builder.Configuration["Database:ApplyMigrationsOnStartup"], out var applyMigrations) && applyMigrations)
{
    using var scope = host.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
    dbContext.EnsureUserEmailDeliveryColumns();
}

host.Run();
