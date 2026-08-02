import { describe, expect, it } from "vitest";
import approvalPolicy from "../content-policy/approved-sources.json";
import publicationPackageJson from "../src/content/generated/publication-package.json";
import {
  publicationIssues,
  validatePublicationPackage,
} from "../src/content/schema";

function clonePackage() {
  return structuredClone(publicationPackageJson) as unknown;
}

describe("Phase 2 publication package", () => {
  it("validates the generated package and exact approval allowlist", () => {
    expect(() => validatePublicationPackage(publicationPackageJson)).not.toThrow();

    const approvedPaths = new Set(
      approvalPolicy.approvals.flatMap((approval) =>
        approval.sourcePaths.map(
          (sourcePath) => `Rock Springs Chronicles/${sourcePath}`,
        ),
      ),
    );
    const sourceRefs = publicationPackageJson.collections.chronicles.map(
      (entry) => entry.provenance.sourceRef,
    );

    expect(sourceRefs).toHaveLength(8);
    expect(sourceRefs.every((sourceRef) => approvedPaths.has(sourceRef))).toBe(true);
  });

  it("rejects private, draft, review, and withdrawn entries from the public package", () => {
    for (const state of ["private", "draft", "review", "withdrawn"]) {
      const candidate = clonePackage() as typeof publicationPackageJson;
      candidate.collections.chronicles[0].publicationState = state;
      expect(publicationIssues(candidate)).toContain(
        "collections.chronicles[0].publicationState must be published",
      );
    }
  });

  it("rejects duplicate IDs and duplicate slugs", () => {
    const candidate = clonePackage() as typeof publicationPackageJson;
    candidate.collections.chronicles[1].id =
      candidate.collections.chronicles[0].id;
    candidate.collections.chronicles[1].slug =
      candidate.collections.chronicles[0].slug;

    expect(publicationIssues(candidate)).toEqual(
      expect.arrayContaining([
        `duplicate entry id: ${candidate.collections.chronicles[0].id}`,
        `duplicate chronicles slug: ${candidate.collections.chronicles[0].slug}`,
      ]),
    );
  });

  it("rejects broken relationships and non-RSC provenance", () => {
    const candidate = clonePackage() as {
      collections: {
        chronicles: Array<{
          id: string;
          provenance: { sourceRef: string };
        }>;
      };
      relationships: Array<Record<string, string>>;
    };
    candidate.collections.chronicles[0].provenance.sourceRef =
      "../Private Notes/secret.md";
    candidate.relationships = [
      {
        id: "relationship:broken",
        type: "chronicle-place",
        from: candidate.collections.chronicles[0].id,
        to: "place:missing",
        basis: "authored",
      },
    ];

    expect(publicationIssues(candidate)).toEqual(
      expect.arrayContaining([
        "collections.chronicles[0].provenance.sourceRef must remain inside the RSC allowlist",
        "relationships[0] contains a broken public reference",
      ]),
    );
  });

  it("accepts explicit empty collections and sanitized manuscript paragraphs", () => {
    expect(publicationPackageJson.collections.people).toEqual([]);
    expect(publicationPackageJson.collections.places).toEqual([]);
    expect(publicationPackageJson.collections.artifacts).toEqual([]);
    expect(publicationPackageJson.collections.timeline).toEqual([]);

    const paragraphs = publicationPackageJson.collections.chronicles.flatMap(
      (entry) => entry.body.paragraphs,
    );
    expect(paragraphs.length).toBeGreaterThan(0);
    expect(paragraphs.every((paragraph) => !/<\/?[a-z][^>]*>/i.test(paragraph))).toBe(true);
    expect(paragraphs.every((paragraph) => !/\[[^\]]+\]\([^)]+\)/.test(paragraph))).toBe(true);
  });

  it("rejects malformed body content and inconsistent collection counts", () => {
    const candidate = clonePackage() as {
      collections: {
        chronicles: Array<{ body: { paragraphs: unknown } }>;
      };
      manifest: { collections: { chronicles: number } };
    };
    candidate.collections.chronicles[0].body.paragraphs = "not-an-array";
    candidate.manifest.collections.chronicles = 99;

    expect(publicationIssues(candidate)).toEqual(
      expect.arrayContaining([
        "collections.chronicles[0].body must contain sanitized paragraph strings",
        "manifest count for chronicles is inconsistent",
      ]),
    );
  });
});
