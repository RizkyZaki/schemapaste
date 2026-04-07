import dagre from "dagre";
import type { ErdGraph } from "../types";

const NODE_WIDTH = 280;
const NODE_HEIGHT = 220;

export function applyAutoLayout(graph: ErdGraph): ErdGraph {
  const layoutGraph = new dagre.graphlib.Graph();
  layoutGraph.setDefaultEdgeLabel(() => ({}));
  layoutGraph.setGraph({
    rankdir: "LR",
    ranksep: 90,
    nodesep: 50
  });

  graph.nodes.forEach((node) => {
    layoutGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  graph.edges.forEach((edge) => {
    layoutGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(layoutGraph);

  const nodes = graph.nodes.map((node) => {
    const layoutNode = layoutGraph.node(node.id) as { x: number; y: number } | undefined;
    return {
      ...node,
      position: {
        x: (layoutNode?.x ?? 0) - NODE_WIDTH / 2,
        y: (layoutNode?.y ?? 0) - NODE_HEIGHT / 2
      }
    };
  });

  return {
    nodes,
    edges: graph.edges
  };
}
