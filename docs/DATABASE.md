# Database engineering

## Purpose and technology

This document is the database engineering source of truth for Expense Tracker. It defines the intended database change workflow and conventions; it does not indicate that database artifacts or a connection have already been configured.

- Use SQL Server as the database.
- Keep database access in Infrastructure, using Dapper.
- Perform all application database operations through stored procedures.
- Do not use Entity Framework Core.
- Do not include inline SQL in application code.

## Database change structure

Database artifacts will use the following repository structure:

```text
Database/
├── Schema/
│   └── ExpenseTracker.CurrentSchema.sql
└── Changes/
    └── NNN_<description>.sql
```

`Database/Schema/ExpenseTracker.CurrentSchema.sql` represents the current complete database schema, including stored procedures and other schema objects. Keep it aligned with the verified development database after the user explicitly confirms successful application of each change. Never update it as though a proposed change has been applied before that confirmation.

`Database/Changes/` contains the ordered history of database changes. Every database change must have a new sequential numbered script, using a zero-padded number starting at `001` and a descriptive filename, such as `001_<description>.sql`. Apply scripts in numeric order; do not reuse a number.

Applied change scripts are immutable. Any correction or subsequent modification requires a new numbered script; never edit an already applied script to change its behavior.

## Database change workflow

### Manual database change gate

This gate applies to every database schema or data change until the user explicitly changes this rule.

1. Codex may analyze and prepare the required SQL change script.
2. Codex must not execute database schema or data changes, whether directly or through tools, application code, or tests.
3. Codex must show the user the exact SQL script/change that needs to be applied.
4. Stop and wait for the user to apply the change manually.
5. The user must explicitly confirm that the script has been applied successfully.
6. Only after that confirmation may Codex continue work that depends on the database change.
7. Never assume that a proposed script has been applied.
8. Never update `ExpenseTracker.CurrentSchema.sql` as though the database changed before the user confirms successful execution.
9. Never perform destructive database operations without explicit approval. Approval does not authorize Codex to execute the change; the user must still apply it manually.

### Change preparation and verification

1. Inspect the real development database and compare its schema with the recorded schema and change history before preparing a change.
2. If unexpected schema drift is found, stop the affected change, report the discrepancy, and obtain an explicit resolution. Never silently alter the database or recorded schema to hide drift.
3. Prepare a new script with the next sequential number. Review its expected schema and data effects. Obtain explicit approval before making any destructive database change, including dropping objects, deleting data, or changing structures in a way that can lose data.
4. Show the user the exact new change script and its expected effects. Stop and wait for the user to apply it manually to the real development database and explicitly confirm successful execution.
5. Only after the user's confirmation, verify the resulting schema and affected stored procedure behavior without executing schema or data changes. Any verification requiring such changes must also follow the manual gate. Report failures or incomplete verification; do not represent an unverified change as complete.
6. After the user's confirmation and successful verification, reflect the resulting complete schema in `ExpenseTracker.CurrentSchema.sql` and continue work that depends on the change.

The current schema file is a complete schema reference. Changes to an existing database are made through numbered change scripts. Updating the schema reference alone does not apply or verify a database change.

## Stored procedure conventions

- Name stored procedures using `dbo.usp_<Entity>_<Operation>`.
- Include `SET NOCOUNT ON` in each stored procedure.
- Specify returned columns explicitly; do not use `SELECT *`.
- Use parameters for values rather than interpolating or concatenating values into SQL.

## Application data access conventions

- Invoke stored procedures through Dapper with `CommandType.StoredProcedure`.
- Use asynchronous Dapper calls where practical.
- Pass values as parameters.
- Keep SQL statements out of application code. Application calls identify the stored procedure and supply its parameters; SQL belongs in database scripts and stored procedures.

## Current scope

This document establishes conventions only. Creating the `Database/` folder, schema, tables, stored procedures, or change scripts, configuring a database connection, and creating or configuring MCP are outside this documentation task.
