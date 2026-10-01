---
name: plan-feature
description: Plan new ExpenseTracker features by clarifying requirements, writing feature.md, and preparing plan.md only after explicit requirements approval. Use when a new feature is requested or its requirements or implementation plan need revision. Planning only; never implement the feature.
---

# Plan Feature

Produce reviewable requirements and an implementation plan for this project. Communicate in the user's language and preserve the user's requested scope.

## Scope and project context

- Read the applicable `AGENTS.md`, relevant project structure, existing feature documents, and code before drafting. Inspect only what is needed to understand the proposed feature.
- Write only `docs/features/<feature-name>/feature.md` and, after requirements approval, `docs/features/<feature-name>/plan.md`. Use a descriptive lowercase kebab-case folder name and reuse the existing folder when revising a feature.
- Do not implement application code, write executable SQL change scripts, change the schema reference, install dependencies, run mutating database operations, commit, or push. Describe proposed changes in the plan instead.
- Follow the architecture and technology rules in `AGENTS.md`. For database-related planning, also read `docs/DATABASE.md` and describe its manual application and confirmation gate; approval of a plan does not authorize database execution.
- Preserve unrelated user changes. Do not overwrite existing approved documents without understanding their current scope and approval state.

## 1. Draft and clarify requirements

Create or update `feature.md` first. Include:

- Purpose
- Functional requirements
- Business rules
- Acceptance criteria with observable outcomes
- Out-of-scope items
- Open questions

Record its status as `Draft` or `Awaiting approval`. Describe WHAT the feature does, without prematurely choosing HOW to implement it.

Use the user's request and existing project behavior to draft what is known. Mark undecided requirements explicitly rather than inventing business rules. Ask concise, grouped questions about missing requirements or decisions that affect scope, behavior, or acceptance. Offer options when useful. Continue independent inspection and requirements drafting while awaiting answers, but do not proceed with work that depends on an unanswered decision.

Incorporate the user's answers into the document. When requirements are clear, link the current `feature.md`, summarize material decisions, and explicitly request approval of that version. Explain that this approval gate is required by this skill. Stop and wait; do not create `plan.md`, even as an empty placeholder, before explicit approval.

Clarification answers, silence, and the original request to add a feature do not count as requirements approval. If approval already exists in the conversation for the unchanged current document, reuse it without asking again. If approval is ambiguous or not established, ask rather than infer it from the file's existence.

## 2. Prepare the implementation plan

Only after explicit approval of clear requirements, mark `feature.md` as `Approved`, noting the user's approval and any conditions. Create or update `plan.md` with status `Awaiting approval`. Include:

- Technical approach
- Architecture impact
- Backend changes
- Frontend changes
- Database changes
- Files/components expected to change
- Verification and testing approach

Ground the plan in inspected code and the approved requirements. Explain concrete implementation steps, data flow, affected components, and meaningful checks. Mark unaffected areas as `None` with a brief reason. Distinguish proposed files and changes from work already performed. Do not claim builds, tests, database changes, or implementation have been completed.

For database changes, describe the proposed schema/stored procedure changes and numbered script location, and include the user-applied SQL gate before dependent implementation or verification. The planning skill does not create or execute the script.

If planning reveals a missing business decision or a required scope change, return to `feature.md`, explain the change, and obtain renewed requirements approval before finalizing the affected plan. Material changes invalidate prior approval of the affected document; mark any dependent existing plan as needing revision rather than silently retaining approval.

Link the current `plan.md`, summarize the approach and unresolved technical decisions, and explicitly request approval of that version. Explain that this approval gate is required by this skill. Stop and wait. Do not interpret requirements approval as plan approval.

## 3. Close planning without implementation

Incorporate plan feedback and seek approval again when material changes are made. After explicit approval, mark `plan.md` as `Approved` and note the approval and any conditions.

Verify the documents directly: all required sections are present, requirements are clear, the plan matches approved scope and project rules, and approval statuses match the conversation. No application build is needed for documentation-only planning.

Return links to both documents and state that planning is complete. Do not start implementation, even after plan approval. Implementation requires a separate explicit user request outside this skill. If the invocation asks for both planning and implementation, complete the approval workflow and hand off the approved documents without implementing.

When resuming in another turn, read the existing documents and available approval history and continue from the last established stage. Never skip either approval gate or treat elapsed time as approval.
