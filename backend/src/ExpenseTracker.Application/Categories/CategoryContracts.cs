namespace ExpenseTracker.Application.Categories;

public sealed record CategoryDto(int Id, string NameEn, string NameAr, bool IsActive);
public sealed record NameConflicts(bool NameEnExists, bool NameArExists);

public interface ICategoryRepository
{
    Task<IReadOnlyList<CategoryDto>> ListAsync(string? search, bool? isActive, CancellationToken cancellationToken);
    Task<CategoryDto?> GetAsync(int id, CancellationToken cancellationToken);
    Task<NameConflicts> FindConflictsAsync(string nameEn, string nameAr, int? excludeId, CancellationToken cancellationToken);
    Task<CategoryDto> CreateAsync(string nameEn, string nameAr, CancellationToken cancellationToken);
    Task<CategoryDto?> RenameAsync(int id, string nameEn, string nameAr, CancellationToken cancellationToken);
    Task<CategoryDto?> SetActiveAsync(int id, bool isActive, CancellationToken cancellationToken);
}

// Infrastructure translates persistence conflicts to this SQL-independent contract.
public sealed class CategoryConflictException(NameConflicts conflicts) : Exception("Category names must be unique.")
{
    public NameConflicts Conflicts { get; } = conflicts;
}

public sealed record CategoryResult(CategoryDto? Category, string? Code = null,
    IReadOnlyDictionary<string, string[]>? Errors = null)
{
    public static CategoryResult NotFound() => new(null, "category.notFound");
}
