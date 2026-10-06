import { exports as workerExports } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { contentResponseFor } from "../worker/api/content";
import {
  loadPublicationPackage,
  resetDraftworksCacheForTest,
  setDraftworksFetchForTest,
} from "../worker/api/draftworks";
import type { PublicationPackage } from "../src/content/types";

const sourceRevision = "a".repeat(40);

const documentDescriptors = Array.from({ length: 8 }, (_, index) => {
  const chapter = index + 1;
  const key = String(chapter).padStart(2, "0");
  return {
    id: `doc:chapter-${key}`,
    kind: "chapter",
    title: `Chapter ${chapter}`,
    work: { id: "work:jackies-window", title: "Jackie's Window" },
    series: "The Rock Springs Chronicles",
    order: {
      book: 1,
      part: 1,
      chapter,
      order: chapter,
    },
    href: `documents/chapter-${key}.json`,
  };
});

const worksResponse = {
  schemaVersion: 1,
  sourceRevision,
  works: [
    {
      schemaVersion: 1,
      id: "work:jackies-window",
      title: "Jackie's Window",
      series: "The Rock Springs Chronicles",
      documentIds: documentDescriptors.map((document) => document.id),
      documents: documentDescriptors,
      href: "works/jackies-window.json",
    },
  ],
};

function draftworksFetch(input: RequestInfo | URL) {
  const url = new URL(String(input));
  if (url.pathname.endsWith("/works.json")) {
    return Promise.resolve(Response.json(worksResponse));
  }

  const match = /\/documents\/chapter-(\d{2})\.json$/.exec(url.pathname);
  if (match) {
    const chapter = Number(match[1]);
    const descriptor = documentDescriptors[chapter - 1];
    return Promise.resolve(
      Response.json({
        schemaVersion: 1,
        ...descriptor,
        visibility: "public",
        publication: {
          state: "published",
          sourceStatus: "draft",
        },
        sourceRevision,
        content: {
          format: "markdown",
          markdown:
            `# Jackie's Window\n\n## Chapter ${chapter}\n\n` +
            `Chapter ${chapter} fixture prose from Draftworks.`,
        },
      }),
    );
  }

  return Promise.resolve(new Response("not found", { status: 404 }));
}

function request(path: string) {
  return workerExports.default.fetch(
    new Request("https://rocksprings.test" + path),
  );
}

beforeEach(() => {
  setDraftworksFetchForTest(draftworksFetch);
});

afterEach(() => {
  setDraftworksFetchForTest();
  resetDraftworksCacheForTest();
});

describe("Rock Springs Worker API", () => {
  it("reports a ready Draftworks-backed content package", async () => {
    const response = await request("/api/health");
    const body = await response.json<{
      ok: boolean;
      contentService: string;
      contentPackage: string;
      sourceRevision: string;
    }>();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      contentService: "ready",
      sourceRevision,
    });
    expect(body.contentPackage).toMatch(/^rsc-a{12}-[0-9a-f]{12}$/);
  });

  it("publishes a revision-traced collection and work manifest", async () => {
    const response = await request("/api/manifest");
    const body = await response.json<{
      ok: boolean;
      state: string;
      sourceRevision: string;
      workCount: number;
      collections: Record<string, number>;
    }>();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-rsc-package")).toMatch(/^rsc-/);
    expect(body).toMatchObject({
      ok: true,
      state: "ready",
      sourceRevision,
      workCount: 1,
      collections: {
        chronicles: 8,
        people: 0,
        places: 0,
        events: 0,
        artifacts: 0,
        timeline: 0,
        media: 0,
      },
    });
  });

  it("serves the complete same-origin publication view", async () => {
    const response = await request("/api/publication");
    const publication = await response.json<PublicationPackage>();

    expect(response.status).toBe(200);
    expect(publication.manifest.sourceRevision).toBe(sourceRevision);
    expect(publication.works).toHaveLength(1);
    expect(publication.collections.chronicles).toHaveLength(8);
    expect(publication.collections.chronicles[0].provenance.sourceRef).toBe(
      "doc:chapter-01",
    );
    expect(publication.collections.chronicles[0].body.paragraphs).toEqual([
      "Chapter 1 fixture prose from Draftworks.",
    ]);
  });

  it("serves generic work indexes and work-scoped entries", async () => {
    const worksResponse = await request("/api/works");
    const works = await worksResponse.json<{
      state: string;
      count: number;
      works: Array<{ slug: string; path: string }>;
    }>();
    expect(worksResponse.status).toBe(200);
    expect(works.state).toBe("ready");
    expect(works.count).toBe(1);
    expect(works.works[0]).toMatchObject({
      slug: "jackies-window",
      path: "/read/jackies-window",
    });

    const workResponse = await request("/api/works/jackies-window");
    const work = await workResponse.json<{
      work: { slug: string; entries: Array<{ entry?: Record<string, unknown> }> };
    }>();
    expect(workResponse.status).toBe(200);
    expect(work.work.slug).toBe("jackies-window");
    expect(work.work.entries).toHaveLength(8);
    expect(work.work.entries[0].entry).not.toHaveProperty("provenance");

    const entryResponse = await request(
      "/api/works/jackies-window/chapter-01",
    );
    const entry = await entryResponse.json<{
      entry: Record<string, unknown>;
    }>();
    expect(entryResponse.status).toBe(200);
    expect(entry.entry).toMatchObject({
      slug: "chapter-01",
      title: "Chapter 1",
    });
    expect(entry.entry).not.toHaveProperty("provenance");
  });

  it("returns public collections and explicit empty states", async () => {
    const chroniclesResponse = await request("/api/collections/chronicles");
    const chronicles = await chroniclesResponse.json<{
      state: string;
      count: number;
      entries: Array<Record<string, unknown>>;
    }>();
    expect(chroniclesResponse.status).toBe(200);
    expect(chronicles.state).toBe("ready");
    expect(chronicles.count).toBe(8);
    expect(chronicles.entries[0]).not.toHaveProperty("provenance");

    const peopleResponse = await request("/api/collections/people");
    await expect(peopleResponse.json()).resolves.toMatchObject({
      ok: true,
      state: "empty",
      collection: "people",
      count: 0,
      entries: [],
    });
  });

  it("preserves the legacy collection-plus-slug content endpoint", async () => {
    const response = await request("/api/content/chronicles/chapter-01");
    const body = await response.json<{
      ok: boolean;
      entry: Record<string, unknown>;
    }>();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.entry).toMatchObject({
      slug: "chapter-01",
      title: "Chapter 1",
      publicationState: "published",
    });
    expect(body.entry).not.toHaveProperty("provenance");
  });

  it("returns empty relationships without inventing associations", async () => {
    const response = await request(
      "/api/relationships/chronicles/chapter-01",
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      state: "empty",
      relationships: [],
    });
  });

  it("returns structured unavailable states for unknown public content", async () => {
    const missingEntry = await request(
      "/api/works/jackies-window/not-a-chapter",
    );
    expect(missingEntry.status).toBe(404);

    const missingWork = await request("/api/works/not-a-work");
    expect(missingWork.status).toBe(404);

    const missingCollection = await request("/api/collections/private-notes");
    expect(missingCollection.status).toBe(404);
  });

  it("returns a non-disclosing withdrawn state for tombstoned legacy content", async () => {
    const packageWithTombstone = structuredClone(
      await loadPublicationPackage(),
    ) as PublicationPackage;
    packageWithTombstone.withdrawn.push({
      collection: "chronicles",
      slug: "withdrawn-chapter",
    });

    const response = contentResponseFor(
      packageWithTombstone,
      "chronicles",
      "withdrawn-chapter",
    );
    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      state: "withdrawn",
      error: "content_withdrawn",
      collection: "chronicles",
      slug: "withdrawn-chapter",
    });
  });

  it("returns JSON 404 responses for unknown API routes", async () => {
    const response = await request("/api/unknown");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "not_found",
    });
  });
});
