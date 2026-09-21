import { exports as workerExports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import publicationPackage from "../src/content/generated/publication-package.json";
import { contentResponseFor } from "../worker/api/content";
import type { PublicationPackage } from "../src/content/types";

function request(path: string) {
  return workerExports.default.fetch(
    new Request("https://rocksprings.test" + path),
  );
}

describe("Rock Springs Worker API", () => {
  it("reports the ready content package", async () => {
    const response = await request("/api/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      app: "rocksprings.michealburford.com",
      version: "0.1.0",
      service: "worker-api",
      contentService: "ready",
      contentPackage: publicationPackage.manifest.packageId,
    });
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
    expect(response.headers.get("x-rsc-package")).toBe(
      publicationPackage.manifest.packageId,
    );
    expect(body).toMatchObject({
      ok: true,
      state: "ready",
      sourceRevision: publicationPackage.manifest.sourceRevision,
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
    await expect(missingEntry.json()).resolves.toMatchObject({
      ok: false,
      state: "unavailable",
      error: "content_not_found",
    });

    const missingWork = await request("/api/works/not-a-work");
    expect(missingWork.status).toBe(404);
    await expect(missingWork.json()).resolves.toMatchObject({
      ok: false,
      state: "unavailable",
      error: "work_not_found",
    });

    const missingCollection = await request("/api/collections/private-notes");
    expect(missingCollection.status).toBe(404);
    await expect(missingCollection.json()).resolves.toMatchObject({
      ok: false,
      state: "unavailable",
      error: "collection_not_found",
    });
  });

  it("returns a non-disclosing withdrawn state for tombstoned legacy content", async () => {
    const packageWithTombstone = structuredClone(
      publicationPackage,
    ) as unknown as PublicationPackage;
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
