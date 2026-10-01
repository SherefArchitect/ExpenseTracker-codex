using ExpenseTracker.Application;
using ExpenseTracker.Infrastructure;
using ExpenseTracker.Api;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is required."));
builder.Services.AddControllers()
    .ConfigureApplicationPartManager(parts => parts.FeatureProviders.Add(
        new DevelopmentCategoryControllers(builder.Environment.IsDevelopment())))
    .ConfigureApiBehaviorOptions(options => options.InvalidModelStateResponseFactory = context =>
    {
        var details = new ProblemDetails { Status = 400, Title = "request.invalid" };
        details.Extensions["code"] = "request.invalid";
        return new BadRequestObjectResult(details);
    });
builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
{
    context.ProblemDetails.Extensions["code"] =
        context.ProblemDetails.Status >= 500 ? "server.error" : "request.invalid";
    if (context.ProblemDetails.Status >= 500)
    {
        context.ProblemDetails.Title = "The service could not complete the request.";
        context.ProblemDetails.Detail = null;
    }
});
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.MapControllers();

app.Run();
