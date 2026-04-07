# Migration Plan: DDL-only to Universal Workspace

## Phase 1: Foundation (Implemented)

- Introduce normalized schema types.
- Add parser registry and adapter contract.
- Provide SQL + Laravel parser samples.
- Add workspace repository with history metadata.
- Add custom editor view type for multi-tab ERD workspaces.
- Add sidebar history tree with workspace commands.
- Add export strategy service and baseline exporters.

## Phase 2: Compatibility Bridge

- Keep existing `schemapaste.openErd` command and map it to `newWorkspace`.
- Continue using existing webview rendering while parser/output architecture evolves.
- Persist state to both legacy panel state and workspace repository.

## Phase 3: Full Universal Input UI

- Add source type selector in webview aligned with parser registry.
- Add parser issue diagnostics panel per workspace.
- Enable conversion actions per source type.

## Phase 4: Advanced Relationship and Export UX

- Add line style inspector UI bound to workspace lineCustomization settings.
- Add PDF exporter and framework conversion exporters.
- Add project reopen/restore session workflow.
