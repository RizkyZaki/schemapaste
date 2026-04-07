# SchemaPaste Scalable Architecture

## Revised Folder Structure

```
src/
  commands/
  sidebar/
  custom-editor/
  webview/
  parsers/
    sql/
    laravel/
    prisma/
    drizzle/
    typeorm/
    sequelize/
    django/
    registry/
  renderers/
  exporters/
    strategies/
  services/
  storage/
  state/
  types/
  utils/
```

## Architecture Principles

- Parser adapters are framework-specific and return a normalized schema model.
- Renderer consumes normalized schema only.
- Workspace persistence is centralized in repository/storage services.
- Sidebar history and custom editor synchronize through repository and command events.
- Export functionality uses strategy pattern.
- Relationship line customization is modeled in normalized schema and workspace state.

## Event Flow

1. User opens or creates workspace from history sidebar.
2. Custom editor loads source + metadata from repository.
3. Parser registry resolves adapter by source type.
4. Parsed normalized schema is persisted and sent to webview.
5. Renderer updates ERD graph from normalized schema.
6. Export service uses selected strategy on current workspace record.
