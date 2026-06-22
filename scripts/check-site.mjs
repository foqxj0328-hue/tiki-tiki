import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const required = [
  "public/index.html",
  "public/connect/index.html",
  "public/wiki/index.html",
  "public/notices/index.html",
  "public/support/index.html",
  "public/styles.css",
  "public/app.js",
  "public/assets/hero.png",
  "public/data/downloads.json",
  "src/worker.js",
  "wrangler.jsonc"
];

for (const file of required) {
  await access(join(root, file));
}

const downloads = JSON.parse(await readFile(join(root, "public/data/downloads.json"), "utf8"));
if (downloads.length !== 13) throw new Error(`Expected 13 downloads, found ${downloads.length}`);
if (downloads.filter((item) => item.group === "mod").length !== 12) throw new Error("Expected 12 mods");
if (!downloads.every((item) => /^[A-F0-9]{64}$/.test(item.sha256))) throw new Error("Invalid SHA-256 entry");

for (const page of ["index", "connect/index", "wiki/index", "notices/index", "support/index"]) {
  const html = await readFile(join(root, `public/${page}.html`), "utf8");
  if (!html.includes('lang="ko"')) throw new Error(`${page} is missing Korean language metadata`);
  if (!html.includes('name="viewport"')) throw new Error(`${page} is missing viewport metadata`);
}

console.log(`Site check passed: ${required.length} files, ${downloads.length} downloads.`);
