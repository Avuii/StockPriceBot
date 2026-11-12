using Microsoft.EntityFrameworkCore;
using PriceStockBot.Api.Security;
using PriceStockBot.Core.Domain;
using PriceStockBot.Infrastructure.Data;
using PriceStockBot.Infrastructure.Security;

namespace PriceStockBot.Api.Endpoints;

public static class CategoryEndpoints
{
    private const int MaxCategoryNameLength = 120;
    private const int MaxIconNameLength = 80;

    public static IEndpointRouteBuilder MapCategoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/categories").WithTags("Categories");

        group.MapGet("/", async (
            HttpContext httpContext,
            AppDbContext dbContext,
            SessionTokenService tokenService,
            CancellationToken cancellationToken) =>
        {
            var user = await CurrentUserResolver.ResolveAsync(httpContext, dbContext, tokenService, cancellationToken);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            await EnsureStarterCategoriesAsync(dbContext, user.Id, cancellationToken);

            var categories = await dbContext.Categories
                .Where(category => category.UserId == user.Id)
                .OrderBy(category => category.Name)
                .Select(category => new CategoryResponse(
                    category.Id,
                    category.Name,
                    category.IconName ?? DefaultIconName(category.Name),
                    category.ColorHex ?? DefaultColorHex(category.Name),
                    category.Products.Count))
                .ToListAsync(cancellationToken);

            return Results.Ok(categories);
        });

        group.MapPost("/", async (
            CreateCategoryRequest request,
            HttpContext httpContext,
            AppDbContext dbContext,
            SessionTokenService tokenService,
            CancellationToken cancellationToken) =>
        {
            var user = await CurrentUserResolver.ResolveAsync(httpContext, dbContext, tokenService, cancellationToken);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            var name = NormalizeCategoryName(request.Name);
            if (name is null)
            {
                return Results.BadRequest(new { error = "Category name is required." });
            }

            var iconName = NormalizeIconName(request.IconName) ?? DefaultIconName(name);
            var colorHex = NormalizeColorHex(request.ColorHex) ?? DefaultColorHex(name);
            var existing = await dbContext.Categories
                .Where(category => category.UserId == user.Id && category.Name == name)
                .Select(category => new
                {
                    Category = category,
                    ProductCount = category.Products.Count
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (existing is not null)
            {
                return Results.Ok(ToResponse(existing.Category, existing.ProductCount));
            }

            var category = new Category
            {
                Name = name,
                UserId = user.Id,
                IconName = iconName,
                ColorHex = colorHex
            };
            dbContext.Categories.Add(category);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Created($"/api/categories/{category.Id}", ToResponse(category, 0));
        });

        group.MapPatch("/{id:guid}", async (
            Guid id,
            UpdateCategoryRequest request,
            HttpContext httpContext,
            AppDbContext dbContext,
            SessionTokenService tokenService,
            CancellationToken cancellationToken) =>
        {
            var user = await CurrentUserResolver.ResolveAsync(httpContext, dbContext, tokenService, cancellationToken);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            var category = await dbContext.Categories
                .Include(item => item.Products)
                .FirstOrDefaultAsync(item => item.Id == id && item.UserId == user.Id, cancellationToken);
            if (category is null)
            {
                return Results.NotFound();
            }

            var name = NormalizeCategoryName(request.Name);
            if (name is null)
            {
                return Results.BadRequest(new { error = "Category name is required." });
            }

            var duplicate = await dbContext.Categories.AnyAsync(
                item => item.UserId == user.Id && item.Id != id && item.Name == name,
                cancellationToken);
            if (duplicate)
            {
                return Results.Conflict(new { error = "Category with this name already exists." });
            }

            category.Name = name;
            category.IconName = NormalizeIconName(request.IconName) ?? DefaultIconName(name);
            category.ColorHex = NormalizeColorHex(request.ColorHex) ?? DefaultColorHex(name);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(ToResponse(category, category.Products.Count));
        });

        group.MapDelete("/{id:guid}", async (
            Guid id,
            bool force,
            HttpContext httpContext,
            AppDbContext dbContext,
            SessionTokenService tokenService,
            CancellationToken cancellationToken) =>
        {
            var user = await CurrentUserResolver.ResolveAsync(httpContext, dbContext, tokenService, cancellationToken);
            if (user is null)
            {
                return Results.Unauthorized();
            }

            var category = await dbContext.Categories
                .Include(item => item.Products)
                .FirstOrDefaultAsync(item => item.Id == id && item.UserId == user.Id, cancellationToken);
            if (category is null)
            {
                return Results.NotFound();
            }

            if (category.Products.Count > 0 && !force)
            {
                return Results.Conflict(new
                {
                    error = "Category is assigned to products.",
                    productCount = category.Products.Count
                });
            }

            foreach (var product in category.Products)
            {
                product.CategoryId = null;
                product.Category = null;
            }

            dbContext.Categories.Remove(category);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        });

        return app;
    }

    private static CategoryResponse ToResponse(Category category, int productCount) =>
        new(
            category.Id,
            category.Name,
            category.IconName ?? DefaultIconName(category.Name),
            category.ColorHex ?? DefaultColorHex(category.Name),
            productCount);

    private static async Task EnsureStarterCategoriesAsync(AppDbContext dbContext, string userId, CancellationToken cancellationToken)
    {
        var hasCategories = await dbContext.Categories.AnyAsync(category => category.UserId == userId, cancellationToken);
        if (hasCategories)
        {
            return;
        }

        dbContext.Categories.AddRange(new[]
        {
            new Category { UserId = userId, Name = "Ubrania", IconName = "Shirt", ColorHex = "#38bdf8" },
            new Category { UserId = userId, Name = "Buty", IconName = "Footprints", ColorHex = "#8b5cf6" },
            new Category { UserId = userId, Name = "Elektronika", IconName = "Laptop", ColorHex = "#2563eb" },
            new Category { UserId = userId, Name = "Kosmetyki", IconName = "Sparkles", ColorHex = "#f43f5e" },
            new Category { UserId = userId, Name = "Dom", IconName = "Home", ColorHex = "#14b8a6" },
            new Category { UserId = userId, Name = "Ksiazki", IconName = "BookOpen", ColorHex = "#f97316" },
            new Category { UserId = userId, Name = "Inne", IconName = "Tag", ColorHex = "#64748b" }
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static string DefaultIconName(string name)
    {
        var normalized = name.Trim().ToLowerInvariant();
        if (normalized.Contains("ubran") || normalized.Contains("odziez") || normalized.Contains("bluz"))
        {
            return "Shirt";
        }

        if (normalized.Contains("but"))
        {
            return "Footprints";
        }

        if (normalized.Contains("elektr"))
        {
            return "Laptop";
        }

        if (normalized.Contains("kosmet"))
        {
            return "Sparkles";
        }

        if (normalized.Contains("dom"))
        {
            return "Home";
        }

        if (normalized.Contains("ksiaz") || normalized.Contains("ksi") || normalized.Contains("book"))
        {
            return "BookOpen";
        }

        return "Tag";
    }

    private static string DefaultColorHex(string name)
    {
        var normalized = name.Trim().ToLowerInvariant();
        if (normalized.Contains("ubran") || normalized.Contains("odziez") || normalized.Contains("bluz"))
        {
            return "#38bdf8";
        }

        if (normalized.Contains("but"))
        {
            return "#8b5cf6";
        }

        if (normalized.Contains("elektr"))
        {
            return "#2563eb";
        }

        if (normalized.Contains("kosmet"))
        {
            return "#f43f5e";
        }

        if (normalized.Contains("dom"))
        {
            return "#14b8a6";
        }

        if (normalized.Contains("ksiaz") || normalized.Contains("ksi") || normalized.Contains("book"))
        {
            return "#f97316";
        }

        return "#64748b";
    }

    private static string? NormalizeIconName(string? iconName)
    {
        var normalized = iconName?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return null;
        }

        return normalized.Length <= MaxIconNameLength ? normalized : normalized[..MaxIconNameLength];
    }

    private static string? NormalizeCategoryName(string? name)
    {
        var normalized = name?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return null;
        }

        return normalized.Length <= MaxCategoryNameLength ? normalized : normalized[..MaxCategoryNameLength].TrimEnd();
    }

    private static string? NormalizeColorHex(string? colorHex)
    {
        var normalized = colorHex?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return null;
        }

        if (!normalized.StartsWith('#'))
        {
            normalized = $"#{normalized}";
        }

        return System.Text.RegularExpressions.Regex.IsMatch(normalized, "^#[0-9a-fA-F]{6}$")
            ? normalized.ToLowerInvariant()
            : null;
    }
}

public sealed record CreateCategoryRequest(string Name, string? IconName, string? ColorHex);

public sealed record UpdateCategoryRequest(string Name, string? IconName, string? ColorHex);

public sealed record CategoryResponse(Guid Id, string Name, string? IconName, string? ColorHex, int ProductCount);
