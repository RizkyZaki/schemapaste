# Performance Guidelines for Large Schemas

## Parsing

- Parse only on debounced updates.
- Use incremental parsing if parser supports AST diff.
- Offload heavy parsing to worker/thread where possible.

## Rendering

- Virtualize node content for large table lists.
- Keep renderer input minimal (normalized schema only).
- Avoid full graph relayout on small source edits.

## Storage

- Persist compact workspace metadata and line settings.
- Store large source snapshots in chunks if needed.
- Keep history index separate from full payload for fast sidebar load.

## Commands and Sidebar

- Lazy load workspace details only when opening item.
- Cache sorted/searchable list in-memory during active session.
- Batch repository updates for burst edits.

## Export

- Stream large export payloads for PDF/PNG.
- Use background tasks for heavy conversion exports.
- Track export telemetry for bottleneck monitoring.
