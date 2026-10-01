using Microsoft.Extensions.DependencyInjection;
using ExpenseTracker.Application.Categories;
using ExpenseTracker.Infrastructure.Categories;
using ExpenseTracker.Infrastructure.Persistence;

namespace ExpenseTracker.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        services.AddSingleton(new SqlConnectionFactory(connectionString));
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        return services;
    }
}
