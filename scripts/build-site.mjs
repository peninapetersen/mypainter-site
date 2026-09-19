import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const SKIP = new Set(["app", "dist", "node_modules", ".git", "scripts", "functions"]);

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const name of readdirSync(root)) {
  if (SKIP.has(name) || name.startsWith(".")) continue;
  const src = join(root, name);
  cpSync(src, join(dist, name), { recursive: true });
}

const envLocal = join(root, ".env.local");
if (!existsSync(envLocal)) {
  console.warn(
    "\n⚠️  No .env.local — Vite build will use runtime /api/public/app-config for Supabase.\n" +
      "   Ensure VITE_SUPABASE_ANON_KEY is set in Cloudflare Pages environment variables.\n",
  );
}

execSync("node ./node_modules/vite/bin/vite.js build", { cwd: root, stdio: "inherit" });

if (!existsSync(join(dist, "app", "index.html"))) {
  console.error("Build failed: dist/app/index.html missing");
  process.exit(1);
}

console.log("Built static site + /app SPA → dist/");
