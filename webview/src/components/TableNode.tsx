import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ErdNodeData } from "../types/schema";

function Badge({ label, className }: { label: string; className: string }): JSX.Element {
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${className}`}>{label}</span>;
}

export function TableNode({ data }: NodeProps<{ tableName: string; columns: ErdNodeData["columns"] }>): JSX.Element {
  return (
    <div className="group w-[280px] rounded-xl border border-border/70 bg-surface/95 text-text shadow-glow backdrop-blur-sm">
      <div className="border-b border-border/70 bg-gradient-to-r from-cyan-500/20 to-emerald-500/10 px-3 py-2 text-sm font-semibold tracking-wide">
        {data.tableName}
      </div>
      <div className="max-h-[220px] overflow-auto p-2">
        {data.columns.map((column) => (
          <div
            key={column.name}
            className="mb-1 flex items-center justify-between rounded-md px-2 py-1 text-xs transition hover:bg-white/5"
          >
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

      <Handle id="target-left" type="target" position={Position.Left} className="!h-2.5 !w-2.5 !bg-cyan-300" />
      <Handle id="source-right" type="source" position={Position.Right} className="!h-2.5 !w-2.5 !bg-cyan-300" />

      <Handle
        id="target-top"
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !bg-emerald-300"
      />
      <Handle
        id="source-bottom"
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !bg-emerald-300"
      />

      <Handle
        id="target-right-alt"
        type="target"
        position={Position.Right}
        style={{ top: "72%" }}
        className="!h-2 !w-2 !bg-cyan-200/90"
      />
      <Handle
        id="source-left-alt"
        type="source"
        position={Position.Left}
        style={{ top: "28%" }}
        className="!h-2 !w-2 !bg-cyan-200/90"
      />
    </div>
  );
}
