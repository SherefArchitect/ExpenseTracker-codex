using ExpenseTracker.Domain.Categories;

namespace ExpenseTracker.Application.Categories;

public sealed class CategoryService(ICategoryRepository repository)
{
    public Task<IReadOnlyList<CategoryDto>> ListAsync(string? search, bool? isActive, CancellationToken ct) =>
        repository.ListAsync(Category.NormalizeName(search), isActive, ct);

    public async Task<CategoryResult> GetAsync(int id, CancellationToken ct)
    {
        if (id <= 0) return InvalidId();
        var category = await repository.GetAsync(id, ct);
        return category is null ? CategoryResult.NotFound() : new(category);
    }

    public Task<CategoryResult> CreateAsync(string? nameEn, string? nameAr, CancellationToken ct) =>
        SaveAsync(null, nameEn, nameAr, ct);

    public Task<CategoryResult> RenameAsync(int id, string? nameEn, string? nameAr, CancellationToken ct) =>
        id <= 0 ? Task.FromResult(InvalidId()) : SaveAsync(id, nameEn, nameAr, ct);

    public async Task<CategoryResult> SetActiveAsync(int id, bool isActive, CancellationToken ct)
    {
        if (id <= 0) return InvalidId();
        var current = await repository.GetAsync(id, ct);
        if (current is null) return CategoryResult.NotFound();
        var category = new Category(current.Id, current.NameEn, current.NameAr, current.IsActive);
        category.SetActive(isActive);
        var saved = await repository.SetActiveAsync(category.Id, category.IsActive, ct);
        return saved is null ? CategoryResult.NotFound() : new(saved);
    }

    private async Task<CategoryResult> SaveAsync(int? id, string? nameEn, string? nameAr, CancellationToken ct)
    {
        var errors = new Dictionary<string, string[]>();
        if (!Category.IsValidName(nameEn)) errors["nameEn"] = ["category.name.invalid"];
        if (!Category.IsValidName(nameAr)) errors["nameAr"] = ["category.name.invalid"];
        if (errors.Count > 0) return new(null, "category.validation", errors);

        var category = new Category(0, nameEn!, nameAr!);
        if (id.HasValue)
        {
            var current = await repository.GetAsync(id.Value, ct);
            if (current is null) return CategoryResult.NotFound();
            category = new Category(current.Id, current.NameEn, current.NameAr, current.IsActive);
            category.Rename(nameEn!, nameAr!);
        }
        var conflicts = await repository.FindConflictsAsync(category.NameEn, category.NameAr, id, ct);
        if (conflicts.NameEnExists || conflicts.NameArExists) return Conflict(conflicts);
        try
        {
            var saved = id.HasValue
                ? await repository.RenameAsync(id.Value, category.NameEn, category.NameAr, ct)
                : await repository.CreateAsync(category.NameEn, category.NameAr, ct);
            return saved is null ? CategoryResult.NotFound() : new(saved);
        }
        catch (CategoryConflictException conflict) { return Conflict(conflict.Conflicts); }
    }

    private static CategoryResult InvalidId() => new(null, "category.validation",
        new Dictionary<string, string[]> { ["id"] = ["category.id.invalid"] });

    private static CategoryResult Conflict(NameConflicts conflicts)
    {
        var errors = new Dictionary<string, string[]>();
        if (conflicts.NameEnExists) errors["nameEn"] = ["category.name.duplicate"];
        if (conflicts.NameArExists) errors["nameAr"] = ["category.name.duplicate"];
        return new(null, "category.conflict", errors);
    }
}
