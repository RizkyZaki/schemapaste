import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--vscode-editor-background)",
        panel: "var(--vscode-sideBar-background)",
        border: "var(--vscode-panel-border)",
        text: "var(--vscode-editor-foreground)",
        muted: "var(--vscode-descriptionForeground)",
        accent: "var(--vscode-button-background)",
        accentText: "var(--vscode-button-foreground)",
        danger: "var(--vscode-errorForeground)"
      },
      boxShadow: {
        glow: "0 12px 40px rgba(0, 0, 0, 0.32)"
      }
    }
  },
  plugins: []
} satisfies Config;
