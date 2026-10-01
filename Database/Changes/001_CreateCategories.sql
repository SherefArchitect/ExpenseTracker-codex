-- 001_CreateCategories.sql
-- MANUAL APPLICATION ONLY: review and execute in ExpenseTrack_codex.
-- Requires SQL Server 2012 or newer. Creates no seed records.
-- Confirmed baseline: empty database, no prior change scripts.
-- Single batch with transactional DDL; do not insert GO separators.
-- Dynamic DDL lets each CREATE FUNCTION/PROCEDURE be its own inner batch
-- while preserving one transaction and error handling for the whole change.
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF DB_NAME() <> N'ExpenseTrack_codex'
    THROW 51000, 'Wrong target database. Select ExpenseTrack_codex before applying.', 1;
IF @@TRANCOUNT <> 0
    THROW 51000, 'Apply this script without an existing transaction.', 1;
IF EXISTS (SELECT object_id FROM sys.objects
           WHERE is_ms_shipped = 0 AND type IN ('U','V','P','FN','IF','TF','TR'))
    THROW 51000, 'Expected empty database. Stop and report existing objects; do not overwrite them.', 1;

BEGIN TRY
    BEGIN TRANSACTION;
    EXEC sys.sp_executesql N'CREATE FUNCTION dbo.ufn_Category_Trim(@Value nvarchar(max))
RETURNS nvarchar(max)
WITH SCHEMABINDING
AS
BEGIN
    IF @Value IS NULL RETURN NULL;
    DECLARE @First int = 1, @Last int = DATALENGTH(@Value) / 2, @Code int;
    WHILE @First <= @Last
    BEGIN
        SET @Code = UNICODE(SUBSTRING(@Value COLLATE Latin1_General_100_BIN2, @First, 1));
        IF NOT (@Code BETWEEN 9 AND 13 OR @Code IN (32,133,160,5760,8232,8233,8239,8287,12288) OR @Code BETWEEN 8192 AND 8202) BREAK;
        SET @First += 1;
    END;
    WHILE @Last >= @First
    BEGIN
        SET @Code = UNICODE(SUBSTRING(@Value COLLATE Latin1_General_100_BIN2, @Last, 1));
        IF NOT (@Code BETWEEN 9 AND 13 OR @Code IN (32,133,160,5760,8232,8233,8239,8287,12288) OR @Code BETWEEN 8192 AND 8202) BREAK;
        SET @Last -= 1;
    END;
    RETURN SUBSTRING(@Value COLLATE Latin1_General_100_BIN2, @First, @Last - @First + 1);
END;';

    EXEC sys.sp_executesql N'CREATE TABLE dbo.Categories
(
    Id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Categories PRIMARY KEY,
    NameEn nvarchar(100) COLLATE Latin1_General_100_CI_AS NOT NULL,
    NameAr nvarchar(100) COLLATE Latin1_General_100_BIN2 NOT NULL,
    IsActive bit NOT NULL CONSTRAINT DF_Categories_IsActive DEFAULT (1),
    CONSTRAINT UQ_Categories_NameEn UNIQUE (NameEn),
    CONSTRAINT UQ_Categories_NameAr UNIQUE (NameAr),
    CONSTRAINT CK_Categories_NameEn CHECK
        (DATALENGTH(NameEn) BETWEEN 2 AND 200
         AND DATALENGTH(NameEn) = DATALENGTH(dbo.ufn_Category_Trim(NameEn))),
    CONSTRAINT CK_Categories_NameAr CHECK
        (DATALENGTH(NameAr) BETWEEN 2 AND 200
         AND DATALENGTH(NameAr) = DATALENGTH(dbo.ufn_Category_Trim(NameAr)))
);';

    EXEC sys.sp_executesql N'CREATE PROCEDURE dbo.usp_Category_List
    @Search nvarchar(max) = NULL,
    @IsActive bit = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET @Search = dbo.ufn_Category_Trim(@Search);
    DECLARE @Pattern nvarchar(max) =
        N''%'' + REPLACE(REPLACE(REPLACE(REPLACE(@Search, N''~'', N''~~''), N''%'', N''~%''), N''_'', N''~_''), N''['', N''~['') + N''%'';
    SELECT Id, NameEn, NameAr, IsActive
    FROM dbo.Categories
    WHERE (@IsActive IS NULL OR IsActive = @IsActive)
      AND (@Search IS NULL OR DATALENGTH(@Search) = 0
           OR NameEn LIKE @Pattern COLLATE Latin1_General_100_CI_AS ESCAPE N''~''
           OR NameAr LIKE @Pattern COLLATE Latin1_General_100_BIN2 ESCAPE N''~'')
    ORDER BY NameEn, Id;
END;';

    EXEC sys.sp_executesql N'CREATE PROCEDURE dbo.usp_Category_GetById
    @Id int
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, NameEn, NameAr, IsActive
    FROM dbo.Categories WHERE Id = @Id;
END;';

    EXEC sys.sp_executesql N'CREATE PROCEDURE dbo.usp_Category_FindNameConflicts
    @NameEn nvarchar(max),
    @NameAr nvarchar(max),
    @ExcludeId int = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET @NameEn = dbo.ufn_Category_Trim(@NameEn);
    SET @NameAr = dbo.ufn_Category_Trim(@NameAr);
    IF @NameEn IS NULL OR DATALENGTH(@NameEn) NOT BETWEEN 2 AND 200
        THROW 51001, ''category.nameEn.invalid'', 1;
    IF @NameAr IS NULL OR DATALENGTH(@NameAr) NOT BETWEEN 2 AND 200
        THROW 51002, ''category.nameAr.invalid'', 1;
    SELECT
        CAST(CASE WHEN EXISTS
            (SELECT Id FROM dbo.Categories WHERE NameEn = @NameEn COLLATE Latin1_General_100_CI_AS
             AND (@ExcludeId IS NULL OR Id <> @ExcludeId)) THEN 1 ELSE 0 END AS bit) AS NameEnExists,
        CAST(CASE WHEN EXISTS
            (SELECT Id FROM dbo.Categories WHERE NameAr = @NameAr COLLATE Latin1_General_100_BIN2
             AND (@ExcludeId IS NULL OR Id <> @ExcludeId)) THEN 1 ELSE 0 END AS bit) AS NameArExists;
END;';

    EXEC sys.sp_executesql N'CREATE PROCEDURE dbo.usp_Category_Create
    @NameEn nvarchar(max),
    @NameAr nvarchar(max)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @NameEn = dbo.ufn_Category_Trim(@NameEn);
    SET @NameAr = dbo.ufn_Category_Trim(@NameAr);
    IF @NameEn IS NULL OR DATALENGTH(@NameEn) NOT BETWEEN 2 AND 200
        THROW 51001, ''category.nameEn.invalid'', 1;
    IF @NameAr IS NULL OR DATALENGTH(@NameAr) NOT BETWEEN 2 AND 200
        THROW 51002, ''category.nameAr.invalid'', 1;
    INSERT INTO dbo.Categories (NameEn, NameAr)
    OUTPUT inserted.Id, inserted.NameEn, inserted.NameAr, inserted.IsActive
    VALUES (@NameEn, @NameAr);
END;';

    EXEC sys.sp_executesql N'CREATE PROCEDURE dbo.usp_Category_UpdateNames
    @Id int,
    @NameEn nvarchar(max),
    @NameAr nvarchar(max)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF @Id IS NULL OR @Id <= 0 THROW 51003, ''category.id.invalid'', 1;
    SET @NameEn = dbo.ufn_Category_Trim(@NameEn);
    SET @NameAr = dbo.ufn_Category_Trim(@NameAr);
    IF @NameEn IS NULL OR DATALENGTH(@NameEn) NOT BETWEEN 2 AND 200
        THROW 51001, ''category.nameEn.invalid'', 1;
    IF @NameAr IS NULL OR DATALENGTH(@NameAr) NOT BETWEEN 2 AND 200
        THROW 51002, ''category.nameAr.invalid'', 1;
    UPDATE dbo.Categories SET NameEn = @NameEn, NameAr = @NameAr
    OUTPUT inserted.Id, inserted.NameEn, inserted.NameAr, inserted.IsActive
    WHERE Id = @Id;
END;';

    EXEC sys.sp_executesql N'CREATE PROCEDURE dbo.usp_Category_SetActive
    @Id int,
    @IsActive bit
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF @Id IS NULL OR @Id <= 0 THROW 51003, ''category.id.invalid'', 1;
    IF @IsActive IS NULL THROW 51004, ''category.status.required'', 1;
    UPDATE dbo.Categories SET IsActive = @IsActive
    OUTPUT inserted.Id, inserted.NameEn, inserted.NameAr, inserted.IsActive
    WHERE Id = @Id;
END;';
    COMMIT TRANSACTION;
    PRINT N'001_CreateCategories applied successfully. No seed categories were inserted.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

