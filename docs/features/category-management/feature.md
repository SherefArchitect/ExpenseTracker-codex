# Category Management

Status: Requirements and technical plan approved. Application implementation and behavioral verification completed after the user confirmed successful manual script application and verification execution. Structural schema evidence and the current-schema reference remain pending; see verification.md.

## Purpose

Provide a manageable set of expense categories that users can use to organize spending and, in future features, configure category budgets and view spending summaries.

Category Management is the first feature in the workflow. This document defines its behavior; implementation details belong in the subsequent `plan.md`.

## Functional requirements

1. Provide a Category Management page accessible through application navigation.
2. List categories with their English name, Arabic name, and active/inactive status. Clearly distinguish loading, empty, and failed states, and allow retry after a failed load.
3. Search categories by either name and filter by active/inactive status, with an option to show all categories.
4. Create a category with English and Arabic names. New categories are active by default.
5. Edit either name without changing the category's identity or breaking existing references.
6. Activate or deactivate a category. Inactive categories remain visible in management and historical records, but are unavailable for new expense or budget assignments.
7. Display field validation and actionable failure messages. Preserve entered values after unsuccessful saves and show successful changes in the list.
8. Support Arabic and English interface text from the first version, with RTL for Arabic and LTR for English on this feature's screens.
9. Persist categories across application restarts.
10. Allow Category Management to be accessible during development without production authorization. Authentication must not block this first feature and must not be implemented as part of it. Proper Admin authorization for category management must be added when Authentication is implemented.

## Business rules

- Categories are a shared application-wide catalog. Admins manage them; Users can use active categories in features such as Expenses and Budgets. During development, the access exception described above applies until Authentication is implemented.
- Both English and Arabic names are required. Each name must contain 1-100 characters after trimming surrounding whitespace; whitespace-only values are invalid.
- Each English name and each Arabic name must be unique within the shared catalog, including inactive categories. English comparisons ignore case and both comparisons ignore surrounding whitespace. Additional Arabic spelling normalization is outside the initial scope.
- Renaming changes the displayed name for existing references; it does not duplicate the category or reassign records.
- Deactivation preserves all existing references and historical reporting. Existing assignments may be retained when editing a record, but an inactive category cannot be newly assigned.
- Deactivation is the only category retirement mechanism. Categories cannot be deleted, regardless of whether they have existing references.
- Categories have no currency or monetary amount; future expenses and budgets continue to use SAR.
- The catalog starts empty, with no default or seed categories.

## Acceptance criteria

1. During development, a person accessing Category Management can create a category with valid English and Arabic names, see it in the list, and retrieve it after an application restart without Authentication being a prerequisite.
2. Blank names, names exceeding 100 characters, and duplicate names are rejected with a clear explanation and no partial save.
3. Editing a category updates its names while preserving its identity and existing references.
4. Searching either name and changing the status filter displays matching categories; a search with no matches shows a clear empty result.
5. Deactivating a category removes it from selection for new assignments while preserving existing assignments; reactivating it makes it selectable again.
6. The page handles loading and service failures clearly, permits retry, and preserves form values after a failed save.
7. Arabic and English views are available from the first version, use the appropriate text and direction, and display category names correctly in both views.
8. The initial catalog contains no categories and shows a clear empty state until the first category is created.
9. Feature documentation clearly states that development access does not provide production authorization and that proper Admin authorization must be added when Authentication is implemented.

Until expense and budget features exist, full verification of category selection and historical references in those features is deferred and must be reported explicitly.

## Out-of-scope items

- Category icons, colors, or other presentation metadata.
- Category deletion; deactivation is the only retirement mechanism.
- Category hierarchy, custom ordering, merging, bulk actions, import, and export.
- Expense entry, budget management, dashboards, and changes to historical financial amounts.
- Authentication, account management, and application-wide localization beyond the support necessary for this feature.
- Personal categories.
- Automatic seeding or execution of database changes. Any required database change must be shown to the user and applied manually, followed by explicit confirmation and verification under `docs/DATABASE.md`.

## Open questions

None. The requirements decisions have been resolved and this specification has been approved by the user.

## Review context

- `docs/PROJECT.md` establishes Admin and User roles, Arabic/English support, and category management. The user's decisions recorded here define category permissions and the initial development access exception.
- At requirements review, the backend contained only the architecture scaffold and a health controller. Category behavior has since been implemented according to the approved plan.
- The existing expense page remains unrouted with its referenced API module absent. Expenses integration is deferred.
- The user confirmed manual application of `Database/Changes/001_CreateCategories.sql`. Behavioral verification is recorded in `verification.md`; the schema reference awaits the actual schema verification output.
