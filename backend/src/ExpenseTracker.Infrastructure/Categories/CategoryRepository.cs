using System.Data;
using Dapper;
using ExpenseTracker.Application.Categories;
using ExpenseTracker.Infrastructure.Persistence;
using Microsoft.Data.SqlClient;

namespace ExpenseTracker.Infrastructure.Categories;

public sealed class CategoryRepository(SqlConnectionFactory connections) : ICategoryRepository
{
    public async Task<IReadOnlyList<CategoryDto>> ListAsync(string? search, bool? isActive, CancellationToken ct)
    {
        await using var connection = connections.Create();
        var records = await connection.QueryAsync<CategoryDto>(Command("dbo.usp_Category_List",
            new { Search = search, IsActive = isActive }, ct));
        return records.AsList();
    }

    public async Task<CategoryDto?> GetAsync(int id, CancellationToken ct)
    {
        await using var connection = connections.Create();
        return await connection.QuerySingleOrDefaultAsync<CategoryDto>(
            Command("dbo.usp_Category_GetById", new { Id = id }, ct));
    }

    public async Task<NameConflicts> FindConflictsAsync(string nameEn, string nameAr, int? excludeId, CancellationToken ct)
    {
        await using var connection = connections.Create();
        return await connection.QuerySingleAsync<NameConflicts>(Command("dbo.usp_Category_FindNameConflicts",
            NameParameters(nameEn, nameAr, excludeId, exclude: true), ct));
    }

    public async Task<CategoryDto> CreateAsync(string nameEn, string nameAr, CancellationToken ct) =>
        (await SaveAsync("dbo.usp_Category_Create", null, nameEn, nameAr, ct))!;

    public Task<CategoryDto?> RenameAsync(int id, string nameEn, string nameAr, CancellationToken ct) =>
        SaveAsync("dbo.usp_Category_UpdateNames", id, nameEn, nameAr, ct);

    public async Task<CategoryDto?> SetActiveAsync(int id, bool isActive, CancellationToken ct)
    {
        await using var connection = connections.Create();
        return await connection.QuerySingleOrDefaultAsync<CategoryDto>(Command("dbo.usp_Category_SetActive",
            new { Id = id, IsActive = isActive }, ct));
    }

    private async Task<CategoryDto?> SaveAsync(string procedure, int? id, string nameEn, string nameAr, CancellationToken ct)
    {
        await using var connection = connections.Create();
        try
        {
            return await connection.QuerySingleOrDefaultAsync<CategoryDto>(
                Command(procedure, NameParameters(nameEn, nameAr, id), ct));
        }
        catch (SqlException error) when (error.Number is 2601 or 2627)
        {
            // Re-query through a stored procedure, including inactive categories.
            var conflicts = await FindConflictsAsync(nameEn, nameAr, id, ct);
            // If another write resolved the conflict before this lookup, retain
            // a generic conflict rather than leaking SQL details.
            throw new CategoryConflictException(conflicts);
        }
    }

    private static DynamicParameters NameParameters(string nameEn, string nameAr, int? id, bool exclude = false)
    {
        var parameters = new DynamicParameters();
        // Explicit MAX matches procedure declarations; never truncate before SQL validation.
        parameters.Add("NameEn", nameEn, DbType.String, size: -1);
        parameters.Add("NameAr", nameAr, DbType.String, size: -1);
        if (exclude) parameters.Add("ExcludeId", id);
        else if (id.HasValue) parameters.Add("Id", id.Value);
        return parameters;
    }

    private static CommandDefinition Command(string procedure, object parameters, CancellationToken ct) =>
        new(procedure, parameters, commandType: CommandType.StoredProcedure, cancellationToken: ct);
}
