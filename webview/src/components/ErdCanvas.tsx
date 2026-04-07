import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type ReactFlowInstance,
  type Node,
  type Edge,
  type NodeTypes
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import type { ErdGraph } from "../types/schema";
import { TableNode } from "./TableNode";

interface ErdCanvasProps {
  graph: ErdGraph;
  onFlowReady: (api: ReactFlowInstance | null) => void;
}

const nodeTypes: NodeTypes = {
  tableNode: TableNode
};

function ErdCanvasInner({ graph, onFlowReady }: ErdCanvasProps): JSX.Element {
  const nodes = useMemo<Node[]>(
    () =>
      graph.nodes.map((node) => ({
        ...node,
        draggable: true
      })),
    [graph.nodes]
  );

  const edges = useMemo<Edge[]>(() => graph.edges.map((edge) => ({ ...edge, type: "smoothstep" })), [graph.edges]);

  return (
    <div className="h-full w-full rounded-xl border border-border bg-surface/80">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        onInit={(instance) => onFlowReady(instance)}
      >
        <Background color="rgba(148, 163, 184, 0.15)" gap={22} />
        <MiniMap
          pannable
          zoomable
          className="!bg-black/20"
          nodeColor={() => "#38bdf8"}
          maskColor="rgba(0, 0, 0, 0.4)"
        />
        <Controls showInteractive />
      </ReactFlow>
    </div>
  );
}

export function ErdCanvas(props: ErdCanvasProps): JSX.Element {
  return (
    <ReactFlowProvider>
      <ErdCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
