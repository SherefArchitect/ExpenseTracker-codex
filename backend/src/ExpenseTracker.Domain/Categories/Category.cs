namespace ExpenseTracker.Domain.Categories;

public sealed class Category
{
    public int Id { get; }
    public string NameEn { get; private set; }
    public string NameAr { get; private set; }
    public bool IsActive { get; private set; }

    public Category(int id, string nameEn, string nameAr, bool isActive = true)
    {
        Id = id;
        NameEn = ValidateName(nameEn);
        NameAr = ValidateName(nameAr);
        IsActive = isActive;
    }

    public void Rename(string nameEn, string nameAr)
    {
        // Validate both fields before changing either field.
        var english = ValidateName(nameEn);
        var arabic = ValidateName(nameAr);
        NameEn = english;
        NameAr = arabic;
    }

    public void SetActive(bool isActive) => IsActive = isActive;

    public static string NormalizeName(string? value) => value?.Trim() ?? string.Empty;
    public static bool IsValidName(string? value) => NormalizeName(value).Length is >= 1 and <= 100;
    private static string ValidateName(string value) => IsValidName(value)
        ? NormalizeName(value)
        : throw new ArgumentException("Category names must contain 1-100 characters after trimming.", nameof(value));
}
