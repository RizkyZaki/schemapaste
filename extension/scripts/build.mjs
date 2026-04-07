import { build } from "esbuild";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(extensionRoot, "..");
const webviewRoot = path.resolve(workspaceRoot, "webview");
const webviewDist = path.resolve(webviewRoot, "dist");
const packagedWebviewDist = path.resolve(extensionRoot, "webview-dist");

execSync("pnpm --filter @schemapaste/core build", {
  cwd: workspaceRoot,
  stdio: "inherit"
});

execSync("pnpm --filter @schemapaste/webview build", {
  cwd: workspaceRoot,
  stdio: "inherit"
});

if (fs.existsSync(packagedWebviewDist)) {
  fs.rmSync(packagedWebviewDist, { recursive: true, force: true });
}

fs.cpSync(webviewDist, packagedWebviewDist, { recursive: true });

await build({
  entryPoints: [path.resolve(extensionRoot, "src", "extension.ts")],
  bundle: true,
  format: "cjs",
  platform: "node",
  sourcemap: true,
  outfile: path.resolve(extensionRoot, "dist", "extension.js"),
  external: ["vscode"]
});
