import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");

function option(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

const outputPath = resolve(option("--output") ?? "generated/source-inventory.json");
const approvalPath = resolve(
  option("--approval") ?? "content-policy/approved-sources.json",
);
const approvalPolicy = JSON.parse(readFileSync(approvalPath, "utf8"));
const approvalsBySourcePath = new Map(
  approvalPolicy.approvals.flatMap((approval) =>
    approval.sourcePaths.map((path) => [path, approval]),
  ),
);

if (checkOnly) {
  if (!existsSync(outputPath)) {
    throw new Error(`Source inventory is missing at ${outputPath}`);
  }
  const inventory = JSON.parse(readFileSync(outputPath, "utf8"));
  const issues = [];
  if (inventory.scope !== "Rock Springs Chronicles") {
    issues.push("inventory scope is not Rock Springs Chronicles");
  }
  if (inventory.policy?.manuscriptBodiesIncluded !== false) {
    issues.push("inventory must not contain manuscript bodies");
  }
  if (!/^[0-9a-f]{40}$/.test(inventory.source?.revision ?? "")) {
    issues.push("inventory has no full source revision");
  }

  for (const file of inventory.files ?? []) {
    if (typeof file.path !== "string" || file.path.includes("\\") || file.path.includes(":")) {
      issues.push("inventory contains a non-portable or absolute source path");
    }
    if ("body" in file || "content" in file || "text" in file) {
      issues.push(`${file.path} contains manuscript content in the metadata inventory`);
    }
    if (file.publication?.publicEligible && !approvalsBySourcePath.has(file.path)) {
      issues.push(`${file.path} is publicly eligible without an explicit approval`);
    }
  }

  if (issues.length > 0) {
    throw new Error(`Source inventory validation failed:\n- ${issues.join("\n- ")}`);
  }

  console.log(
    `Validated metadata-only RSC inventory for ${inventory.files.length} files at ${inventory.source.revision}.`,
  );
  process.exit(0);
}

const configuredSource =
  option("--source") ??
  process.env.RSC_WRITING_ROOT ??
  resolve("..", "Obsidian Vaults", "Writing");

if (!configuredSource) {
  throw new Error(
    "Set RSC_WRITING_ROOT to the writing repository or pass --source <path>. No source files were read.",
  );
}

const configuredRoot = resolve(configuredSource);
const sourceRoot =
  basename(configuredRoot) === "Rock Springs Chronicles"
    ? configuredRoot
    : join(configuredRoot, "Rock Springs Chronicles");

if (!statSync(sourceRoot, { throwIfNoEntry: false })?.isDirectory()) {
  throw new Error(`Rock Springs Chronicles source directory not found at: ${sourceRoot}`);
}

const writingRoot = dirname(sourceRoot);

function git(...gitArgs) {
  return execFileSync("git", ["-C", writingRoot, ...gitArgs], {
    encoding: "utf8",
    windowsHide: true,
  }).trim();
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const absolutePath = join(directory, entry.name);
      return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
    });
}

function normalizePath(absolutePath) {
  return relative(sourceRoot, absolutePath).split(sep).join("/");
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function scalar(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^(['"])(.*)\1$/, "$2");
}

function parseFrontMatter(text) {
  const normalizedText = text.replace(/^\uFEFF/, "");
  const match = normalizedText.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return {};

  return Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/))
      .filter(Boolean)
      .map((parts) => [parts[1], scalar(parts[2])]),
  );
}

function sourceKind(path) {
  if (path.startsWith("Templates/")) return "template";
  if (path.startsWith("Back Matter/Research/")) return "research";
  if (path.includes("/Recovered Drafts/")) return "recovered-draft";
  if (path.startsWith("Back Matter/")) return "back-matter";
  if (path.startsWith("Assets/snippets/")) return "snippet";
  if (path.startsWith("Assets/")) return "asset-document";
  if (path.startsWith("Anthologies/")) return "anthology";
  if (/^Book \d/.test(path)) return path.endsWith("/README.md") ? "book-structure" : "manuscript";
  return "series-metadata";
}

function publicationAssessment(frontMatter, path) {
  const status = typeof frontMatter.status === "string" ? frontMatter.status.toLowerCase() : "";
  const publishFlag = frontMatter.publish === true;
  const approval = approvalsBySourcePath.get(path);

  if (approval) {
    const requirementsMatch = Object.entries(approval.requirements).every(
      ([key, expected]) => frontMatter[key] === expected,
    );
    if (!requirementsMatch) {
      return {
        classification: "approval-requirements-mismatch",
        publicEligible: false,
        approvalId: approval.id,
      };
    }
    return {
      classification: "explicit-owner-approval",
      publicEligible: true,
      approvalId: approval.id,
      sourceEditorialStatus: status || "unclassified",
    };
  }

  if (publishFlag && ["private", "draft", "review", "withdrawn"].includes(status)) {
    return { classification: "conflict", publicEligible: false };
  }
  if (status === "published" && publishFlag) {
    return { classification: "explicit-published", publicEligible: true };
  }
  if (status === "published") {
    return { classification: "published-without-publish-flag", publicEligible: false };
  }
  if (status) {
    return { classification: `explicit-${status}`, publicEligible: false };
  }
  if (publishFlag) {
    return { classification: "ambiguous-publish-flag", publicEligible: false };
  }
  return { classification: "unclassified", publicEligible: false };
}

const allPaths = walk(sourceRoot);
const markdownPaths = allPaths.filter((path) => path.toLowerCase().endsWith(".md"));
const markdownLookup = new Map();

for (const absolutePath of markdownPaths) {
  const relativePath = normalizePath(absolutePath).replace(/\.md$/i, "");
  markdownLookup.set(relativePath.toLowerCase(), relativePath);
}

function resolveWikiLink(target) {
  const normalized = target
    .replace(/\\/g, "/")
    .replace(/\.md$/i, "")
    .replace(/^Rock Springs Chronicles\//i, "")
    .replace(/^RSC\//i, "");
  const exact = markdownLookup.get(normalized.toLowerCase());
  if (exact) return { status: "resolved", path: `${exact}.md` };

  const targetName = basename(normalized).toLowerCase();
  const candidates = [...markdownLookup.values()].filter(
    (candidate) => basename(candidate).toLowerCase() === targetName,
  );
  if (candidates.length === 1) {
    return { status: "resolved-by-unique-name", path: `${candidates[0]}.md` };
  }
  if (candidates.length > 1) {
    return { status: "ambiguous", candidates: candidates.map((candidate) => `${candidate}.md`) };
  }
  return { status: "unresolved" };
}

const files = allPaths.map((absolutePath) => {
  const buffer = readFileSync(absolutePath);
  const path = normalizePath(absolutePath);
  const extension = path.includes(".") ? `.${path.split(".").pop().toLowerCase()}` : "";
  const base = {
    path,
    extension,
    bytes: buffer.length,
    sha256: hash(buffer),
  };

  if (extension !== ".md") return base;

  const text = buffer.toString("utf8");
  const frontMatter = parseFrontMatter(text);
  const wikiLinks = [...text.matchAll(/\[\[([^\]|#]+)/g)].map((match) => match[1].trim());
  const heading = text.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? null;
  const assessment = publicationAssessment(frontMatter, path);

  return {
    ...base,
    sourceKind: sourceKind(path),
    frontMatter: Object.fromEntries(
      [
        "publish",
        "status",
        "series",
        "type",
        "title",
        "book",
        "part",
        "chapter",
        "order",
        "collection",
        "excerpt",
      ]
        .filter((key) => frontMatter[key] !== undefined)
        .map((key) => [key, frontMatter[key]]),
    ),
    firstHeading: heading,
    publication: assessment,
    links: wikiLinks.map((target) => ({
      target,
      resolution: resolveWikiLink(target),
    })),
  };
});

const markdownFiles = files.filter((file) => file.extension === ".md");
const classificationCounts = Object.fromEntries(
  [...new Set(markdownFiles.map((file) => file.publication.classification))]
    .sort()
    .map((classification) => [
      classification,
      markdownFiles.filter((file) => file.publication.classification === classification).length,
    ]),
);
const linkResolutions = markdownFiles.flatMap((file) => file.links.map((link) => link.resolution.status));
const linkResolutionCounts = Object.fromEntries(
  [...new Set(linkResolutions)]
    .sort()
    .map((status) => [status, linkResolutions.filter((value) => value === status).length]),
);
const topLevelCounts = Object.fromEntries(
  [...new Set(files.map((file) => file.path.split("/")[0]))]
    .sort()
    .map((topLevel) => [
      topLevel,
      files.filter((file) => file.path.split("/")[0] === topLevel).length,
    ]),
);

const inventory = {
  schemaVersion: 1,
  scope: "Rock Springs Chronicles",
  source: {
    repository: git("config", "--get", "remote.origin.url"),
    branch: git("branch", "--show-current"),
    revision: git("rev-parse", "HEAD"),
    revisionDate: git("show", "-s", "--format=%cI", "HEAD"),
    relativeRoot: "Rock Springs Chronicles",
    rscWorktreeStatus: git("status", "--short", "--", "Rock Springs Chronicles") || "clean",
  },
  policy: {
    manuscriptBodiesIncluded: false,
    defaultPublicEligibility: false,
    approvalManifest: "content-policy/approved-sources.json",
    note:
      "Inventory metadata alone does not grant publication approval. Only exact paths admitted by the versioned approval manifest can become publicly eligible.",
  },
  summary: {
    totalFiles: files.length,
    markdownFiles: markdownFiles.length,
    nonMarkdownFiles: files.length - markdownFiles.length,
    topLevelCounts,
    publicationClassifications: classificationCounts,
    wikiLinkResolutions: linkResolutionCounts,
  },
  files,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");

console.log(`Audited ${files.length} RSC files at revision ${inventory.source.revision}.`);
console.log(`Wrote metadata-only inventory to ${outputPath}.`);
