# Personal Expense Tracker

React 19 / TypeScript / Vite frontend using the existing Metronic layout and components, with an ASP.NET Core .NET 10 API.

The first feature supports adding, listing, searching, filtering and deleting expenses, with monthly and all-time totals. Amounts currently use SAR. Categories are provided by the API. Local expense data persists across backend restarts.

## Run locally

Requirements: .NET 10 SDK and Node.js 22.12+ (or a supported newer version).

In one terminal from the repository root:
```powershell
dotnet run --project backend/ExpenseTracker.Api
```

In another terminal:
```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open the Vite URL printed in the terminal (normally http://localhost:5173). The frontend redirects to `/expenses` and proxies `/api` to http://localhost:5080. No environment configuration is required locally; `frontend/.env.example` documents the optional API base URL.

## Verify
```powershell
dotnet build backend/ExpenseTracker.Api
cd frontend
npm.cmd run build
```

## API
- `GET /api/health`: health status.
- `GET /api/categories`: supported categories.
- `GET /api/expenses`: expenses ordered by date descending.
- `GET /api/expenses/{id}`: one expense.
- `POST /api/expenses`: create an expense using `{ "description": "Groceries", "amount": 85.50, "category": "Food", "date": "2026-09-30" }`.
- `DELETE /api/expenses/{id}`: delete an expense.

Writes reject blank descriptions, nonpositive amounts, more than two decimal places, unsupported categories and future dates. The backend stores data in `backend/ExpenseTracker.Api/App_Data/expenses.json`, which is excluded from Git. Back up that file to preserve personal records.

This bootstrap runs locally without authentication. Persistence supports one API process. Before remote deployment, add authentication and a database, and configure hosting to route `/api` to the backend; Vite's development proxy is not included in the production bundle.

Read `AGENTS.md` for development conventions. Unused Metronic components and demo layouts remain available as references.
