# Project-wide development rules

## Working practices

- Read the existing project structure and relevant code before making changes.
- Preserve unrelated user changes.
- Do not install, remove, or upgrade dependencies without user approval.
- Do not run commands that modify unrelated files without user approval.
- Do not commit or push unless explicitly requested.

## Feature documentation

For every new feature, create the following documentation:

```text
docs/features/<feature-name>/
├── feature.md
└── plan.md
```

`feature.md` defines **WHAT** the feature must do and includes:

- Purpose
- Functional requirements
- Business rules
- Acceptance criteria
- Out-of-scope items
- Open questions

`plan.md` defines **HOW** the approved feature will be implemented and includes:

- Technical approach
- Architecture impact
- Backend changes
- Frontend changes
- Database changes
- Files/components expected to change
- Verification and testing approach

Follow this workflow for every new feature:

1. Create and agree on `feature.md` first.
2. Do not create the technical plan until the feature requirements are clear.
3. Create `plan.md` before implementation.
4. Do not start implementation until the plan is ready.
5. Keep both files updated if approved requirements or implementation decisions change.

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

## Manual database change gate

This gate applies to every database schema or data change until the user explicitly changes this rule.

1. Codex may analyze and prepare the required SQL change script.
2. Codex must not execute database schema or data changes, whether directly or through tools, application code, or tests.
3. Codex must show the user the exact SQL script/change that needs to be applied.
4. Stop and wait for the user to apply the change manually.
5. The user must explicitly confirm that the script has been applied successfully.
6. Only after that confirmation may Codex continue work that depends on the database change.
7. Never assume that a proposed script has been applied.
8. Never update `Database/Schema/ExpenseTracker.CurrentSchema.sql` as though the database changed before the user confirms successful execution. After confirmation, verify the resulting schema before updating the schema reference.
9. Never perform destructive database operations without explicit approval. Approval does not authorize Codex to execute the change; the user must still apply it manually.

Follow `docs/DATABASE.md` for the database change structure and engineering conventions.

## Verification

- Build and verify affected projects before declaring a task complete.
- For changes that do not affect executable code, verify the changed files directly.
- Report any verification failures or checks that could not be completed.
