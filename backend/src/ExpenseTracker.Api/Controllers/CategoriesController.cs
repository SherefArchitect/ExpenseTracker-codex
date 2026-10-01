using System.ComponentModel.DataAnnotations;
using ExpenseTracker.Application.Categories;
using Microsoft.AspNetCore.Mvc;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/categories")]
public sealed class CategoriesController(CategoryService categories) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? search, [FromQuery] bool? isActive, CancellationToken ct)
    {
        // Bound LIKE pattern size; names themselves cannot exceed 100 code units.
        if (search is { Length: > 100 }) return Failure("request.invalid", 400);
        return Ok(await categories.ListAsync(search, isActive, ct));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id, CancellationToken ct) =>
        Respond(await categories.GetAsync(id, ct));

    [HttpPost]
    public async Task<IActionResult> Create(NamesRequest request, CancellationToken ct)
    {
        var result = await categories.CreateAsync(request.NameEn, request.NameAr, ct);
        return result.Code is null
            ? CreatedAtAction(nameof(Get), new { id = result.Category!.Id }, result.Category)
            : Respond(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Rename(int id, NamesRequest request, CancellationToken ct) =>
        Respond(await categories.RenameAsync(id, request.NameEn, request.NameAr, ct));

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> SetActive(int id, StatusRequest request, CancellationToken ct) =>
        Respond(await categories.SetActiveAsync(id, request.IsActive!.Value, ct));

    private IActionResult Respond(CategoryResult result) => result.Code is null
        ? Ok(result.Category)
        : Failure(result.Code, result.Code switch
        {
            "category.notFound" => 404,
            "category.conflict" => 409,
            _ => 400
        }, result.Errors);

    private ObjectResult Failure(string code, int status, IReadOnlyDictionary<string, string[]>? errors = null)
    {
        var details = new ProblemDetails { Status = status, Title = code };
        details.Extensions["code"] = code;
        if (errors is not null) details.Extensions["errors"] = errors;
        return new ObjectResult(details) { StatusCode = status, ContentTypes = { "application/problem+json" } };
    }

    public sealed record NamesRequest(string? NameEn, string? NameAr);
    public sealed record StatusRequest([Required] bool? IsActive);
}
