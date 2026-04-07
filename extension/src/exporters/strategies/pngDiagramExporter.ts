import { PNG } from "pngjs";
import type { ExportArtifact, WorkspaceExportStrategy } from "../types";
import type { ErdWorkspaceRecord } from "../../types/normalizedSchema";

function fillRect(image: PNG, x: number, y: number, w: number, h: number, rgba: [number, number, number, number]): void {
  for (let row = y; row < y + h; row += 1) {
    for (let col = x; col < x + w; col += 1) {
      const idx = (image.width * row + col) << 2;
      image.data[idx] = rgba[0];
      image.data[idx + 1] = rgba[1];
      image.data[idx + 2] = rgba[2];
      image.data[idx + 3] = rgba[3];
    }
  }
}

export class PngDiagramExporter implements WorkspaceExportStrategy {
  readonly format = "png" as const;

  async export(workspace: ErdWorkspaceRecord): Promise<ExportArtifact> {
    const boxWidth = 240;
    const boxHeight = 140;
    const gap = 24;
    const cols = 3;
    const rows = Math.max(1, Math.ceil(workspace.normalizedSchema.tables.length / cols));
    const width = cols * (boxWidth + gap) + gap;
    const height = rows * (boxHeight + gap) + gap;

    const image = new PNG({ width, height, colorType: 6 });
    fillRect(image, 0, 0, width, height, [11, 18, 32, 255]);

    workspace.normalizedSchema.tables.forEach((_, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = gap + col * (boxWidth + gap);
      const y = gap + row * (boxHeight + gap);

      fillRect(image, x, y, boxWidth, boxHeight, [17, 24, 39, 255]);
      fillRect(image, x, y, boxWidth, 4, [103, 232, 249, 255]);
    });

    const pngData = PNG.sync.write(image);
    return {
      fileName: `${workspace.name.replace(/\s+/g, "-").toLowerCase()}.png`,
      content: new Uint8Array(pngData)
    };
  }
}
