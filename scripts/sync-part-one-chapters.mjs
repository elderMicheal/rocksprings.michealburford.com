import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const generatedPath = path.join(
  projectRoot,
  "src",
  "content",
  "generated",
  "publication-package.json",
);
const approvalPath = path.join(
  projectRoot,
  "content-policy",
  "approved-sources.json",
);
const manuscriptRelativePath = path.join(
  "Rock Springs Chronicles",
  "Book 1 - Jackie's Window",
  "Part 1",
);
const portableSourcePath =
  "Rock Springs Chronicles/Book 1 - Jackie's Window/Part 1";
const emptyCollections = {
  people: [],
  places: [],
  events: [],
  artifacts: [],
  timeline: [],
  media: [],
};

function fail(message) {
  console.error(`Part One content check failed: ${message}`);
  process.exit(1);
}

function parseMode() {
  const modes = process.argv.slice(2);
  if (modes.length !== 1 || !["--write", "--check", "--check-source"].includes(modes[0])) {
    fail("use exactly one of --write, --check, or --check-source");
  }

  return modes[0];
}

function resolveWritingRoot() {
  const candidates = [
    process.env.RSC_WRITING_ROOT,
    path.resolve(projectRoot, "..", "Obsidian Vaults", "Writing"),
    process.env.USERPROFILE
      ? path.join(process.env.USERPROFILE, "Documents", "Obsidian Vaults", "Writing")
      : undefined,
  ].filter(Boolean);

  const writingRoot = candidates.find((candidate) =>
    existsSync(path.join(candidate, manuscriptRelativePath)),
  );

  if (!writingRoot) {
    fail(
      "the Writing repository was not found; set RSC_WRITING_ROOT to its absolute path",
    );
  }

  return writingRoot;
}

function parseFrontmatter(source, filename) {
  const normalized = source.replaceAll("\r\n", "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    fail(`${filename} has no valid YAML frontmatter block`);
  }

  const metadata = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    if (rawValue === "true" || rawValue === "false") {
      metadata[key] = rawValue === "true";
    } else if (/^\d+$/.test(rawValue)) {
      metadata[key] = Number(rawValue);
    } else {
      metadata[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }

  return { metadata, body: match[2] };
}

function normalizeParagraph(block) {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label ?? target)
    .trim();
}

function plainText(markdown) {
  return markdown
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function excerptFor(paragraphs) {
  const firstParagraph = plainText(paragraphs[0] ?? "");
  if (firstParagraph.length <= 190) return firstParagraph;

  const shortened = firstParagraph.slice(0, 187);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 130 ? lastSpace : 187).trimEnd()}…`;
}

function wordCountFor(paragraphs) {
  return plainText(paragraphs.join(" ")).match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)
    ?.length ?? 0;
}

function readRevision(writingRoot) {
  try {
    return execFileSync("git", ["-C", writingRoot, "rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    fail("the Writing repository revision could not be read with git");
  }
}

function digestFor(collections, relationships, withdrawn) {
  return createHash("sha256")
    .update(JSON.stringify({ collections, relationships, withdrawn }))
    .digest("hex");
}

function generatePackage() {
  const approvalPolicy = JSON.parse(readFileSync(approvalPath, "utf8"));
  const approval = approvalPolicy.approvals?.find(
    (candidate) => candidate.id === "jackies-window-part-one-chapters",
  );
  if (!approval || approval.publicationState !== "published") {
    fail("the Part One publication approval is missing or inactive");
  }

  const writingRoot = resolveWritingRoot();
  const partOneDirectory = path.join(writingRoot, manuscriptRelativePath);
  const chapterFiles = readdirSync(partOneDirectory)
    .filter((filename) => /^Chapter \d{2}\.md$/.test(filename))
    .sort();

  const sourceRevision = readRevision(writingRoot);
  const chapters = chapterFiles.map((filename) => {
    const source = readFileSync(path.join(partOneDirectory, filename), "utf8");
    const { metadata, body } = parseFrontmatter(source, filename);
    const approvedSourcePath = `Book 1 - Jackie's Window/Part 1/${filename}`;

    if (metadata.type !== "chapter" || metadata.part !== 1 || metadata.book !== 1) {
      fail(`${filename} is not marked as a Book 1, Part 1 chapter`);
    }
    if (metadata.publish !== true || !approval.sourcePaths.includes(approvedSourcePath)) {
      fail(`${filename} is not explicitly allowlisted for publication`);
    }

    const bookTitle = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
    if (!bookTitle || typeof metadata.series !== "string") {
      fail(`${filename} is missing its series or book title`);
    }
    const navigationIndex = body.search(/^## Navigation\s*$/m);
    const manuscriptBody = navigationIndex === -1 ? body : body.slice(0, navigationIndex);
    const prose = manuscriptBody
      .replace(/^# Jackie's Window\s*$/m, "")
      .replace(new RegExp(`^## ${metadata.title}\\s*$`, "m"), "")
      .trim();
    const paragraphs = prose
      ? prose.split(/\n\s*\n/).map(normalizeParagraph).filter(Boolean)
      : [];
    const wordCount = wordCountFor(paragraphs);
    const chapterNumber = Number(metadata.chapter);
    const slug = `chapter-${String(chapterNumber).padStart(2, "0")}`;

    return {
      id: `chronicle:jackies-window:part-1:${slug}`,
      slug,
      collection: "chronicles",
      title: String(metadata.title),
      publicationState: "published",
      editorialStatus: String(metadata.status),
      provenance: {
        sourceRef: `${portableSourcePath}/${filename}`,
        sourceRevision,
        approvalId: approval.id,
      },
      sequence: {
        series: metadata.series,
        bookTitle,
        book: Number(metadata.book),
        part: Number(metadata.part),
        order: Number(metadata.order),
        chapter: chapterNumber,
      },
      body: {
        format: "safe-inline-markdown",
        paragraphs,
      },
      presentation: {
        excerpt: excerptFor(paragraphs),
        wordCount,
        estimatedReadingMinutes:
          wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / 230)),
      },
    };
  });

  const collections = {
    chronicles: chapters,
    ...emptyCollections,
  };
  const relationships = [];
  const withdrawn = [];
  const contentDigest = digestFor(collections, relationships, withdrawn);
  const publicationPackage = {
    schemaVersion: 1,
    manifest: {
      packageId: `rsc-${sourceRevision.slice(0, 12)}-${contentDigest.slice(0, 12)}`,
      sourceRevision,
      contentDigest,
      approvalId: approval.id,
      world: {
        id: "rock-springs-chronicles",
        title: chapters[0].sequence.series,
      },
      collections: Object.fromEntries(
        Object.entries(collections).map(([name, entries]) => [name, entries.length]),
      ),
    },
    collections,
    relationships,
    withdrawn,
  };

  validatePackage(publicationPackage);
  return publicationPackage;
}

function validatePackage(publicationPackage) {
  if (publicationPackage.schemaVersion !== 1) {
    fail("the generated package uses an unsupported schema version");
  }

  if (!/^[0-9a-f]{40}$/.test(publicationPackage.manifest?.sourceRevision ?? "")) {
    fail("the generated package does not contain a full source revision");
  }

  const chapters = publicationPackage.collections?.chronicles;
  if (!Array.isArray(chapters) || chapters.length !== 8) {
    fail("the generated package must contain Chapters 1 through 8");
  }

  const slugs = new Set();
  const ids = new Set();
  chapters.forEach((chapter, index) => {
    const expectedNumber = index + 1;
    if (
      chapter.sequence.chapter !== expectedNumber ||
      chapter.sequence.order !== expectedNumber ||
      chapter.slug !== `chapter-${String(expectedNumber).padStart(2, "0")}`
    ) {
      fail(`chapter position ${expectedNumber} has inconsistent ordering metadata`);
    }
    if (chapter.publicationState !== "published") {
      fail(`${chapter.title} is not publicly eligible`);
    }
    if (!Array.isArray(chapter.body?.paragraphs)) {
      fail(`${chapter.title} has invalid prose data`);
    }
    slugs.add(chapter.slug);
    ids.add(chapter.id);
  });

  if (slugs.size !== chapters.length || ids.size !== chapters.length) {
    fail("chapter slugs are not unique");
  }

  for (const collectionName of Object.keys(emptyCollections)) {
    if (!Array.isArray(publicationPackage.collections[collectionName])) {
      fail(`the ${collectionName} collection is missing`);
    }
  }

  if (
    publicationPackage.manifest.contentDigest !==
    digestFor(
      publicationPackage.collections,
      publicationPackage.relationships,
      publicationPackage.withdrawn,
    )
  ) {
    fail("the generated package content digest does not match its chapter data");
  }
}

const mode = parseMode();

if (mode === "--write") {
  const publicationPackage = generatePackage();
  mkdirSync(path.dirname(generatedPath), { recursive: true });
  writeFileSync(generatedPath, `${JSON.stringify(publicationPackage, null, 2)}\n`);
  console.log(
    `Built ${publicationPackage.collections.chronicles.length} approved Part One chapters at ${publicationPackage.manifest.sourceRevision.slice(0, 12)}.`,
  );
} else if (mode === "--check-source") {
  const expected = `${JSON.stringify(generatePackage(), null, 2)}\n`;
  if (!existsSync(generatedPath) || readFileSync(generatedPath, "utf8") !== expected) {
    fail("published chapter data is stale; run npm run content:sync");
  }
  console.log("Published Part One chapters match the Writing repository.");
} else {
  if (!existsSync(generatedPath)) {
    fail("the generated chapter package is missing; run npm run content:sync");
  }
  const publicationPackage = JSON.parse(readFileSync(generatedPath, "utf8"));
  validatePackage(publicationPackage);
  console.log(
    `Validated ${publicationPackage.collections.chronicles.length} generated Part One chapters and content digest.`,
  );
}
