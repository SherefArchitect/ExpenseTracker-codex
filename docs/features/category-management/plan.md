# Category Management implementation plan

Status: Technical plan approved and application implementation completed. The user confirmed successful manual database script application and successful verification-script execution. Builds and application behavioral tests pass; the complete structural schema comparison/current-schema reference remains pending actual user-supplied verification output. See verification.md.

Database workflow approved per the user's instructions: engineering changes remain manually applied; normal application test-data operations are allowed after successful application confirmation. Direct database inspection by Codex is not authorized.

Requirements source: [feature.md](feature.md), approved by the user on 2026-09-30. Engineering constraints: [AGENTS.md](../../../AGENTS.md), [PROJECT.md](../../PROJECT.md), and [DATABASE.md](../../DATABASE.md).

## Technical approach

Implement a vertical feature through the existing Domain, Application, Infrastructure, API, and React layers. Use SQL Server persistence exclusively through Dapper stored-procedure calls. Reuse installed frontend libraries and Metronic components. No dependency installation, removal, or upgrade is planned; any later dependency need requires user approval.

Provide list, create, rename, and activation operations. Do not provide deletion operations in the UI, API, repository, or stored procedures. Categories are shared and have no user ownership field. Future Expenses and Budgets will reference the stable category ID and use the active-only list for new assignments.

Use server-side search and status filtering for a single authoritative list contract. Pagination is outside this first delivery. Sort deterministically by English name and ID initially; the UI displays both names regardless of interface language.

## Existing architecture and implementation baseline

- `backend/ExpenseTracker.slnx` contains four .NET 10 projects with the required inward references already in place.
- Domain has no category model. Application and Infrastructure have empty registration methods. API has a health controller and the existing exception/Problem Details pipeline.
- Infrastructure already references Dapper and Microsoft.Data.SqlClient. `appsettings.json` provides `ConnectionStrings:DefaultConnection` for local SQL Server database `ExpenseTrack_codex`; connectivity and actual schema have not been verified.
- No `Database/` directory or recorded schema/change history exists. This does not prove that the real database is empty.
- Frontend routing currently exposes Home inside Layout1. Sidebar and breadcrumb use `MENU_SIDEBAR`. The frontend has Metronic UI components, `react-intl`, React Hook Form, and Zod, but no wired language provider or category data access.
- Vite has no `/api` proxy. The backend development launch profile uses port 5080.
- `frontend/src/features/expenses/expenses-page.tsx` is not routed and references a missing `./api` module. Do not activate or repair this incomplete expense feature as part of Category Management.
- The frontend TypeScript include list is deliberately narrow. Add reachable category modules through the routing import graph rather than broadening it to unrelated unfinished files.
- README describes an older bootstrap and outdated backend paths. Update relevant run/API guidance during implementation to match the actual architecture; do not imply the old expense endpoints exist.

## Architecture impact

| Layer | Responsibility |
| --- | --- |
| Domain | Category identity, required trimmed names, length validation, rename, activation/deactivation |
| Application | Category use cases, DTOs, repository interface, uniqueness orchestration, typed outcomes |
| Infrastructure | SQL connection creation, Dapper repository, stored-procedure execution, SQL error translation |
| API | Request/response mapping, HTTP status codes, development access restriction |
| Frontend | Typed HTTP client, feature state hook, thin list/form components, localization |

Domain must not reference persistence or HTTP. Application must not reference SqlClient or Dapper. Infrastructure implements Application contracts. Keep controllers thin and register services through the existing registration methods invoked from `Program.cs`.

## Backend changes

### Domain and Application

- Introduce `Category` with `Id`, `NameEn`, `NameAr`, and `IsActive`. Use an integer identity assigned by persistence; new categories are active.
- Trim names before validation and storage using one defined whitespace policy shared by backend and frontend. Require each trimmed name to have 1-100 UTF-16 code units, matching .NET string length, browser input limits, and SQL `nvarchar(100)` storage.
- Define English uniqueness as case-insensitive with no accent folding; Arabic uniqueness uses exact trimmed text without spelling, diacritic, or letter normalization. The implementation must use matching application and database comparison behavior, with representative Unicode cases verified before finalizing the SQL script.
- Define `ICategoryRepository` in Application with list, get-by-ID, duplicate-name lookup, create, rename, and set-active methods. All persistence operations, including reads and duplicate checks, use stored procedures.
- Orchestrate duplicate checks excluding the current category during rename. Database uniqueness remains authoritative under concurrent requests; translate constraint violations into field-specific conflicts where possible.
- Return typed validation, conflict, and not-found outcomes. Keep SQL exceptions inside Infrastructure. Pass cancellation tokens from HTTP requests through use cases and repository calls.
- Renaming does not change status or ID. Setting status is idempotent and does not rename the category. Concurrent valid renames use last successful write; optimistic edit versioning is outside this delivery.

### API contract

Category response: `{ id, nameEn, nameAr, isActive }`.

| Method and route | Input | Success |
| --- | --- | --- |
| `GET /api/categories` | Optional `search` and `isActive=true/false`; omitted status includes all | `200` category array |
| `GET /api/categories/{id}` | Positive integer ID | `200` category |
| `POST /api/categories` | `{ nameEn, nameAr }` | `201` category with Location header |
| `PUT /api/categories/{id}` | `{ nameEn, nameAr }` | `200` updated category |
| `PATCH /api/categories/{id}/status` | `{ isActive }` | `200` updated category |

- Search matches a literal substring of either name; English search ignores case and Arabic search uses the agreed exact comparison. Trim the search value and treat an empty value as no search. Escape SQL LIKE metacharacters inside the list procedure so user input is literal.
- Reject malformed IDs, query values, JSON, and invalid names with `400`; return `404` for missing categories and `409` for duplicate names. Invalid requests must not reach a write operation.
- Use Problem Details with stable machine-readable error codes and field keys for frontend localization. Unexpected failures return a generic `500` without exposing SQL details; log diagnostics on the server.
- Require names and status explicitly in their request models; a missing status must not silently deactivate a category through a default boolean value.

### Development access and composition

- Allow unauthenticated category access only while the API is running in Development. Until Authentication is implemented, do not map category routes outside Development; health behavior remains intact. This environment restriction is not authentication or an Admin role implementation.
- Add a clear backend comment and README note that category management requires proper Admin authorization when Authentication is added, and that Users will consume active categories in other features.
- Bind SQL connection creation to the existing `DefaultConnection`, using a connection factory configured in `Program.cs`. Open/dispose connections per operation; do not keep a singleton open connection.
- No startup schema initialization, seed writes, automatic migrations, database creation, or database write health probes. Missing connectivity is reported as a setup/runtime failure without modifying the database.

## Frontend changes

- Add `/categories` inside the existing Layout1 routing and add a Category Management navigation entry. Preserve the Home route.
- Put HTTP calls and response/error parsing in a typed category API module. Use same-origin `/api` requests and add a development Vite proxy to the existing backend port 5080.
- Keep fetching, debounced search, status filters, mutation state, and reload orchestration in a feature hook. Abort superseded list requests and prevent stale responses from replacing newer results.
- Reuse Card, Table, Input, Label, Button, Badge, Select, Dialog, and Alert components where appropriate. Show both names, status, Edit, and Activate/Deactivate actions; provide no delete control.
- Use a shared create/edit form with React Hook Form and Zod. Duplicate-name authority remains on the server. Retain entered values on failure; disable repeated submissions while pending. Close the form only after successful saves or explicit cancellation.
- After a successful mutation, refresh the list with current filters. A changed category may disappear from the current filter; report the successful operation clearly. If refresh fails after a successful save, communicate both results without implying the save failed.
- Distinguish initial catalog empty state, no filter matches, loading, and load failure. Retrying must preserve search/filter values. Use field errors and an accessible operation status for failures and successes.

### Arabic, English, and direction

- Wire the installed `react-intl` through a small locale provider with `en` and `ar` message catalogs. Start with English, offer a visible language selector, and persist the selection in local storage with a safe fallback.
- Set document `lang` and `dir` on language change. Provide Radix direction context where reused components need it; ensure portal content follows the selected direction.
- Translate all category text, validation/errors, loading and empty states, dialog actions, statuses, and accessible labels. Translate the shell navigation, breadcrumb, language selector, and header text encountered on this feature without launching a full application translation effort.
- Display English-name fields/cells with `lang="en"` and LTR direction, and Arabic-name fields/cells with `lang="ar"` and RTL direction, regardless of interface language.
- Prefer logical CSS properties and start/end alignment. Review shared layout styles, table alignment, breadcrumb chevrons, dialog close controls, and mobile navigation. Change physical positioning only where necessary for this screen; mobile navigation opens from the right in Arabic.
- Ensure form labels, focus order, keyboard navigation, and small-screen layout work in both languages. Do not rely on status color alone.

## Database changes

The following describes planned artifacts only. Prepare exact SQL during implementation after the user supplies the required development database inspection results. Do not use `sqlcmd`, another direct database client, an ad hoc connection script, or a tool to inspect/query the development database unless the user explicitly approves another access mechanism later. Normal application/API/UI access after the database gate is distinct from direct database inspection.

### Table and stored procedures

- Add `dbo.Categories` with `Id int IDENTITY` primary key, required `NameEn nvarchar(100)`, required `NameAr nvarchar(100)`, and `IsActive bit` defaulting to true. No ownership, currency, icon, or seed data.
- Enforce nonempty trimmed names and unique names across all statuses. Use explicit comparison/normalization keys or collations selected to match the agreed English and Arabic rules; do not inherit unknown database defaults. Verify case, accents, trailing whitespace, and Arabic variants. The original names remain available for display.
- Prepared script uses `Latin1_General_100_CI_AS` for English (case-insensitive, accent-sensitive) and `Latin1_General_100_BIN2` for exact Arabic comparison. Database conflict lookup and unique constraints are authoritative; application duplicate checks use the repository rather than a separate .NET collation approximation.
- Add schema-bound helper `dbo.ufn_Category_Trim` to share the .NET whitespace trimming policy with SQL validation and search. Frontend validation must use this same explicit whitespace set, including U+0085 and excluding U+FEFF, rather than relying on JavaScript's different native trim set. Names remain limited to 100 UTF-16 code units. SQL parameters accept `nvarchar(max)` so overlength names are rejected before storage instead of silently truncating.
- The script targets SQL Server 2012 or newer; user-supplied verification will report the actual server version. It refuses a different database, an existing transaction, or an unexpectedly nonempty database; all new objects are created inside one transaction without overwriting existing objects.
- Prepare procedures `dbo.usp_Category_List`, `dbo.usp_Category_GetById`, `dbo.usp_Category_FindNameConflicts`, `dbo.usp_Category_Create`, `dbo.usp_Category_UpdateNames`, and `dbo.usp_Category_SetActive`.
- Include `SET NOCOUNT ON`, explicit returned columns, parameterized values, and deterministic list ordering. Write procedures validate inputs defensively and return the affected category or an explicit not-found outcome. Use unique constraints to prevent concurrent duplicate creation/rename; make each write atomic.
- Infrastructure invokes each procedure asynchronously with `CommandType.StoredProcedure`. No SQL statements are embedded in application code; no Entity Framework Core.
- Future Expenses/Budgets must use category-ID references and validate active status for new assignments. Do not create their tables or migrate the incomplete expense bootstrap in this feature.

### Mandatory manual database gate

1. Tell the user exactly what inspection is needed and wait for their results. Request: target server/database identity and SQL Server version; whether the database exists; existing user-defined schemas, tables, columns, constraints, indexes, and stored procedures with their definitions; any existing category objects; and any previously applied change history. Compare the supplied results with repository artifacts and stop affected work if unexplained drift exists. Do not assume an empty database, connect directly to inspect it, or create one automatically.
2. Prepare the next numbered change script, expected to be `Database/Changes/001_CreateCategories.sql` if no intervening history exists. Include only the reviewed category objects and no seed records. If the database itself needs provisioning, present that separately for manual application.
3. The manual gate covers database engineering changes: schema, tables, columns, constraints, indexes, stored procedures, database deployment/change scripts, and destructive database operations. Show the exact approved script and expected effects, then stop and wait for the user to apply it manually and explicitly confirm success. Codex must not execute these changes through clients, application code, or tests. Destructive operations also require explicit approval and remain manually applied.
4. After confirmation, request the resulting schema/object definitions and relevant verification results from the user. State the exact checks needed: category column types/nullability/defaults, primary key and uniqueness/validation constraints, indexes and comparison behavior, and the definitions of all six category procedures. Verify those supplied results against the approved script. Only after successful verification create/update `Database/Schema/ExpenseTracker.CurrentSchema.sql` to represent the complete verified schema, including existing objects. Do not directly query the database to perform this verification.
5. Continue database-dependent integration only after confirmation and verification. Applied scripts are immutable; corrections require a new numbered script and the same gate.
6. Once the user has manually applied and explicitly confirmed the approved database change script, normal development/test data operations through the application/API/UI are allowed without further manual approval. Codex may create, rename/update, activate, deactivate, and read test Category records through those normal paths as part of verification. This does not authorize direct-client SQL access, engineering changes, destructive operations, or category deletion. Keep test records identifiable; deactivate them through the application when appropriate rather than deleting them.

## Files/components expected to change

Paths below describe the implementation locations. The current-schema reference remains uncreated pending structural verification evidence.

| Area | Expected paths |
| --- | --- |
| Domain | `backend/src/ExpenseTracker.Domain/Categories/Category.cs` and name-validation rules |
| Application | `backend/src/ExpenseTracker.Application/Categories/` for repository contract, DTOs, use cases, outcomes; existing `DependencyInjection.cs` |
| Infrastructure | `backend/src/ExpenseTracker.Infrastructure/Categories/CategoryRepository.cs`, `Persistence/SqlConnectionFactory.cs`, existing `DependencyInjection.cs` |
| API | `backend/src/ExpenseTracker.Api/Controllers/CategoriesController.cs`, category request contracts/error mapping, `Program.cs`; configuration only if needed |
| Database | Next `Database/Changes/NNN_CreateCategories.sql`; `Database/Schema/ExpenseTracker.CurrentSchema.sql` only after manual application confirmation and verification |
| Feature UI | `frontend/src/features/categories/` for types, API client, validation, feature hook, page, form, list |
| Localization | `frontend/src/i18n/` provider and English/Arabic messages; `frontend/src/App.tsx` |
| Routing and shell | `frontend/src/routing/app-routing-setup.tsx`, `frontend/src/config/layout-1.config.tsx`, menu type/rendering, breadcrumb, header, and necessary Layout1 direction adjustments |
| Development transport | `frontend/vite.config.ts` |
| Documentation | `README.md`, this plan, and the feature specification's workflow status if implementation begins |
| Verification | `backend/tests/ExpenseTracker.Verification/`, `frontend/tests/category-verification.mjs`, `scripts/verify-category-api.mjs`, and `scripts/verify-category-browser.mjs` use existing tooling without new packages |

## Verification and testing approach

### Build, isolated tests, and static checks

- Build `backend/ExpenseTracker.slnx` and run `npm.cmd run build` from `frontend`. Do not install packages to make these checks pass without approval.
- Use a dependency-free .NET verification harness if needed to test Domain and Application with in-memory repository fakes. Cover trimmed required names, 100/101-character boundaries, English case duplicates, exact Arabic comparison, inactive duplicates, self-exclusion on rename, not-found outcomes, identity preservation, and idempotent status changes.
- Use existing frontend tooling and mocked HTTP responses for form retention, field-error mapping, search/filter behavior, superseded requests, mutation/refetch failures, and RTL/LTR states. Any added test package requires separate approval; do not assume a test framework is installed.
- Perform browser visual and keyboard checks against mocked category data in English/Arabic at desktop/mobile widths. Mock mutations must not reach the real API or SQL Server.
- Verify endpoint registration outside Development without database writes. Review that no delete route/procedure/UI action exists and that health remains available.
- Do not inspect schema or invoke procedures through a direct database client. Schema verification uses user-supplied inspection results. After the manual gate, automated integration setup and verification may create/read/update/activate/deactivate identifiable test categories through the normal application/API/UI; cleanup may deactivate them, but must not delete records or alter database objects.
- Use read-only/scoped lint checks; the existing `npm.cmd run lint` includes `--fix` and `format` rewrites the project, so neither should be run across unrelated files.

### Database-backed application verification after the manual gate

After the user confirms successful application of the approved script and supplies the schema verification results, run normal application/API/UI checks for: initial empty catalog before creating test records; successful bilingual creation; blank/overlength/duplicate rejection; uniqueness including inactive names; rename preserving ID/status; deactivate/reactivate persistence; case and Arabic comparison; search/filter behavior; and restart persistence. Verify concurrent duplicate submissions through the API where practical. No separate manual approval is required for these normal test-data operations.

Record the manual script application confirmation, user-supplied schema verification evidence, and application test results separately. For any required direct database inspection, tell the user exactly what needs checking and wait for their results unless another access mechanism is explicitly approved later. Report unperformed end-to-end or concurrency checks as unverified; unit tests alone do not establish SQL behavior. Do not delete test records; deactivate identifiable test categories if retirement is needed.

### Acceptance coverage

| Feature acceptance criteria | Verification |
| --- | --- |
| 1: Create and persist without Authentication in development | Mocked checks plus application/API/UI creation, restart, and retrieval after the manual gate |
| 2: Validation and duplicate rejection | Domain/Application fake tests and application/API/UI validation, duplicate, and concurrency checks |
| 3: Rename preserving identity | Fake tests and application/API/UI rename/read-back |
| 4: Search/filter and empty results | Mocked UI checks and application/API/UI list/search/filter checks with normal test records |
| 5: Activation lifecycle | Fake tests and application/API/UI status changes; future Expenses/Budgets selection/history remains deferred |
| 6: Loading, retry, failure retention | Mocked failure and race scenarios |
| 7: Arabic/English and direction | Translation review and browser visual/keyboard checks |
| 8: Empty initial catalog | No-seed script review, application/API/UI initial list before test-data creation, mocked empty UI |
| 9: Authorization follow-up documented | README/code review and non-Development endpoint-registration check |

## Implementation sequence and completion conditions

1. Obtain final plan approval and a user instruction to proceed with implementation. The current instruction authorizes editing this plan only. Recheck working-tree changes and preserve unrelated work when implementation is authorized.
2. Give the user the exact database inspection checklist above and wait for results. Compare supplied schema/history with repository artifacts, resolve any drift, then prepare the exact category script. Present it and pause for manual application and explicit successful-execution confirmation. Do not inspect the database directly.
3. Following successful user application confirmation, request and verify user-supplied resulting schema evidence and update the schema reference only after verification. Complete Domain, Application, Infrastructure, and API integration in dependency order. Normal application/API/UI test data operations are now permitted without separate manual approval.
4. Wire localization/direction, category state and presentation, navigation, and the development proxy. Update relevant documentation.
5. Run builds, isolated automated checks, and database-backed application/API/UI tests, including create/update/activate/deactivate test records. Record results and the prior database application confirmation. For additional schema inspection, state exactly what is needed and wait for user-provided results.
6. Report results and limitations. Do not declare unverified SQL writes or deferred Expenses/Budgets behavior complete. Do not commit or push unless requested.

No requirements questions remain. The user approved the plan, authorized implementation, confirmed an empty database, and confirmed successful manual application and verification-script execution. Normal application/API/UI operations were used to verify behavior after that confirmation. Complete schema documentation still requires the actual user-supplied metadata/definitions; do not infer a verified schema reference from successful application tests. Direct database inspection remains unauthorized. Engineering and destructive changes remain subject to the manual gate.
