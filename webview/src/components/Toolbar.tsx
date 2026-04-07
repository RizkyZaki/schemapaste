import type { BackendMigrationTarget } from "@schemapaste/core";
import type { SqlDialect } from "../types/schema";

interface ToolbarProps {
  dialect: SqlDialect;
  onDialectChange: (dialect: SqlDialect) => void;
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
      className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text transition hover:bg-white/10"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function Toolbar({
  dialect,
  onDialectChange,
  onAutoLayout,
  onFitView,
  onExportSvg,
  onExportPng,
  onExportMigration,
  onSaveSchema,
  onLoadSchema,
  isParsing
}: ToolbarProps): JSX.Element {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-panel/70 p-2">
      <select
        value={dialect}
        onChange={(event) => onDialectChange(event.target.value as SqlDialect)}
        className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
      >
        <option value="mysql">MySQL</option>
        <option value="postgresql">PostgreSQL</option>
        <option value="sqlite">SQLite</option>
      </select>
      <ActionButton label="Auto Layout" onClick={onAutoLayout} />
      <ActionButton label="Fit View" onClick={onFitView} />
      <ActionButton label="Export SVG" onClick={onExportSvg} />
      <ActionButton label="Export PNG" onClick={onExportPng} />
      <ActionButton label="Export Laravel" onClick={() => onExportMigration("laravel")} />
      <ActionButton label="Export Prisma" onClick={() => onExportMigration("prisma")} />
      <ActionButton label="Export Knex" onClick={() => onExportMigration("knex")} />
      <ActionButton label="Export Sequelize" onClick={() => onExportMigration("sequelize")} />
      <ActionButton label="Export TypeORM" onClick={() => onExportMigration("typeorm")} />
      <ActionButton label="Save JSON" onClick={onSaveSchema} />
      <ActionButton label="Load JSON" onClick={onLoadSchema} />
      <div className="ml-auto text-xs text-muted">{isParsing ? "Parsing..." : "Live"}</div>
    </div>
  );
}
