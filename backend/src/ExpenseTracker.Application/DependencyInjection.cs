using Microsoft.Extensions.DependencyInjection;
using ExpenseTracker.Application.Categories;

namespace ExpenseTracker.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<CategoryService>();
        return services;
    }
}
