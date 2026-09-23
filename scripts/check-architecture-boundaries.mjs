import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const scanRoots = ["src", "worker", "scripts", "transitional"];
const allowed = new Map([
  [
    "src/adapters/writing-source.ts",
    ["content/generated/publication-package.json"],
  ],
  [
    "src/adapters/rock-springs-toolchain.ts",
    ["scene-data/", "/assets/scenes/jackies-window/scene-manifest.json"],
  ],
  [
    "transitional/writing-adapter/audit-rsc-source.mjs",
    ["RSC_WRITING_ROOT", "Obsidian Vaults"],
  ],
  [
    "transitional/writing-adapter/build-publication.mjs",
    ["RSC_WRITING_ROOT", "Obsidian Vaults"],
  ],
  [
    "scripts/check-phase-2-integrity.mjs",
    [
      "content/generated/publication-package.json",
      "scene-data/",
      "/assets/scenes/jackies-window/scene-manifest.json",
    ],
  ],
]);

const forbidden = [
  {
    token: "content/generated/publication-package.json",
    reason: "writing data must enter application code through src/adapters/writing-source.ts",
  },
  {
    token: "scene-data/",
    reason: "website code must consume Rock Springs Toolchain outputs through src/adapters/rock-springs-toolchain.ts",
  },
  {
    token: "/assets/scenes/jackies-window/scene-manifest.json",
    reason: "scene asset locations belong behind src/adapters/rock-springs-toolchain.ts",
  },
  {
    token: "RSC_WRITING_ROOT",
    reason: "direct Writing-repository access is confined to transitional/writing-adapter",
  },
  {
    token: "Obsidian Vaults",
    reason: "direct Writing-repository filesystem knowledge is confined to transitional/writing-adapter",
  },
];

function filesUnder(directory) {
  const absolute = join(projectRoot, directory);
  const results = [];
  for (const entry of readdirSync(absolute)) {
    const path = join(absolute, entry);
    if (statSync(path).isDirectory()) {
      results.push(...filesUnder(relative(projectRoot, path)));
    } else if (/\.(?:ts|tsx|mjs)$/.test(entry)) {
      results.push(path);
    }
  }
  return results;
}

const violations = [];
for (const root of scanRoots) {
  for (const absolutePath of filesUnder(root)) {
    const path = relative(projectRoot, absolutePath).replaceAll("\\", "/");
    if (path === "scripts/check-architecture-boundaries.mjs") continue;
    const source = readFileSync(absolutePath, "utf8");
    const permitted = allowed.get(path) ?? [];

    for (const rule of forbidden) {
      if (!source.includes(rule.token) || permitted.includes(rule.token)) continue;
      violations.push(`${path}: ${rule.reason}`);
    }
  }
}

if (violations.length > 0) {
  console.error("Architecture boundary check failed:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("Architecture boundaries are intact.");
