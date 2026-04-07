import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  reconnectEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type ReactFlowInstance,
  type Node,
  type Edge,
  type OnReconnect,
  type NodeTypes
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo } from "react";
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
  const initialNodes = useMemo<Node[]>(
    () =>
      graph.nodes.map((node) => ({
        ...node,
        draggable: true
      })),
    [graph.nodes]
  );

  const initialEdges = useMemo<Edge[]>(
    () => graph.edges.map((edge) => ({ ...edge, type: "smoothstep" })),
    [graph.edges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onReconnect = useCallback<OnReconnect>(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((currentEdges) => reconnectEdge(oldEdge, newConnection, currentEdges));
    },
    [setEdges]
  );

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  return (
    <div className="h-full w-full rounded-xl border border-border bg-surface/80">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onReconnect={onReconnect}
        edgesReconnectable
        defaultEdgeOptions={{
          type: "smoothstep",
          reconnectable: true,
          interactionWidth: 42,
          style: {
            stroke: "#67E8F9",
            strokeWidth: 2.2
          }
        }}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        onInit={(instance) => onFlowReady(instance)}
      >
        <Background color="rgba(148, 163, 184, 0.15)" gap={22} />
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
