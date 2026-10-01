using System.Reflection;
using ExpenseTracker.Api.Controllers;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.AspNetCore.Mvc.Controllers;

namespace ExpenseTracker.Api;

// Development access is temporary. Authentication must add proper Admin authorization
// before category management can be enabled outside Development.
public sealed class DevelopmentCategoryControllers(bool isDevelopment) : IApplicationFeatureProvider<ControllerFeature>
{
    public void PopulateFeature(IEnumerable<ApplicationPart> parts, ControllerFeature feature)
    {
        if (!isDevelopment) feature.Controllers.Remove(typeof(CategoriesController).GetTypeInfo());
    }
}
