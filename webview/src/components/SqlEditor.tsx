interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function SqlEditor({ value, onChange }: SqlEditorProps): JSX.Element {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border/70 bg-panel/70 shadow-glow backdrop-blur-sm">
      <div className="border-b border-border/70 bg-gradient-to-r from-cyan-500/10 to-transparent px-3 py-2 text-xs uppercase tracking-[0.18em] text-muted">
        SQL DDL
      </div>
      <textarea
        spellCheck={false}
        className="h-full w-full resize-none bg-transparent p-3 font-mono text-sm leading-6 text-text outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste CREATE TABLE statements..."
      />
    </div>
  );
}
