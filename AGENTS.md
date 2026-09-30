# Expense Tracker development guide

This repository is a personal Expense Tracker with a Metronic React frontend and an ASP.NET Core Web API targeting .NET 10.

## Structure
- `frontend/src/features/expenses`: first feature, API client and expense page.
- `frontend/src/components/ui`: existing Metronic/ReUI components; reuse these before introducing alternatives.
- `frontend/src/components/layouts/layout-1`: active responsive application shell.
- `frontend/src/config/expense-tracker.config.tsx`: application navigation.
- `backend/ExpenseTracker.Api/Features/Expenses`: endpoint, model and persistence code.
- Other Metronic layouts and demo files remain as development references; do not add them to application navigation by default.

## Local development
- Frontend: `cd frontend`, `npm ci`, `npm run dev` (use `npm.cmd` in PowerShell if script execution is restricted).
- Backend: `dotnet run --project backend/ExpenseTracker.Api` on `http://localhost:5080`.
- Vite proxies `/api` to the backend. Keep backend requests in the feature API client.
- Verify frontend changes with `npm run build` and targeted ESLint checks without `--fix`.
- Verify backend changes with `dotnet build backend/ExpenseTracker.Api` and HTTP checks for changed endpoints, including validation failures.

## Conventions
- Organize application code by feature; keep components typed and reuse Metronic styling, layout, accessibility and theme support.
- Keep API contracts aligned with TypeScript models. Show loading, empty, failure and saving states.
- Validate all writes on the server. Use decimal for amounts and DateOnly for expense dates.
- The initial app uses SAR and local JSON persistence in `App_Data/expenses.json`. This is a single-process local bootstrap, not a database or authenticated multi-user service.
- Do not silently discard or reset expense data. Keep local expense data, build outputs, secrets and dependencies out of Git.
- Database, authentication, budgets, recurring expenses and multi-currency support require explicit design when added.
- Preserve unrelated user changes. Do not commit, publish or deploy unless requested.
