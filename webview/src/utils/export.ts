import { toPng, toSvg } from "html-to-image";
import type { ReactFlowInstance } from "@xyflow/react";
import { getNodesBounds } from "@xyflow/react";

export async function exportNodeAsSvg(element: HTMLElement): Promise<string> {
  return toSvg(element, {
    cacheBust: true,
    backgroundColor: "#111827"
  });
}

export async function exportNodeAsPngBase64(element: HTMLElement): Promise<string> {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#111827"
  });
  return dataUrl.replace(/^data:image\/png;base64,/, "");
}

export async function exportErdAsPngBase64(
  canvasElement: HTMLElement,
  flow: ReactFlowInstance,
  padding = 80
): Promise<string> {
  const viewport = canvasElement.querySelector<HTMLElement>(".react-flow__viewport");
  if (!viewport) {
    return exportNodeAsPngBase64(canvasElement);
  }

  const nodes = flow.getNodes().filter((node) => !node.hidden);
  if (nodes.length === 0) {
    return exportNodeAsPngBase64(canvasElement);
  }

  const bounds = getNodesBounds(nodes);
  const exportWidth = Math.max(1, Math.ceil(bounds.width + padding * 2));
  const exportHeight = Math.max(1, Math.ceil(bounds.height + padding * 2));

  const previousTransform = viewport.style.transform;
  viewport.style.transform = `translate(${padding - bounds.x}px, ${padding - bounds.y}px) scale(1)`;

  try {
    const dataUrl = await toPng(viewport, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#111827",
      width: exportWidth,
      height: exportHeight,
      style: {
        width: `${exportWidth}px`,
        height: `${exportHeight}px`
      }
    });

    return dataUrl.replace(/^data:image\/png;base64,/, "");
  } finally {
    viewport.style.transform = previousTransform;
  }
}
