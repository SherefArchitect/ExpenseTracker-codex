using ExpenseTracker.Application.Categories;
using ExpenseTracker.Domain.Categories;

var assertions = 0;
void Check(bool condition, string label)
{
    if (!condition) throw new Exception(label);
    assertions++;
}
foreach (var invalid in new string?[] { null, "", " \t\u0085\u3000", new('a', 101) })
    Check(!Category.IsValidName(invalid), "Invalid name must be rejected");
Check(Category.IsValidName(new string('a', 100)), "100 character boundary");
Check(Category.IsValidName(string.Concat(Enumerable.Repeat("😀", 50))), "100 UTF-16 units");
Check(!Category.IsValidName(string.Concat(Enumerable.Repeat("😀", 51))), "102 UTF-16 units rejected");
Check(Category.NormalizeName("\u0085 Food\u3000") == "Food", "Unicode trim");
Check(Category.NormalizeName("\uFEFFFood\uFEFF") == "\uFEFFFood\uFEFF", "BOM is not whitespace");
var domain = new Category(7, " Food ", " طعام ", false);
Check(domain.NameEn == "Food" && domain.NameAr == "طعام", "Domain normalizes names");
try { domain.Rename("Valid", " "); throw new Exception("Rename must reject invalid second name"); }
catch (ArgumentException) { Check(domain.NameEn == "Food", "Rename is atomic"); }
domain.SetActive(true);
domain.SetActive(true);
Check(domain.Id == 7 && domain.IsActive, "Status is idempotent and preserves identity");

var repository = new FakeRepository();
var service = new CategoryService(repository);
var ct = CancellationToken.None;
var invalidResult = await service.CreateAsync(" ", " ", ct);
Check(invalidResult.Code == "category.validation" && invalidResult.Errors!.Count == 2, "Both fields validated");
Check(repository.Writes == 0, "Invalid request never writes");
var created = (await service.CreateAsync(" Food ", " طعام ", ct)).Category!;
Check(created.NameEn == "Food" && created.NameAr == "طعام" && created.IsActive, "Create active normalized category");
Check((await service.CreateAsync("food", "جديد", ct)).Errors!.ContainsKey("nameEn"), "English case duplicate");
Check((await service.CreateAsync("Other", "طعام", ct)).Errors!.ContainsKey("nameAr"), "Exact Arabic duplicate");
await service.SetActiveAsync(created.Id, false, ct);
Check((await service.CreateAsync("FOOD", "جديد", ct)).Code == "category.conflict", "Inactive names reserved");
var renamed = await service.RenameAsync(created.Id, "Food", "طعام", ct);
Check(renamed.Code is null && !renamed.Category!.IsActive, "Self-exclusion and inactive rename preserve status");
renamed = await service.RenameAsync(created.Id, "Dining", "مطاعم", ct);
Check(renamed.Category!.Id == created.Id && !renamed.Category.IsActive, "Rename preserves identity");
Check((await service.GetAsync(999, ct)).Code == "category.notFound", "Missing get");
Check((await service.RenameAsync(999, "Missing", "مفقود", ct)).Code == "category.notFound", "Missing rename");
Check((await service.SetActiveAsync(999, false, ct)).Code == "category.notFound", "Missing status");
Check((await service.GetAsync(0, ct)).Code == "category.validation", "Invalid identity");
var accents = await service.CreateAsync("Cafe", "قهوة", ct);
Check((await service.CreateAsync("Café", "قَهْوة", ct)).Code is null, "Distinct accents/Arabic exact variants");
Check((await service.CreateAsync("Another", "أكل", ct)).Code is null, "Arabic spelling variant A");
Check((await service.CreateAsync("Another2", "اكل", ct)).Code is null, "Arabic spelling variant B");
repository.NextWriteConflict = new(true, false);
var race = await service.CreateAsync("Race", "سباق", ct);
Check(race.Code == "category.conflict" && race.Errors!.ContainsKey("nameEn"), "Persistence race translated");
repository.NextWriteConflict = new(false, false);
Check((await service.CreateAsync("Race2", "سباق٢", ct)).Code == "category.conflict", "Generic race retains conflict");
Check((await service.ListAsync(null, true, ct)).All(c => c.IsActive), "Active-only consumer list");
Check((await service.SetActiveAsync(created.Id, true, ct)).Category!.IsActive, "Reactivate");
Check((await service.SetActiveAsync(created.Id, true, ct)).Category!.IsActive, "Repeat activation");
Console.WriteLine($"PASS: {assertions} Domain/Application assertions (in-memory repository; no SQL access).");

sealed class FakeRepository : ICategoryRepository
{
    private readonly Dictionary<int, CategoryDto> items = [];
    private int nextId;
    public int Writes { get; private set; }
    public NameConflicts? NextWriteConflict { get; set; }
    public Task<IReadOnlyList<CategoryDto>> ListAsync(string? search, bool? isActive, CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<CategoryDto>>(items.Values.Where(c =>
            (!isActive.HasValue || c.IsActive == isActive) &&
            (string.IsNullOrEmpty(search) || c.NameEn.Contains(search, StringComparison.OrdinalIgnoreCase)
             || c.NameAr.Contains(search, StringComparison.Ordinal))).ToArray());
    public Task<CategoryDto?> GetAsync(int id, CancellationToken ct) => Task.FromResult(items.GetValueOrDefault(id));
    public Task<NameConflicts> FindConflictsAsync(string en, string ar, int? exclude, CancellationToken ct) =>
        Task.FromResult(new NameConflicts(
            items.Values.Any(c => c.Id != exclude && c.NameEn.Equals(en, StringComparison.OrdinalIgnoreCase)),
            items.Values.Any(c => c.Id != exclude && c.NameAr.Equals(ar, StringComparison.Ordinal))));
    public Task<CategoryDto> CreateAsync(string en, string ar, CancellationToken ct)
    {
        Write();
        var category = new CategoryDto(++nextId, en, ar, true);
        items.Add(category.Id, category);
        return Task.FromResult(category);
    }
    public Task<CategoryDto?> RenameAsync(int id, string en, string ar, CancellationToken ct)
    {
        Write();
        if (!items.TryGetValue(id, out var current)) return Task.FromResult<CategoryDto?>(null);
        return Task.FromResult<CategoryDto?>(items[id] = current with { NameEn = en, NameAr = ar });
    }
    public Task<CategoryDto?> SetActiveAsync(int id, bool active, CancellationToken ct)
    {
        Write();
        if (!items.TryGetValue(id, out var current)) return Task.FromResult<CategoryDto?>(null);
        return Task.FromResult<CategoryDto?>(items[id] = current with { IsActive = active });
    }
    private void Write()
    {
        if (NextWriteConflict is { } conflict)
        {
            NextWriteConflict = null;
            throw new CategoryConflictException(conflict);
        }
        Writes++;
    }
}
