import { createHash } from "node:crypto";
import { access, cp, mkdir, open, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const workspace = fileURLToPath(new URL("../", import.meta.url));
const output = join(workspace, "deploy-assets");
const publicDir = join(workspace, "public");
const chunkSize = 20 * 1024 * 1024;
const modsDir = join(process.env.APPDATA ?? "", ".minecraft", "mods");

async function firstExisting(paths) {
  for (const path of paths.filter(Boolean)) {
    try {
      await access(path);
      return path;
    } catch {
      // Try the next known location.
    }
  }
  throw new Error(`Required file not found. Checked: ${paths.filter(Boolean).join(", ")}`);
}

const neoForgeInstaller = await firstExisting([
  process.env.NEOFORGE_INSTALLER,
  "D:/Downloads/neoforge-21.1.233-installer.jar",
  process.env.USERPROFILE ? join(process.env.USERPROFILE, "Downloads", "neoforge-21.1.233-installer.jar") : null
]);

const sources = [
  [neoForgeInstaller, "download-assets/neoforge-21.1.233-installer.jar"],
  [join(modsDir, "Incendium_1.21.x_v5.4.4.jar"), "download-assets/mods/Incendium_1.21.x_v5.4.4.jar"],
  [join(modsDir, "jei-1.21.1-neoforge-19.25.0.322.jar"), "download-assets/mods/jei-1.21.1-neoforge-19.25.0.322.jar"],
  [join(modsDir, "journeymap-neoforge-1.21.1-6.0.0-beta.48.jar"), "download-assets/mods/journeymap-neoforge-1.21.1-6.0.0-beta.48.jar"],
  [join(modsDir, "konkrete_neoforge_1.9.9_MC_1.21.jar"), "download-assets/mods/konkrete_neoforge_1.9.9_MC_1.21.jar"],
  [join(modsDir, "kubejs-neoforge-2101.7.2-build.368.jar"), "download-assets/mods/kubejs-neoforge-2101.7.2-build.368.jar"],
  [join(modsDir, "lithostitched-neoforge-1.21.1-1.4.8.jar"), "download-assets/mods/lithostitched-neoforge-1.21.1-1.4.8.jar"],
  [join(modsDir, "rhino-2101.2.7-build.85.jar"), "download-assets/mods/rhino-2101.2.7-build.85.jar"],
  [join(modsDir, "Structory_1.21.x_v1.3.10.jar"), "download-assets/mods/Structory_1.21.x_v1.3.10.jar"],
  [join(modsDir, "Structory_Towers_1.21.x_v1.0.11.jar"), "download-assets/mods/Structory_Towers_1.21.x_v1.0.11.jar"],
  [join(modsDir, "tectonic-3.0.1-neoforge-1.21.1.jar"), "download-assets/mods/tectonic-3.0.1-neoforge-1.21.1.jar"],
  [join(modsDir, "Terralith_1.21.x_v2.5.8.jar"), "download-assets/mods/Terralith_1.21.x_v2.5.8.jar"]
];

await rm(output, { recursive: true, force: true });
await cp(publicDir, output, { recursive: true });

for (const [source, destination] of sources) {
  const target = join(output, destination);
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target);
}

const pixelmon = join(modsDir, "Pixelmon-1.21.1-9.3.16-universal.jar");
const pixelmonDir = join(output, "download-assets/pixelmon");
await mkdir(pixelmonDir, { recursive: true });

let index = 0;
const sourceHandle = await open(pixelmon, "r");
try {
  while (true) {
    const buffer = Buffer.allocUnsafe(chunkSize);
    const { bytesRead } = await sourceHandle.read(buffer, 0, chunkSize);
    if (bytesRead === 0) break;
    await writeFile(
      join(pixelmonDir, `chunk-${String(index).padStart(2, "0")}.bin`),
      buffer.subarray(0, bytesRead)
    );
    index += 1;
  }
} finally {
  await sourceHandle.close();
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const manifest = {};
const filesByHash = {};
for (const file of await walk(output)) {
  const content = await readFile(file);
  const extension = extname(file).slice(1);
  const hash = createHash("sha256").update(content.toString("base64") + extension).digest("hex").slice(0, 32);
  const assetPath = `/${relative(output, file).replaceAll("\\", "/")}`;
  manifest[assetPath] = { hash, size: (await stat(file)).size };
  filesByHash[hash] = file;
}

await writeFile(join(workspace, "deploy-manifest.json"), JSON.stringify({ manifest, filesByHash }, null, 2));
console.log(`Prepared ${Object.keys(manifest).length} assets (${index} Pixelmon chunks).`);
