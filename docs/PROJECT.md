# Expense Tracker

## Purpose

Expense Tracker is a personal expense tracking application that helps users record spending, organize expenses by category, and monitor monthly budgets.

This document is the product source of truth for the intended scope and established high-level technical decisions. It describes what the product will provide; it is not a statement that every feature is already implemented.

## Product scope

- Two application roles: **Admin** and **User**.
- Arabic and English language support.
- Full right-to-left (RTL) support for Arabic and left-to-right (LTR) support for English across the application.
- Saudi riyal (**SAR**) as the only currency for expenses, budgets, and summaries.

Users manage their personal expenses, profile, and monthly budgets. Admins can manage application users. The detailed permissions for category management and administrative actions remain to be defined.

## Main features

### 1. Authentication

- Log in with a username and password.
- Require a password change when an account is marked as requiring one.
- Support forgotten-password recovery and password changes.
- Provide a development-only login bypass for testing. The bypass must be unavailable outside development.

Email delivery is outside the current scope. The forgotten-password recovery flow must be defined without relying on email delivery.

### 2. User profile

- View and update profile information.
- Change the account password.

### 3. Categories

- Manage expense categories used to organize spending.
- Allow categories to support presentation metadata, such as icons, in a later extension. This metadata is not required for the initial scope.

### 4. Expenses

- Create, view, edit, and delete expenses.
- Assign each expense to a category.
- Record the core fields: amount in SAR, date, and description.
- Support optional metadata: merchant, location, payment method, reference, tag/source, and note.

### 5. Monthly budgets

- Configure a budget in SAR for each category for a given month.
- Track category spending against its configured monthly budget.
- Show an alert when spending reaches 80% of the configured budget, including when spending exceeds that threshold.

### 6. Dashboard

- Show a monthly spending summary in SAR.
- Show spending broken down by category.
- Show monthly budget status and applicable budget alerts.

### 7. Admin user management

- Allow users with the Admin role to manage application users.
- Keep application user management restricted to Admins.

## Out of scope for now

- Multi-currency support.
- Recurring expenses.
- Import and export.
- Attachments.
- Two-factor authentication.
- Email delivery.
- Mobile application.
- AI features.

## Established technical decisions

| Area | Decision |
| --- | --- |
| Frontend | React, TypeScript, Vite, and Metronic |
| Backend | ASP.NET Core Web API on .NET 10 |
| Architecture | Clean Architecture with Domain, Application, Infrastructure, and API layers |
| Database | SQL Server |
| Data access | Dapper using SQL Server stored procedures |
| ORM constraint | No Entity Framework Core |

Detailed database engineering rules belong in `docs/DATABASE.md` and are outside this document.
