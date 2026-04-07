import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ErdNodeData } from "../types/schema";

function Badge({ label, className }: { label: string; className: string }): JSX.Element {
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${className}`}>{label}</span>;
}

export function TableNode({ data }: NodeProps<{ tableName: string; columns: ErdNodeData["columns"] }>): JSX.Element {
  return (
    <div className="w-[280px] rounded-xl border border-border bg-surface/95 text-text shadow-glow">
      <div className="border-b border-border bg-accent/20 px-3 py-2 text-sm font-semibold tracking-wide">{data.tableName}</div>
      <div className="max-h-[220px] overflow-auto p-2">
        {data.columns.map((column) => (
          <div key={column.name} className="mb-1 flex items-center justify-between rounded-md px-2 py-1 text-xs hover:bg-white/5">
            <div className="min-w-0">
              <div className="truncate font-medium">{column.name}</div>
              <div className="truncate text-[10px] text-muted">{column.dataType}</div>
            </div>
            <div className="ml-2 flex gap-1">
              {column.isPrimaryKey ? <Badge label="PK" className="bg-cyan-600/30 text-cyan-200" /> : null}
              {column.isForeignKey ? <Badge label="FK" className="bg-emerald-600/30 text-emerald-200" /> : null}
              {column.isUnique ? <Badge label="UQ" className="bg-orange-600/30 text-orange-200" /> : null}
              {!column.nullable ? <Badge label="NN" className="bg-rose-600/30 text-rose-200" /> : null}
            </div>
          </div>
        ))}
      </div>
      <Handle id="left" type="target" position={Position.Left} className="!h-2 !w-2 !bg-accent" />
      <Handle id="right" type="source" position={Position.Right} className="!h-2 !w-2 !bg-accent" />
    </div>
  );
}
