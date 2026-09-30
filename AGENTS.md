# Project-wide development rules

## Working practices

- Read the existing project structure and relevant code before making changes.
- Preserve unrelated user changes.
- Do not install, remove, or upgrade dependencies without user approval.
- Do not run commands that modify unrelated files without user approval.
- Do not commit or push unless explicitly requested.

## Frontend

- Preserve the existing React, TypeScript, Vite, and Metronic stack.
- Reuse existing Metronic components where appropriate.
- Keep UI presentation components thin; separate business logic and data access from presentation.

## Backend

- Use ASP.NET Core Web API on .NET 10 with Clean Architecture.
- Keep project dependencies directed inward: Application references Domain; Infrastructure references Application and Domain; API references Application and Infrastructure.
- Keep business rules in Domain and use-case orchestration in Application.
- Keep controllers thin and use Program.cs as the composition root.
- Keep Dapper and SQL Server access in Infrastructure. All backend database operations must use SQL Server stored procedures through Dapper.
- Never use Entity Framework Core.
- Never use inline SQL in application code.

## Verification

- Build and verify affected projects before declaring a task complete.
- For changes that do not affect executable code, verify the changed files directly.
- Report any verification failures or checks that could not be completed.
