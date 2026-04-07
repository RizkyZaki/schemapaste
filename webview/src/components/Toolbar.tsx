import type { BackendMigrationTarget } from "@schemapaste/core";
import type { SqlDialect } from "../types/schema";
import type { SchemaSourceType } from "../store/useSchemaStore";

interface ToolbarProps {
  sourceType: SchemaSourceType;
  onSourceTypeChange: (sourceType: SchemaSourceType) => void;
  dialect: SqlDialect;
  onDialectChange: (dialect: SqlDialect) => void;
  onNewDb: () => void;
  onAutoLayout: () => void;
  onFitView: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onExportMigration: (target: BackendMigrationTarget) => void;
  onSaveSchema: () => void;
  onLoadSchema: () => void;
  isParsing: boolean;
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }): JSX.Element {
  return (
    <button
      type="button"
      className="shrink-0 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text transition hover:bg-white/10"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function Toolbar({
  sourceType,
  onSourceTypeChange,
  dialect,
  onDialectChange,
  onNewDb,
  onAutoLayout,
  onFitView,
  onExportSvg,
  onExportPng,
  onExportMigration,
  onSaveSchema,
  onLoadSchema,
  isParsing
}: ToolbarProps): JSX.Element {
  const onMigrationChange = (value: string): void => {
    if (!value) {
      return;
    }
    onExportMigration(value as BackendMigrationTarget);
  };

  return (
    <div className="mb-2 rounded-xl border border-border bg-panel/70 p-2">
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <select
          value={sourceType}
          onChange={(event) => onSourceTypeChange(event.target.value as SchemaSourceType)}
          className="shrink-0 rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
        >
          <option value="sql">SQL</option>
          <option value="laravel">Laravel</option>
          <option value="prisma">Prisma</option>
          <option value="drizzle">Drizzle</option>
          <option value="typeorm">TypeORM</option>
          <option value="sequelize">Sequelize</option>
          <option value="django">Django</option>
        </select>
        {sourceType === "sql" ? (
          <select
            value={dialect}
            onChange={(event) => onDialectChange(event.target.value as SqlDialect)}
            className="shrink-0 rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
          >
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="sqlite">SQLite</option>
          </select>
        ) : null}
        <ActionButton label="New DB" onClick={onNewDb} />
        <ActionButton label="Auto Layout" onClick={onAutoLayout} />
        <ActionButton label="Fit View" onClick={onFitView} />
        <div className="ml-auto shrink-0 text-xs text-muted">{isParsing ? "Parsing..." : "Live"}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2">
        <ActionButton label="Export SVG" onClick={onExportSvg} />
        <ActionButton label="Export PNG" onClick={onExportPng} />
        <select
          defaultValue=""
          onChange={(event) => {
            onMigrationChange(event.target.value);
            event.target.value = "";
          }}
          className="shrink-0 rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
        >
          <option value="">Export Migration</option>
          <option value="laravel">Laravel</option>
          <option value="prisma">Prisma</option>
          <option value="knex">Knex</option>
          <option value="sequelize">Sequelize</option>
          <option value="typeorm">TypeORM</option>
        </select>
        <ActionButton label="Save JSON" onClick={onSaveSchema} />
        <ActionButton label="Load JSON" onClick={onLoadSchema} />
      </div>
    </div>
  );
}
