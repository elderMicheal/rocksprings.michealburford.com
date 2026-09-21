import { describe, expect, it } from "vitest";
import approvalPolicy from "../content-policy/approved-sources.json";
import publicationPackageJson from "../src/content/generated/publication-package.json";
import {
  publicationIssues,
  validatePublicationPackage,
} from "../src/content/schema";
import type { PublicationPackage } from "../src/content/types";

function clonePackage() {
  return structuredClone(publicationPackageJson) as unknown;
}

describe("publication package", () => {
  it("validates the generated package, work registry, and exact approval allowlist", () => {
    expect(() => validatePublicationPackage(publicationPackageJson)).not.toThrow();

    const approvedPaths = new Set(
      approvalPolicy.approvals.flatMap((approval) =>
        approval.sourcePaths.map(
          (sourcePath) => "Rock Springs Chronicles/" + sourcePath,
        ),
      ),
    );
    const sourceRefs = publicationPackageJson.collections.chronicles.map(
      (entry) => entry.provenance.sourceRef,
    );

    expect(sourceRefs).toHaveLength(8);
    expect(sourceRefs.every((sourceRef) => approvedPaths.has(sourceRef))).toBe(true);
    expect(publicationPackageJson.works).toHaveLength(1);
    expect(publicationPackageJson.works[0]).toMatchObject({
      slug: "jackies-window",
      kind: "novel",
      path: "/read/jackies-window",
    });
    expect(publicationPackageJson.works[0].sections[0].path).toBe(
      "/read/jackies-window/part-1",
    );
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

  it("rejects duplicate IDs and duplicate entry slugs inside one work", () => {
    const candidate = clonePackage() as typeof publicationPackageJson;
    candidate.collections.chronicles[1].id =
      candidate.collections.chronicles[0].id;
    candidate.works[0].entries[1].id = candidate.works[0].entries[0].id;
    candidate.collections.chronicles[1].slug =
      candidate.collections.chronicles[0].slug;
    candidate.works[0].entries[1].slug =
      candidate.works[0].entries[0].slug;

    expect(publicationIssues(candidate)).toEqual(
      expect.arrayContaining([
        "duplicate entry id: " + candidate.collections.chronicles[0].id,
        "duplicate entry slug in work jackies-window: chapter-01",
      ]),
    );
  });

  it("rejects work registry drift and orphaned public entries", () => {
    const candidate = clonePackage() as typeof publicationPackageJson;
    candidate.works[0].entries.shift();

    expect(publicationIssues(candidate)).toContain(
      "chronicle entry chronicle:jackies-window:part-1:chapter-01 must belong to exactly one published work",
    );
  });

  it("accepts a second generic work without title-specific schema changes", () => {
    const candidate = clonePackage() as PublicationPackage;
    const fixture = structuredClone(candidate.collections.chronicles[0]);
    fixture.id = "chronicle:fixture-anthology:fixture-story";
    fixture.slug = "fixture-story";
    fixture.title = "Fixture Story";
    fixture.provenance.sourceRef =
      "Rock Springs Chronicles/Anthologies/Fixture/Fixture Story.md";
    fixture.sequence.bookTitle = "Fixture Anthology";
    fixture.sequence.order = 1;
    delete fixture.sequence.book;
    delete fixture.sequence.part;
    delete fixture.sequence.chapter;
    fixture.body.paragraphs = [];

    candidate.collections.chronicles.push(fixture);
    candidate.manifest.collections.chronicles += 1;
    candidate.works.push({
      id: "work:fixture-anthology",
      slug: "fixture-anthology",
      title: "Fixture Anthology",
      kind: "anthology",
      order: 2,
      publicationState: "published",
      path: "/read/fixture-anthology",
      sections: [],
      entries: [
        {
          id: fixture.id,
          slug: fixture.slug,
          kind: "anthology-entry",
          path: "/read/fixture-anthology/fixture-story",
        },
      ],
    });
    candidate.manifest.workCount += 1;

    expect(publicationIssues(candidate)).toEqual([]);
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

  it("rejects malformed body content and inconsistent package counts", () => {
    const candidate = clonePackage() as {
      works: unknown[];
      collections: {
        chronicles: Array<{ body: { paragraphs: unknown } }>;
      };
      manifest: {
        workCount: number;
        collections: { chronicles: number };
      };
    };
    candidate.collections.chronicles[0].body.paragraphs = "not-an-array";
    candidate.manifest.collections.chronicles = 99;
    candidate.manifest.workCount = 99;

    expect(publicationIssues(candidate)).toEqual(
      expect.arrayContaining([
        "collections.chronicles[0].body must contain sanitized paragraph strings",
        "manifest count for chronicles is inconsistent",
        "manifest work count is inconsistent",
      ]),
    );
  });
});
