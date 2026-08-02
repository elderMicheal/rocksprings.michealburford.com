import {
  collectionNames,
  type ChronicleEntry,
  type PublicationPackage,
} from "./types";

export class PublicationValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Publication package validation failed:\n- ${issues.join("\n- ")}`);
    this.name = "PublicationValidationError";
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateChronicle(
  value: unknown,
  index: number,
  ids: Set<string>,
  slugs: Set<string>,
  issues: string[],
) {
  const label = `collections.chronicles[${index}]`;
  if (!isRecord(value)) {
    issues.push(`${label} must be an object`);
    return;
  }

  for (const field of ["id", "slug", "title", "editorialStatus"] as const) {
    if (typeof value[field] !== "string" || value[field].length === 0) {
      issues.push(`${label}.${field} must be a non-empty string`);
    }
  }

  if (value.collection !== "chronicles") {
    issues.push(`${label}.collection must be chronicles`);
  }
  if (value.publicationState !== "published") {
    issues.push(`${label}.publicationState must be published`);
  }

  if (typeof value.id === "string") {
    if (ids.has(value.id)) issues.push(`duplicate entry id: ${value.id}`);
    ids.add(value.id);
  }
  if (typeof value.slug === "string") {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)) {
      issues.push(`${label}.slug is not a stable public slug`);
    }
    if (slugs.has(value.slug)) issues.push(`duplicate chronicles slug: ${value.slug}`);
    slugs.add(value.slug);
  }

  if (!isRecord(value.provenance)) {
    issues.push(`${label}.provenance is required`);
  } else {
    if (
      typeof value.provenance.sourceRevision !== "string" ||
      !/^[0-9a-f]{40}$/.test(value.provenance.sourceRevision)
    ) {
      issues.push(`${label}.provenance.sourceRevision must be a full Git revision`);
    }
    if (
      typeof value.provenance.sourceRef !== "string" ||
      !value.provenance.sourceRef.startsWith("Rock Springs Chronicles/")
    ) {
      issues.push(`${label}.provenance.sourceRef must remain inside the RSC allowlist`);
    }
    if (typeof value.provenance.approvalId !== "string") {
      issues.push(`${label}.provenance.approvalId is required`);
    }
  }

  if (
    !isRecord(value.body) ||
    value.body.format !== "safe-inline-markdown" ||
    !Array.isArray(value.body.paragraphs) ||
    value.body.paragraphs.some((paragraph) => typeof paragraph !== "string")
  ) {
    issues.push(`${label}.body must contain sanitized paragraph strings`);
  }

  if (!isRecord(value.presentation)) {
    issues.push(`${label}.presentation is required`);
  }
}

export function validatePublicationPackage(value: unknown): asserts value is PublicationPackage {
  const issues: string[] = [];
  if (!isRecord(value)) {
    throw new PublicationValidationError(["package must be an object"]);
  }

  if (value.schemaVersion !== 1) {
    issues.push("schemaVersion must be 1");
  }
  if (!isRecord(value.manifest)) {
    issues.push("manifest is required");
  }
  if (!isRecord(value.collections)) {
    issues.push("collections is required");
  } else {
    for (const collectionName of collectionNames) {
      if (!Array.isArray(value.collections[collectionName])) {
        issues.push(`collections.${collectionName} must be an array`);
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
        issues.push(`withdrawn[${index}] must contain a collection and slug`);
      }
    }
  }

  const ids = new Set<string>();
  const chronicleSlugs = new Set<string>();
  const chronicles =
    isRecord(value.collections) && Array.isArray(value.collections.chronicles)
      ? value.collections.chronicles
      : [];
  chronicles.forEach((entry, index) =>
    validateChronicle(entry, index, ids, chronicleSlugs, issues),
  );

  if (isRecord(value.collections)) {
    for (const collectionName of collectionNames.filter(
      (name) => name !== "chronicles",
    )) {
      const entries = value.collections[collectionName];
      if (!Array.isArray(entries)) continue;
      for (const [index, entry] of entries.entries()) {
        if (!isRecord(entry)) {
          issues.push(`collections.${collectionName}[${index}] must be an object`);
          continue;
        }
        if (entry.publicationState !== "published") {
          issues.push(
            `collections.${collectionName}[${index}] is not publicly eligible`,
          );
        }
        if (typeof entry.id === "string") {
          if (ids.has(entry.id)) issues.push(`duplicate entry id: ${entry.id}`);
          ids.add(entry.id);
        }
      }
    }
  }

  const relationships = Array.isArray(value.relationships) ? value.relationships : [];
  for (const [index, relationship] of relationships.entries()) {
    if (!isRecord(relationship)) {
      issues.push(`relationships[${index}] must be an object`);
      continue;
    }
    if (
      typeof relationship.from !== "string" ||
      typeof relationship.to !== "string" ||
      !ids.has(relationship.from) ||
      !ids.has(relationship.to)
    ) {
      issues.push(`relationships[${index}] contains a broken public reference`);
    }
    if (relationship.basis !== "authored") {
      issues.push(`relationships[${index}] must have an authored basis`);
    }
  }

  if (isRecord(value.manifest) && isRecord(value.manifest.collections) && isRecord(value.collections)) {
    for (const collectionName of collectionNames) {
      const entries = value.collections[collectionName];
      if (
        Array.isArray(entries) &&
        value.manifest.collections[collectionName] !== entries.length
      ) {
        issues.push(`manifest count for ${collectionName} is inconsistent`);
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
