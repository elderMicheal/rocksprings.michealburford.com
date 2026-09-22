import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadEvidenceCatalog(relativePath) {
  return JSON.parse(readFileSync(resolve(relativePath), "utf8"));
}

export function validateEvidenceCatalog(
  evidenceCatalog,
  { expectedRevision, fail },
) {
  if (evidenceCatalog.schemaVersion !== 1) {
    fail("unsupported map-evidence schema");
  }
  if (
    expectedRevision &&
    evidenceCatalog.source?.revision !== expectedRevision
  ) {
    fail("map evidence and expected writing revisions differ");
  }

  const evidenceSourceIds = new Set(
    evidenceCatalog.sources.map((source) => source.id),
  );
  const evidenceFactIds = new Set();

  for (const fact of evidenceCatalog.facts) {
    if (!fact.id || evidenceFactIds.has(fact.id)) {
      fail(
        `missing or duplicated map-evidence fact id: ${fact.id ?? "(missing)"}`,
      );
    }
    if (!evidenceSourceIds.has(fact.sourceId)) {
      fail(`map-evidence fact references an unknown source: ${fact.id}`);
    }
    evidenceFactIds.add(fact.id);
  }

  for (const source of evidenceCatalog.sources) {
    if (!/^[0-9a-f]{40}$/.test(source.gitBlob)) {
      fail(`map-evidence source lacks an immutable Git blob: ${source.id}`);
    }
    if (
      source.publicationState === "unpublished" &&
      (source.canonicalStatus !== "canonical" ||
        !source.usage?.includes("no prose"))
    ) {
      fail(
        `unpublished map evidence lacks the canonical/no-prose boundary: ${source.id}`,
      );
    }
  }

  return { evidenceSourceIds, evidenceFactIds };
}

export function createSourceReferenceAsserter({
  evidenceFactIds,
  fail,
  chapterReferencePattern = /^Chapter [1-8]:\d+(?:-\d+)?$/,
}) {
  return function assertSourceReferences(sourceReferences, subject) {
    if (!Array.isArray(sourceReferences) || sourceReferences.length === 0) {
      fail(`${subject} lacks source evidence`);
    }

    for (const sourceReference of sourceReferences) {
      if (chapterReferencePattern.test(sourceReference)) continue;
      const evidenceMatch = /^Evidence:([a-z0-9-]+)$/.exec(sourceReference);
      if (!evidenceMatch || !evidenceFactIds.has(evidenceMatch[1])) {
        fail(`${subject} has an invalid source reference: ${sourceReference}`);
      }
    }
  };
}
