import { WorkspaceExportService } from "./exportService";
import { ConversionExporter } from "./strategies/conversionExporter";
import { JsonWorkspaceExporter } from "./strategies/jsonWorkspaceExporter";
import { MarkdownDocExporter } from "./strategies/markdownDocExporter";
import { NormalizedSchemaExporter } from "./strategies/normalizedSchemaExporter";
import { PdfDiagramExporter } from "./strategies/pdfDiagramExporter";
import { PngDiagramExporter } from "./strategies/pngDiagramExporter";
import { SourceContentExporter } from "./strategies/sourceContentExporter";
import { SvgDiagramExporter } from "./strategies/svgDiagramExporter";

export function createDefaultExportService(): WorkspaceExportService {
  const service = new WorkspaceExportService();

  service.register(new JsonWorkspaceExporter());
  service.register(new NormalizedSchemaExporter());
  service.register(new SourceContentExporter());
  service.register(new MarkdownDocExporter());
  service.register(new SvgDiagramExporter());
  service.register(new PngDiagramExporter());
  service.register(new PdfDiagramExporter());
  service.register(new ConversionExporter("sql"));
  service.register(new ConversionExporter("laravel"));
  service.register(new ConversionExporter("prisma"));
  service.register(new ConversionExporter("drizzle"));
  service.register(new ConversionExporter("typeorm"));
  service.register(new ConversionExporter("sequelize"));
  service.register(new ConversionExporter("django"));

  return service;
}
