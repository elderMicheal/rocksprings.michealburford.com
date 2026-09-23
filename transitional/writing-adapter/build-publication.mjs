import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
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
const rscRelativeRoot = "Rock Springs Chronicles";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const supportedKinds = new Set(["novel", "anthology", "collection", "standalone"]);
const supportedEntryTypes = new Set([
  "chapter",
  "interlude",
  "anthology-entry",
  "story",
]);
const emptyCollections = {
  people: [],
  places: [],
  events: [],
  artifacts: [],
  timeline: [],
  media: [],
};

function fail(message) {
  console.error("Publication content check failed: " + message);
  process.exit(1);
}

function parseMode() {
  const modes = process.argv.slice(2);
  if (
    modes.length !== 1 ||
    !["--write", "--check", "--check-source"].includes(modes[0])
  ) {
    fail("use exactly one of --write, --check, or --check-source");
  }
  return modes[0];
}

function resolveWritingRoot() {
  const candidates = [
    process.env.RSC_WRITING_ROOT,
    path.resolve(projectRoot, "..", "Obsidian Vaults", "Writing"),
    process.env.USERPROFILE
      ? path.join(
          process.env.USERPROFILE,
          "Documents",
          "Obsidian Vaults",
          "Writing",
        )
      : undefined,
  ].filter(Boolean);

  const writingRoot = candidates.find((candidate) =>
    existsSync(path.join(candidate, rscRelativeRoot)),
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
    fail(filename + " has no valid YAML frontmatter block");
  }

  const metadata = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    if (rawValue === "true" || rawValue === "false") {
      metadata[key] = rawValue === "true";
    } else if (/^-?\d+$/.test(rawValue)) {
      metadata[key] = Number(rawValue);
    } else {
      metadata[key] = rawValue.replace(/^[\"']|[\"']$/g, "");
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
    .replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (_, target, label) => label ?? target,
    )
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
  return (
    shortened.slice(0, lastSpace > 130 ? lastSpace : 187).trimEnd() + "…"
  );
}

function wordCountFor(paragraphs) {
  return (
    plainText(paragraphs.join(" ")).match(
      /[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu,
    )?.length ?? 0
  );
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

function digestFor(works, collections, relationships, withdrawn) {
  return createHash("sha256")
    .update(JSON.stringify({ works, collections, relationships, withdrawn }))
    .digest("hex");
}

function headingTitle(body, sourcePath) {
  const title = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (!title) fail(sourcePath + " is missing its top-level work heading");
  return title;
}

function manuscriptParagraphs(body, metadata) {
  const navigationIndex = body.search(/^## Navigation\s*$/m);
  const manuscriptBody =
    navigationIndex === -1 ? body : body.slice(0, navigationIndex);
  const lines = manuscriptBody.split("\n");
  let removedWorkHeading = false;
  let removedEntryHeading = false;
  const filtered = lines.filter((line) => {
    if (!removedWorkHeading && /^#\s+/.test(line)) {
      removedWorkHeading = true;
      return false;
    }
    if (
      !removedEntryHeading &&
      line.trim() === "## " + String(metadata.title ?? "")
    ) {
      removedEntryHeading = true;
      return false;
    }
    return true;
  });

  const prose = filtered.join("\n").trim();
  return prose
    ? prose.split(/\n\s*\n/).map(normalizeParagraph).filter(Boolean)
    : [];
}

function numberWord(value) {
  const words = new Map([
    [1, "One"],
    [2, "Two"],
    [3, "Three"],
    [4, "Four"],
    [5, "Five"],
    [6, "Six"],
    [7, "Seven"],
    [8, "Eight"],
    [9, "Nine"],
    [10, "Ten"],
  ]);
  return words.get(value) ?? String(value);
}

function validateWorkConfig(approval) {
  const work = approval.work;
  if (!work || typeof work !== "object") {
    fail(approval.id + " has no work registration");
  }
  if (typeof work.id !== "string" || !work.id.startsWith("work:")) {
    fail(approval.id + " has an invalid work id");
  }
  if (typeof work.slug !== "string" || !slugPattern.test(work.slug)) {
    fail(approval.id + " has an invalid work slug");
  }
  if (!supportedKinds.has(work.kind)) {
    fail(approval.id + " has an unsupported work kind");
  }
  if (!Number.isInteger(work.order) || work.order < 1) {
    fail(approval.id + " has an invalid work order");
  }
  return work;
}

function validateRequirements(metadata, approval, sourcePath) {
  const requirements = approval.requirements ?? {};
  for (const [key, expected] of Object.entries(requirements)) {
    if (metadata[key] !== expected) {
      fail(
        sourcePath +
          " does not satisfy approval " +
          approval.id +
          " requirement " +
          key,
      );
    }
  }
}

function entrySlug(metadata, sourcePath) {
  if (typeof metadata.slug === "string" && metadata.slug.length > 0) {
    if (!slugPattern.test(metadata.slug)) {
      fail(sourcePath + " has an invalid slug");
    }
    return metadata.slug;
  }

  if (metadata.type === "chapter") {
    if (!Number.isInteger(metadata.chapter) || metadata.chapter < 1) {
      fail(sourcePath + " is a chapter without a positive chapter number");
    }
    return "chapter-" + String(metadata.chapter).padStart(2, "0");
  }

  fail(
    sourcePath +
      " requires an explicit slug because its source type is " +
      String(metadata.type),
  );
}

function entryId(work, metadata, slug) {
  if (Number.isInteger(metadata.part)) {
    return (
      "chronicle:" +
      work.slug +
      ":part-" +
      metadata.part +
      ":" +
      slug
    );
  }
  return "chronicle:" + work.slug + ":" + slug;
}

function normalizeSource({
  approval,
  work,
  sourcePath,
  source,
  sourceRevision,
}) {
  const { metadata, body } = parseFrontmatter(source, sourcePath);
  validateRequirements(metadata, approval, sourcePath);

  if (metadata.publish !== true) {
    fail(sourcePath + " is approved but does not have publish: true");
  }
  if (!supportedEntryTypes.has(metadata.type)) {
    fail(sourcePath + " has unsupported source type " + String(metadata.type));
  }
  if (typeof metadata.series !== "string" || metadata.series.length === 0) {
    fail(sourcePath + " is missing its series");
  }
  if (typeof metadata.title !== "string" || metadata.title.length === 0) {
    fail(sourcePath + " is missing its title");
  }
  if (!Number.isInteger(metadata.order) || metadata.order < 1) {
    fail(sourcePath + " is missing a positive order");
  }

  if (metadata.type === "chapter") {
    if (
      !Number.isInteger(metadata.book) ||
      !Number.isInteger(metadata.part) ||
      !Number.isInteger(metadata.chapter)
    ) {
      fail(sourcePath + " has incomplete chapter sequence metadata");
    }
  }

  if (metadata.type === "interlude" && !Number.isInteger(metadata.part)) {
    fail(sourcePath + " is an interlude without a part number");
  }

  const workTitle = headingTitle(body, sourcePath);
  const slug = entrySlug(metadata, sourcePath);
  const paragraphs = manuscriptParagraphs(body, metadata);
  const wordCount = wordCountFor(paragraphs);
  const sequence = {
    series: metadata.series,
    bookTitle: workTitle,
    ...(Number.isInteger(metadata.book) ? { book: metadata.book } : {}),
    ...(Number.isInteger(metadata.part) ? { part: metadata.part } : {}),
    order: Number(metadata.order),
    ...(Number.isInteger(metadata.chapter) ? { chapter: metadata.chapter } : {}),
  };

  return {
    workTitle,
    metadata,
    entry: {
      id: entryId(work, metadata, slug),
      slug,
      collection: "chronicles",
      title: String(metadata.title),
      publicationState: "published",
      editorialStatus: String(metadata.status ?? "unclassified"),
      provenance: {
        sourceRef: rscRelativeRoot + "/" + sourcePath,
        sourceRevision,
        approvalId: approval.id,
      },
      sequence,
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
    },
  };
}

function buildWorks(recordsByWork) {
  return [...recordsByWork.values()]
    .map(({ config, records }) => {
      const workTitles = new Set(records.map((record) => record.workTitle));
      if (workTitles.size !== 1) {
        fail(config.id + " resolves to conflicting work titles");
      }

      const entries = records
        .map((record) => record.entry)
        .sort(
          (left, right) =>
            (left.sequence.part ?? 0) - (right.sequence.part ?? 0) ||
            left.sequence.order - right.sequence.order,
        );

      const pathBase = "/read/" + config.slug;
      const sectionParts = [
        ...new Set(
          records
            .map((record) => record.entry.sequence.part)
            .filter((part) => Number.isInteger(part)),
        ),
      ].sort((left, right) => left - right);

      const sections = sectionParts.map((part) => {
        const sectionId = config.id + ":part-" + part;
        const entryIds = entries
          .filter((entry) => entry.sequence.part === part)
          .map((entry) => entry.id);
        return {
          id: sectionId,
          slug: "part-" + part,
          title: "Part " + part,
          navigationLabel: "Part " + numberWord(part),
          order: part,
          path: pathBase + "/part-" + part,
          entryIds,
        };
      });

      const descriptors = records
        .map((record) => {
          const entry = record.entry;
          const part = entry.sequence.part;
          const sectionId = Number.isInteger(part)
            ? config.id + ":part-" + part
            : undefined;
          const pathPrefix = Number.isInteger(part)
            ? pathBase + "/part-" + part
            : pathBase;
          return {
            id: entry.id,
            slug: entry.slug,
            kind: record.metadata.type,
            path: pathPrefix + "/" + entry.slug,
            ...(sectionId ? { sectionId } : {}),
          };
        })
        .sort((left, right) => {
          const leftEntry = entries.find((entry) => entry.id === left.id);
          const rightEntry = entries.find((entry) => entry.id === right.id);
          return (
            (leftEntry?.sequence.part ?? 0) -
              (rightEntry?.sequence.part ?? 0) ||
            (leftEntry?.sequence.order ?? 0) -
              (rightEntry?.sequence.order ?? 0)
          );
        });

      return {
        id: config.id,
        slug: config.slug,
        title: [...workTitles][0],
        kind: config.kind,
        order: config.order,
        publicationState: "published",
        path: pathBase,
        sections,
        entries: descriptors,
      };
    })
    .sort((left, right) => left.order - right.order);
}

function validatePackage(publicationPackage) {
  if (publicationPackage.schemaVersion !== 2) {
    fail("the generated package uses an unsupported schema version");
  }

  if (!/^[0-9a-f]{40}$/.test(publicationPackage.manifest?.sourceRevision ?? "")) {
    fail("the generated package does not contain a full source revision");
  }

  if (!Array.isArray(publicationPackage.works)) {
    fail("the generated package has no works registry");
  }
  if (publicationPackage.manifest.workCount !== publicationPackage.works.length) {
    fail("the generated package work count is inconsistent");
  }

  const chronicles = publicationPackage.collections?.chronicles;
  if (!Array.isArray(chronicles)) {
    fail("the generated package has no chronicles collection");
  }

  const ids = new Set();
  for (const entry of chronicles) {
    if (ids.has(entry.id)) fail("duplicate entry id: " + entry.id);
    ids.add(entry.id);
    if (!slugPattern.test(entry.slug)) {
      fail(entry.title + " has an invalid public slug");
    }
    if (entry.publicationState !== "published") {
      fail(entry.title + " is not publicly eligible");
    }
    if (!Array.isArray(entry.body?.paragraphs)) {
      fail(entry.title + " has invalid prose data");
    }
  }

  const workIds = new Set();
  const workSlugs = new Set();
  const readerPaths = new Set();
  const memberships = new Map();

  for (const work of publicationPackage.works) {
    if (workIds.has(work.id)) fail("duplicate work id: " + work.id);
    workIds.add(work.id);
    if (workSlugs.has(work.slug)) fail("duplicate work slug: " + work.slug);
    workSlugs.add(work.slug);
    if (!slugPattern.test(work.slug)) fail("invalid work slug: " + work.slug);
    if (!supportedKinds.has(work.kind)) fail("unsupported work kind: " + work.kind);

    for (const candidatePath of [
      work.path,
      ...work.sections.map((section) => section.path),
      ...work.entries.map((entry) => entry.path),
    ]) {
      if (readerPaths.has(candidatePath)) {
        fail("duplicate reader path: " + candidatePath);
      }
      readerPaths.add(candidatePath);
    }

    const localSlugs = new Set();
    for (const descriptor of work.entries) {
      if (!ids.has(descriptor.id)) {
        fail(work.id + " references missing entry " + descriptor.id);
      }
      if (localSlugs.has(descriptor.slug)) {
        fail(work.id + " has duplicate entry slug " + descriptor.slug);
      }
      localSlugs.add(descriptor.slug);
      memberships.set(
        descriptor.id,
        (memberships.get(descriptor.id) ?? 0) + 1,
      );
    }
  }

  for (const entry of chronicles) {
    if (memberships.get(entry.id) !== 1) {
      fail(entry.id + " must belong to exactly one work");
    }
  }

  for (const collectionName of Object.keys(emptyCollections)) {
    if (!Array.isArray(publicationPackage.collections[collectionName])) {
      fail("the " + collectionName + " collection is missing");
    }
  }

  if (
    publicationPackage.manifest.contentDigest !==
    digestFor(
      publicationPackage.works,
      publicationPackage.collections,
      publicationPackage.relationships,
      publicationPackage.withdrawn,
    )
  ) {
    fail("the generated package content digest does not match its public entries");
  }
}

function generatePackage() {
  const approvalPolicy = JSON.parse(readFileSync(approvalPath, "utf8"));
  if (approvalPolicy.schemaVersion !== 2) {
    fail("the approval policy must use schemaVersion 2");
  }

  const approvals = (approvalPolicy.approvals ?? []).filter(
    (approval) => approval.publicationState === "published",
  );
  if (approvals.length === 0) {
    fail("there are no active publication approvals");
  }

  const writingRoot = resolveWritingRoot();
  const sourceRevision = readRevision(writingRoot);
  const recordsByWork = new Map();
  const approvalIds = [];

  for (const approval of approvals) {
    if (approval.collection !== "chronicles") {
      fail(approval.id + " targets an unsupported collection");
    }
    if (!Array.isArray(approval.sourcePaths) || approval.sourcePaths.length === 0) {
      fail(approval.id + " has no exact source paths");
    }

    const work = validateWorkConfig(approval);
    approvalIds.push(approval.id);
    const existing = recordsByWork.get(work.id);
    if (
      existing &&
      (existing.config.slug !== work.slug ||
        existing.config.kind !== work.kind ||
        existing.config.order !== work.order)
    ) {
      fail(work.id + " has conflicting work registration");
    }

    const target = existing ?? { config: work, records: [] };
    recordsByWork.set(work.id, target);

    for (const sourcePath of approval.sourcePaths) {
      const absolutePath = path.join(
        writingRoot,
        rscRelativeRoot,
        ...sourcePath.split("/"),
      );
      if (!existsSync(absolutePath)) {
        fail(sourcePath + " is approved but missing from the Writing repository");
      }
      const source = readFileSync(absolutePath, "utf8");
      target.records.push(
        normalizeSource({
          approval,
          work,
          sourcePath,
          source,
          sourceRevision,
        }),
      );
    }
  }

  const works = buildWorks(recordsByWork);
  const chronicles = works.flatMap((work) => {
    const ids = new Set(work.entries.map((entry) => entry.id));
    const records = recordsByWork.get(work.id)?.records ?? [];
    return records
      .map((record) => record.entry)
      .filter((entry) => ids.has(entry.id))
      .sort(
        (left, right) =>
          (left.sequence.part ?? 0) - (right.sequence.part ?? 0) ||
          left.sequence.order - right.sequence.order,
      );
  });

  const collections = {
    chronicles,
    ...emptyCollections,
  };
  const relationships = [];
  const withdrawn = [];
  const contentDigest = digestFor(works, collections, relationships, withdrawn);
  const firstSeries = chronicles[0]?.sequence.series;
  if (!firstSeries) fail("the public package has no series title");

  if (chronicles.some((entry) => entry.sequence.series !== firstSeries)) {
    fail("the public package contains conflicting series titles");
  }

  const publicationPackage = {
    schemaVersion: 2,
    manifest: {
      packageId:
        "rsc-" +
        sourceRevision.slice(0, 12) +
        "-" +
        contentDigest.slice(0, 12),
      sourceRevision,
      contentDigest,
      ...(approvalIds.length === 1 ? { approvalId: approvalIds[0] } : {}),
      approvalIds,
      workCount: works.length,
      world: {
        id: "rock-springs-chronicles",
        title: firstSeries,
      },
      collections: Object.fromEntries(
        Object.entries(collections).map(([name, entries]) => [
          name,
          entries.length,
        ]),
      ),
    },
    works,
    collections,
    relationships,
    withdrawn,
  };

  validatePackage(publicationPackage);
  return publicationPackage;
}

const mode = parseMode();

if (mode === "--write") {
  const publicationPackage = generatePackage();
  mkdirSync(path.dirname(generatedPath), { recursive: true });
  writeFileSync(
    generatedPath,
    JSON.stringify(publicationPackage, null, 2) + "\n",
  );
  console.log(
    "Built " +
      publicationPackage.collections.chronicles.length +
      " approved entries across " +
      publicationPackage.works.length +
      " work(s) at " +
      publicationPackage.manifest.sourceRevision.slice(0, 12) +
      ".",
  );
} else if (mode === "--check-source") {
  const expected = JSON.stringify(generatePackage(), null, 2) + "\n";
  if (!existsSync(generatedPath) || readFileSync(generatedPath, "utf8") !== expected) {
    fail("published content data is stale; run npm run content:sync");
  }
  console.log("Published content package matches the Writing repository.");
} else {
  if (!existsSync(generatedPath)) {
    fail("the generated publication package is missing; run npm run content:sync");
  }
  const publicationPackage = JSON.parse(readFileSync(generatedPath, "utf8"));
  validatePackage(publicationPackage);
  console.log(
    "Validated " +
      publicationPackage.collections.chronicles.length +
      " generated entries across " +
      publicationPackage.works.length +
      " published work(s).",
  );
}
