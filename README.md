# Personal Expense Tracker

React 19, TypeScript, Vite, and Metronic frontend with a .NET 10 ASP.NET Core API using Clean Architecture. Category Management is the first implemented feature. Expenses and Budgets remain future features.

## Category Management

Open `/categories` or choose Category Management in the sidebar. Create and edit shared categories, search either name, filter by status, and activate/deactivate categories. Both English and Arabic names are required, with a maximum of 100 UTF-16 code units after trimming. Names remain unique across active and inactive categories. Deactivation preserves the category; deletion is unavailable.

Use the language selector for English/LTR or Arabic/RTL. The selection persists locally. New categories are active and SQL Server persistence survives API restarts. There are no seed/default categories.

## Run locally

Requirements: .NET 10 SDK, Node.js 22.12+ or a supported newer version, and a configured SQL Server development database.

The configured local connection targets server `.`, database `ExpenseTrack_codex`, with Windows authentication. Override `ConnectionStrings__DefaultConnection` in the API environment if needed; do not commit credentials.

Database engineering changes must be manually reviewed and applied. The first script is [001_CreateCategories.sql](Database/Changes/001_CreateCategories.sql). It requires SQL Server 2012 or newer and an empty target database; do not rerun it against an already initialized database. Use the read-only [verification script](docs/features/category-management/verify-schema.sql) after application.

Start the API from the repository root:

```powershell
dotnet run --project backend/src/ExpenseTracker.Api
```

Start the frontend in another terminal:

```powershell
cd frontend
npm.cmd run dev
```

If dependencies are not installed, install them only with user approval. Vite normally runs at http://localhost:5173 and proxies `/api` to http://localhost:5080. Home remains at `/`.

## Development access and future authorization

Category routes are registered only when the API environment is `Development`. They are temporarily accessible without authentication. Outside Development, category routes return 404; health remains available.

**Proper Admin authorization must be added when Authentication is implemented.** Admins will manage the shared catalog; Users will use active categories in Expenses and Budgets. Do not treat this development access arrangement as production authorization. Authentication is not implemented by this feature.

## API

| Method | Route | Behavior |
| --- | --- | --- |
| GET | `/api/health` | Application health |
| GET | `/api/categories?search=...&isActive=true` | Literal substring search in either name and optional status filter; omit status for all |
| GET | `/api/categories/{id}` | One category |
| POST | `/api/categories` | Create using `{ "nameEn": "Food", "nameAr": "طعام" }` |
| PUT | `/api/categories/{id}` | Rename using both names; preserve identity and status |
| PATCH | `/api/categories/{id}/status` | Set status using `{ "isActive": false }` |

Responses use `{ id, nameEn, nameAr, isActive }`. Search input is limited to 100 code units. Invalid requests return 400, missing records 404, and duplicate names 409. Problem Details includes a stable `code` and field errors where applicable. All database operations use Dapper stored procedures in Infrastructure; no automatic migrations, seed writes, or startup database changes run.

## Verification

```powershell
dotnet build backend/ExpenseTracker.slnx
dotnet run --project backend/tests/ExpenseTracker.Verification
cd frontend
npm.cmd run build
node --import tsx tests/category-verification.mjs
```

The backend console harness uses an in-memory repository and has no new package dependencies.

After manual database change application and successful confirmation, normal application/API/UI test-data operations are allowed:

```powershell
node scripts/verify-category-api.mjs http://localhost:5080
# Restart the API, then verify persistence:
node scripts/verify-category-api.mjs http://localhost:5080 --read-back
```

These checks create identifiable `VERIFY-` test categories and retain them inactive. They never delete records, inspect database metadata directly, or change schema.

With the frontend running and Chrome installed, browser checks use built-in Node/CDP support without extra packages:

```powershell
# Mocked requests: no real Category writes.
node scripts/verify-category-browser.mjs http://127.0.0.1:5173/categories
# Live UI through the Vite proxy: requires the confirmed database change and running API.
node scripts/verify-category-browser.mjs http://127.0.0.1:5173/categories --live
```

Set `CATEGORY_BROWSER` to another Chrome/Edge executable if needed. Reports and screenshots go under ignored `.npm-cache/`. The live browser check leaves its test category inactive.

The existing `lint` script uses `--fix`; use scoped, read-only ESLint commands to avoid rewriting unrelated files. See [verification results](docs/features/category-management/verification.md) for completed checks and current limitations.

Read [feature.md](docs/features/category-management/feature.md) and [plan.md](docs/features/category-management/plan.md) for approved scope and implementation details. The user's approved plan refines the manual database gate: engineering/destructive changes remain manually applied; ordinary test Category operations are permitted through application paths after successful confirmation. Direct database inspection requires separate explicit authorization.
