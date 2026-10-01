-- USER-EXECUTED READ-ONLY VERIFICATION. Run after 001_CreateCategories.
-- Return all result sets to Codex; this script does not change schema or data.
SET NOCOUNT ON;
SELECT DB_NAME() AS DatabaseName,
       CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(128)) AS ProductVersion;
SELECT s.name AS SchemaName, o.name AS ObjectName, o.type_desc
FROM sys.objects o JOIN sys.schemas s ON s.schema_id = o.schema_id
WHERE o.is_ms_shipped = 0 ORDER BY s.name, o.name;
SELECT c.name AS ColumnName, TYPE_NAME(c.user_type_id) AS DataType,
       c.max_length AS MaxBytes, c.is_nullable, c.is_identity, c.collation_name,
       dc.name AS DefaultName, dc.definition AS DefaultDefinition
FROM sys.columns c
LEFT JOIN sys.default_constraints dc ON dc.object_id = c.default_object_id
WHERE c.object_id = OBJECT_ID(N'dbo.Categories') ORDER BY c.column_id;
SELECT i.name AS IndexName, i.is_unique, i.is_primary_key, i.is_unique_constraint,
       c.name AS ColumnName, ic.key_ordinal
FROM sys.indexes i
JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE i.object_id = OBJECT_ID(N'dbo.Categories') ORDER BY i.name, ic.key_ordinal;
SELECT name AS ConstraintName, definition, is_disabled, is_not_trusted
FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID(N'dbo.Categories');
SELECT o.name AS ObjectName, m.definition, m.is_schema_bound,
       m.uses_ansi_nulls, m.uses_quoted_identifier
FROM sys.sql_modules m JOIN sys.objects o ON o.object_id = m.object_id
WHERE o.is_ms_shipped = 0 ORDER BY o.name;
-- Compile-dependent checks only after metadata has established the correct target and objects.
IF DB_NAME() <> N'ExpenseTrack_codex'
    THROW 51000, 'Verification is running in the wrong database. Select ExpenseTrack_codex.', 1;
IF OBJECT_ID(N'dbo.ufn_Category_Trim', N'FN') IS NULL
    THROW 51000, 'Category trim function is missing or not visible. Share the metadata results and deployment Messages; do not assume deployment succeeded.', 1;
IF OBJECT_ID(N'dbo.Categories', N'U') IS NULL
   OR OBJECT_ID(N'dbo.usp_Category_List', N'P') IS NULL
   OR OBJECT_ID(N'dbo.usp_Category_FindNameConflicts', N'P') IS NULL
    THROW 51000, 'Category deployment is incomplete or objects are not visible. Share the metadata results before continuing.', 1;
EXEC sys.sp_executesql N'SELECT
    CASE WHEN N''Food'' COLLATE Latin1_General_100_CI_AS = N''food'' THEN 1 ELSE 0 END AS EnglishCaseEqualExpected1,
    CASE WHEN N''cafe'' COLLATE Latin1_General_100_CI_AS = N''café'' THEN 1 ELSE 0 END AS EnglishAccentEqualExpected0,
    CASE WHEN N''أكل'' COLLATE Latin1_General_100_BIN2 = N''اكل'' THEN 1 ELSE 0 END AS ArabicSpellingEqualExpected0,
    CASE WHEN N''طعام'' COLLATE Latin1_General_100_BIN2 = N''طَعَام'' THEN 1 ELSE 0 END AS ArabicDiacriticsEqualExpected0,
    dbo.ufn_Category_Trim(NCHAR(9) + NCHAR(160) + N''Food'' + NCHAR(12288)) AS TrimmedExpectedFood;
EXEC dbo.usp_Category_List;
EXEC dbo.usp_Category_FindNameConflicts @NameEn = N''Food'', @NameAr = N''طعام'';';
-- List is expected empty immediately after applying to the confirmed empty database.
-- Expected NameEnExists = 0, NameArExists = 0 before any test records exist.
