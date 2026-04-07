import { build, context as createContext } from "esbuild";

const watch = process.argv.includes("--watch");

const ctx = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  format: "cjs",
  platform: "node",
  sourcemap: true,
  outfile: "dist/extension.js",
  external: ["vscode"]
};

if (watch) {
  const context = await createContext(ctx);
  await context.watch();
  console.log("SchemaPaste extension watch mode started.");
} else {
  await build(ctx);
}
