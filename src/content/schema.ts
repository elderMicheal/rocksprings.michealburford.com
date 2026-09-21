import {
  collectionNames,
  entryKinds,
  workKinds,
  type ChronicleEntry,
  type PublicationPackage,
} from "./types";

export class PublicationValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super("Publication package validation failed:\n- " + issues.join("\n- "));
    this.name = "PublicationValidationError";
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSlug(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  );
}

function isReaderPath(value: unknown): value is string {
  return typeof value === "string" && /^\/read\/[a-z0-9][a-z0-9/-]*$/.test(value);
}

function validateChronicle(
  value: unknown,
  index: number,
  ids: Set<string>,
  issues: string[],
) {
  const label = "collections.chronicles[" + index + "]";
  if (!isRecord(value)) {
    issues.push(label + " must be an object");
    return;
  }

  for (const field of ["id", "slug", "title", "editorialStatus"] as const) {
    if (typeof value[field] !== "string" || value[field].length === 0) {
      issues.push(label + "." + field + " must be a non-empty string");
    }
  }

  if (value.collection !== "chronicles") {
    issues.push(label + ".collection must be chronicles");
  }
  if (value.publicationState !== "published") {
    issues.push(label + ".publicationState must be published");
  }

  if (typeof value.id === "string") {
    if (ids.has(value.id)) issues.push("duplicate entry id: " + value.id);
    ids.add(value.id);
  }
  if (!isSlug(value.slug)) {
    issues.push(label + ".slug is not a stable public slug");
  }

  if (!isRecord(value.provenance)) {
    issues.push(label + ".provenance is required");
  } else {
    if (
      typeof value.provenance.sourceRevision !== "string" ||
      !/^[0-9a-f]{40}$/.test(value.provenance.sourceRevision)
    ) {
      issues.push(label + ".provenance.sourceRevision must be a full Git revision");
    }
    if (
      typeof value.provenance.sourceRef !== "string" ||
      !value.provenance.sourceRef.startsWith("Rock Springs Chronicles/")
    ) {
      issues.push(
        label + ".provenance.sourceRef must remain inside the RSC allowlist",
      );
    }
    if (typeof value.provenance.approvalId !== "string") {
      issues.push(label + ".provenance.approvalId is required");
    }
  }

  if (!isRecord(value.sequence)) {
    issues.push(label + ".sequence is required");
  } else {
    if (typeof value.sequence.series !== "string" || value.sequence.series.length === 0) {
      issues.push(label + ".sequence.series must be a non-empty string");
    }
    if (
      typeof value.sequence.bookTitle !== "string" ||
      value.sequence.bookTitle.length === 0
    ) {
      issues.push(label + ".sequence.bookTitle must be a non-empty string");
    }
    if (
      typeof value.sequence.order !== "number" ||
      !Number.isInteger(value.sequence.order) ||
      value.sequence.order < 1
    ) {
      issues.push(label + ".sequence.order must be a positive integer");
    }
  }

  if (
    !isRecord(value.body) ||
    value.body.format !== "safe-inline-markdown" ||
    !Array.isArray(value.body.paragraphs) ||
    value.body.paragraphs.some((paragraph) => typeof paragraph !== "string")
  ) {
    issues.push(label + ".body must contain sanitized paragraph strings");
  }

  if (!isRecord(value.presentation)) {
    issues.push(label + ".presentation is required");
  }
}

function validateWorks(
  value: unknown,
  chronicles: ChronicleEntry[],
  issues: string[],
) {
  if (!Array.isArray(value)) {
    issues.push("works must be an array");
    return;
  }

  const chronicleById = new Map(chronicles.map((entry) => [entry.id, entry]));
  const workIds = new Set<string>();
  const workSlugs = new Set<string>();
  const readerPaths = new Set<string>();
  const memberships = new Map<string, number>();

  value.forEach((candidate, workIndex) => {
    const label = "works[" + workIndex + "]";
    if (!isRecord(candidate)) {
      issues.push(label + " must be an object");
      return;
    }

    if (typeof candidate.id !== "string" || candidate.id.length === 0) {
      issues.push(label + ".id must be a non-empty string");
    } else {
      if (workIds.has(candidate.id)) issues.push("duplicate work id: " + candidate.id);
      workIds.add(candidate.id);
    }

    if (!isSlug(candidate.slug)) {
      issues.push(label + ".slug is not a stable public slug");
    } else {
      if (workSlugs.has(candidate.slug)) {
        issues.push("duplicate work slug: " + candidate.slug);
      }
      workSlugs.add(candidate.slug);
    }

    if (typeof candidate.title !== "string" || candidate.title.length === 0) {
      issues.push(label + ".title must be a non-empty string");
    }
    if (!workKinds.includes(candidate.kind as never)) {
      issues.push(label + ".kind is unsupported");
    }
    if (candidate.publicationState !== "published") {
      issues.push(label + ".publicationState must be published");
    }
    if (
      typeof candidate.order !== "number" ||
      !Number.isInteger(candidate.order) ||
      candidate.order < 1
    ) {
      issues.push(label + ".order must be a positive integer");
    }
    if (!isReaderPath(candidate.path)) {
      issues.push(label + ".path must be a stable /read path");
    } else {
      if (readerPaths.has(candidate.path)) {
        issues.push("duplicate reader path: " + candidate.path);
      }
      readerPaths.add(candidate.path);
    }

    const descriptors = Array.isArray(candidate.entries) ? candidate.entries : [];
    if (!Array.isArray(candidate.entries)) {
      issues.push(label + ".entries must be an array");
    }

    const localSlugs = new Set<string>();
    const descriptorById = new Map<string, Record<string, unknown>>();

    descriptors.forEach((descriptor, entryIndex) => {
      const entryLabel = label + ".entries[" + entryIndex + "]";
      if (!isRecord(descriptor)) {
        issues.push(entryLabel + " must be an object");
        return;
      }
      if (typeof descriptor.id !== "string" || descriptor.id.length === 0) {
        issues.push(entryLabel + ".id must be a non-empty string");
        return;
      }

      const entry = chronicleById.get(descriptor.id);
      if (!entry) {
        issues.push(entryLabel + " references a missing chronicle entry");
      } else {
        memberships.set(entry.id, (memberships.get(entry.id) ?? 0) + 1);
        if (descriptor.slug !== entry.slug) {
          issues.push(entryLabel + ".slug must match its chronicle entry");
        }
      }

      if (!isSlug(descriptor.slug)) {
        issues.push(entryLabel + ".slug is not a stable public slug");
      } else {
        if (localSlugs.has(descriptor.slug)) {
          issues.push(
            "duplicate entry slug in work " +
              String(candidate.slug ?? workIndex) +
              ": " +
              descriptor.slug,
          );
        }
        localSlugs.add(descriptor.slug);
      }

      if (!entryKinds.includes(descriptor.kind as never)) {
        issues.push(entryLabel + ".kind is unsupported");
      }
      if (!isReaderPath(descriptor.path)) {
        issues.push(entryLabel + ".path must be a stable /read path");
      } else {
        if (readerPaths.has(descriptor.path)) {
          issues.push("duplicate reader path: " + descriptor.path);
        }
        readerPaths.add(descriptor.path);
      }

      descriptorById.set(descriptor.id, descriptor);
    });

    const sections = Array.isArray(candidate.sections) ? candidate.sections : [];
    if (!Array.isArray(candidate.sections)) {
      issues.push(label + ".sections must be an array");
    }

    const sectionIds = new Set<string>();
    sections.forEach((section, sectionIndex) => {
      const sectionLabel = label + ".sections[" + sectionIndex + "]";
      if (!isRecord(section)) {
        issues.push(sectionLabel + " must be an object");
        return;
      }

      if (typeof section.id !== "string" || section.id.length === 0) {
        issues.push(sectionLabel + ".id must be a non-empty string");
      } else {
        if (sectionIds.has(section.id)) {
          issues.push("duplicate section id in work: " + section.id);
        }
        sectionIds.add(section.id);
      }
      if (!isSlug(section.slug)) {
        issues.push(sectionLabel + ".slug is not a stable public slug");
      }
      if (
        typeof section.title !== "string" ||
        typeof section.navigationLabel !== "string"
      ) {
        issues.push(sectionLabel + " must contain title and navigationLabel");
      }
      if (!isReaderPath(section.path)) {
        issues.push(sectionLabel + ".path must be a stable /read path");
      } else {
        if (readerPaths.has(section.path)) {
          issues.push("duplicate reader path: " + section.path);
        }
        readerPaths.add(section.path);
      }

      if (!Array.isArray(section.entryIds)) {
        issues.push(sectionLabel + ".entryIds must be an array");
        return;
      }

      for (const entryId of section.entryIds) {
        const descriptor = descriptorById.get(String(entryId));
        if (!descriptor) {
          issues.push(sectionLabel + " references an entry outside its work");
          continue;
        }
        if (descriptor.sectionId !== section.id) {
          issues.push(
            sectionLabel + " entry " + entryId + " has inconsistent section membership",
          );
        }
      }
    });

    for (const descriptor of descriptors) {
      if (
        isRecord(descriptor) &&
        typeof descriptor.sectionId === "string" &&
        !sectionIds.has(descriptor.sectionId)
      ) {
        issues.push(
          label + " entry " + String(descriptor.id) + " references a missing section",
        );
      }
    }
  });

  for (const entry of chronicles) {
    const count = memberships.get(entry.id) ?? 0;
    if (count !== 1) {
      issues.push(
        "chronicle entry " + entry.id + " must belong to exactly one published work",
      );
    }
  }
}

export function validatePublicationPackage(
  value: unknown,
): asserts value is PublicationPackage {
  const issues: string[] = [];
  if (!isRecord(value)) {
    throw new PublicationValidationError(["package must be an object"]);
  }

  if (value.schemaVersion !== 2) {
    issues.push("schemaVersion must be 2");
  }
  if (!isRecord(value.manifest)) {
    issues.push("manifest is required");
  }
  if (!isRecord(value.collections)) {
    issues.push("collections is required");
  } else {
    for (const collectionName of collectionNames) {
      if (!Array.isArray(value.collections[collectionName])) {
        issues.push("collections." + collectionName + " must be an array");
      }
    }
  }
  if (!Array.isArray(value.relationships)) {
    issues.push("relationships must be an array");
  }
  if (!Array.isArray(value.withdrawn)) {
    issues.push("withdrawn must be an array");
  } else {
    for (const [index, tombstone] of value.withdrawn.entries()) {
      if (
        !isRecord(tombstone) ||
        typeof tombstone.slug !== "string" ||
        !collectionNames.includes(tombstone.collection as never)
      ) {
        issues.push("withdrawn[" + index + "] must contain a collection and slug");
      }
    }
  }

  const ids = new Set<string>();
  const chronicles =
    isRecord(value.collections) && Array.isArray(value.collections.chronicles)
      ? (value.collections.chronicles as ChronicleEntry[])
      : [];
  chronicles.forEach((entry, index) =>
    validateChronicle(entry, index, ids, issues),
  );

  if (isRecord(value.collections)) {
    for (const collectionName of collectionNames.filter(
      (name) => name !== "chronicles",
    )) {
      const entries = value.collections[collectionName];
      if (!Array.isArray(entries)) continue;
      for (const [index, entry] of entries.entries()) {
        if (!isRecord(entry)) {
          issues.push(
            "collections." + collectionName + "[" + index + "] must be an object",
          );
          continue;
        }
        if (entry.publicationState !== "published") {
          issues.push(
            "collections." +
              collectionName +
              "[" +
              index +
              "] is not publicly eligible",
          );
        }
        if (typeof entry.id === "string") {
          if (ids.has(entry.id)) issues.push("duplicate entry id: " + entry.id);
          ids.add(entry.id);
        }
      }
    }
  }

  validateWorks(value.works, chronicles, issues);

  const relationships = Array.isArray(value.relationships)
    ? value.relationships
    : [];
  for (const [index, relationship] of relationships.entries()) {
    if (!isRecord(relationship)) {
      issues.push("relationships[" + index + "] must be an object");
      continue;
    }
    if (
      typeof relationship.from !== "string" ||
      typeof relationship.to !== "string" ||
      !ids.has(relationship.from) ||
      !ids.has(relationship.to)
    ) {
      issues.push("relationships[" + index + "] contains a broken public reference");
    }
    if (relationship.basis !== "authored") {
      issues.push("relationships[" + index + "] must have an authored basis");
    }
  }

  if (isRecord(value.manifest)) {
    if (
      !Array.isArray(value.manifest.approvalIds) ||
      value.manifest.approvalIds.some((id) => typeof id !== "string")
    ) {
      issues.push("manifest.approvalIds must be an array of approval IDs");
    }
    if (
      !Array.isArray(value.works) ||
      value.manifest.workCount !== value.works.length
    ) {
      issues.push("manifest work count is inconsistent");
    }
  }

  if (
    isRecord(value.manifest) &&
    isRecord(value.manifest.collections) &&
    isRecord(value.collections)
  ) {
    for (const collectionName of collectionNames) {
      const entries = value.collections[collectionName];
      if (
        Array.isArray(entries) &&
        value.manifest.collections[collectionName] !== entries.length
      ) {
        issues.push("manifest count for " + collectionName + " is inconsistent");
      }
    }
  }

  if (issues.length > 0) {
    throw new PublicationValidationError(issues);
  }
}

export function publicationIssues(value: unknown): string[] {
  try {
    validatePublicationPackage(value);
    return [];
  } catch (error) {
    return error instanceof PublicationValidationError
      ? error.issues
      : ["unknown validation error"];
  }
}

export function publicChronicle(entry: ChronicleEntry) {
  return {
    id: entry.id,
    slug: entry.slug,
    collection: entry.collection,
    title: entry.title,
    publicationState: entry.publicationState,
    editorialStatus: entry.editorialStatus,
    sequence: entry.sequence,
    body: entry.body,
    presentation: entry.presentation,
  };
}
