interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function SqlEditor({ value, onChange }: SqlEditorProps): JSX.Element {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-panel/70 shadow-glow">
      <div className="border-b border-border px-3 py-2 text-xs uppercase tracking-[0.18em] text-muted">SQL DDL</div>
      <textarea
        spellCheck={false}
        className="h-full w-full resize-none bg-transparent p-3 font-mono text-sm text-text outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste CREATE TABLE statements..."
      />
    </div>
  );
}
