import { toPng, toSvg } from "html-to-image";

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
