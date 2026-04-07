import { applyAutoLayout, schemaToGraph } from "@schemapaste/core";
import type { BackendMigrationTarget } from "@schemapaste/core";
import type { ReactFlowInstance } from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorBanner } from "./components/ErrorBanner";
import { ErdCanvas } from "./components/ErdCanvas";
import { SqlEditor } from "./components/SqlEditor";
import { Toolbar } from "./components/Toolbar";
import { useSchemaStore } from "./store/useSchemaStore";
import { exportNodeAsPngBase64, exportNodeAsSvg } from "./utils/export";
import { listenFromExtension, postToExtension, vscodeApi } from "./utils/vscode";

const DEBOUNCE_MS = 300;

export default function App(): JSX.Element {
  const {
    sql,
    dialect,
    graph,
    schema,
    errors,
    isParsing,
    toast,
    setSql,
    setDialect,
    parseSql,
    setFromSnapshot,
    setToast
  } = useSchemaStore();

  const [divider, setDivider] = useState(44);
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const flowRef = useRef<ReactFlowInstance | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      parseSql(sql);
      postToExtension({
        type: "persistState",
        payload: {
          sql,
          dialect
        }
      });
      vscodeApi?.setState({ sql, dialect });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [sql, dialect, parseSql]);

  useEffect(() => {
    postToExtension({ type: "ready" });
    const dispose = listenFromExtension((message) => {
      if (message.type === "schemaLoaded") {
        try {
          setFromSnapshot(message.payload.json);
        } catch (error) {
          const text = error instanceof Error ? error.message : "Failed to parse schema JSON.";
          setToast(text);
        }
      }

      if (message.type === "restoreState") {
        setSql(message.payload.sql);
        setDialect(message.payload.dialect);
      }

      if (message.type === "operationResult") {
        setToast(message.payload.message);
      }
    });

    const persisted = vscodeApi?.getState() as { sql?: string; dialect?: typeof dialect } | undefined;
    if (persisted?.sql) {
      setSql(persisted.sql);
    }
    if (persisted?.dialect) {
      setDialect(persisted.dialect);
    }

    return dispose;
  }, [setDialect, setFromSnapshot, setSql, setToast]);

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const onMouseMove = (event: MouseEvent): void => {
      const width = window.innerWidth;
      const next = (event.clientX / width) * 100;
      const clamped = Math.min(70, Math.max(25, next));
      setDivider(clamped);
    };

    const onMouseUp = (): void => {
      setDragging(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  const leftWidth = useMemo(() => `${divider}%`, [divider]);
  const rightWidth = useMemo(() => `${100 - divider}%`, [divider]);

  const onAutoLayout = (): void => {
    const next = applyAutoLayout(schemaToGraph(schema));
    useSchemaStore.setState({ graph: next });
    window.requestAnimationFrame(() => {
      flowRef.current?.fitView({ duration: 500, padding: 0.2 });
    });
  };

  const onFitView = (): void => {
    flowRef.current?.fitView({ duration: 300, padding: 0.2 });
  };

  const onSaveSchema = (): void => {
    postToExtension({
      type: "saveSchema",
      payload: {
        schema,
        sql
      }
    });
  };

  const onLoadSchema = (): void => {
    postToExtension({ type: "loadSchema" });
  };

  const onExportSvg = async (): Promise<void> => {
    if (!canvasRef.current) {
      return;
    }
    const content = await exportNodeAsSvg(canvasRef.current);
    postToExtension({
      type: "exportFile",
      payload: {
        format: "svg",
        content
      }
    });
  };

  const onExportPng = async (): Promise<void> => {
    if (!canvasRef.current) {
      return;
    }
    const contentBase64 = await exportNodeAsPngBase64(canvasRef.current);
    postToExtension({
      type: "exportFile",
      payload: {
        format: "png",
        contentBase64
      }
    });
  };

  const onExportMigration = (target: BackendMigrationTarget): void => {
    postToExtension({
      type: "exportMigration",
      payload: {
        target,
        schema
      }
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-surface text-text">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.15),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.18),transparent_28%)]" />
      <div className="relative z-10 flex h-full flex-col p-2">
        <Toolbar
          dialect={dialect}
          onDialectChange={setDialect}
          onAutoLayout={onAutoLayout}
          onFitView={onFitView}
          onExportSvg={() => void onExportSvg()}
          onExportPng={() => void onExportPng()}
          onExportMigration={onExportMigration}
          onSaveSchema={onSaveSchema}
          onLoadSchema={onLoadSchema}
          isParsing={isParsing}
        />

        <ErrorBanner errors={errors} />

        <div className="mt-2 flex h-full min-h-0 gap-2">
          <div style={{ width: leftWidth }} className="h-full min-h-0">
            <SqlEditor value={sql} onChange={setSql} />
          </div>

          <button
            type="button"
            aria-label="Resize"
            className="w-1.5 cursor-col-resize rounded bg-border/60 transition hover:bg-accent"
            onMouseDown={() => setDragging(true)}
          />

          <div style={{ width: rightWidth }} className="h-full min-h-0" ref={canvasRef}>
            {isParsing ? (
              <div className="grid h-full grid-cols-2 gap-3 rounded-xl border border-border/70 bg-panel/40 p-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-lg border border-border/50 bg-surface/70"
                  />
                ))}
              </div>
            ) : schema.tables.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/80 bg-panel/40 p-8 text-center">
                <div>
                  <div className="mb-3 text-4xl">[]</div>
                  <p className="text-sm font-semibold">Paste CREATE TABLE SQL to generate your ERD.</p>
                  <p className="text-xs text-muted">Supports MySQL, PostgreSQL, and SQLite.</p>
                </div>
              </div>
            ) : (
              <ErdCanvas
                graph={graph}
                onFlowReady={(instance) => {
                  flowRef.current = instance;
                }}
              />
            )}
          </div>
        </div>

        {toast ? (
          <button
            type="button"
            className="absolute bottom-4 right-4 rounded-md border border-border bg-panel px-3 py-2 text-xs"
            onClick={() => setToast(null)}
          >
            {toast}
          </button>
        ) : null}
      </div>
    </div>
  );
}
