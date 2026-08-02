import { exports as workerExports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import publicationPackage from "../src/content/generated/publication-package.json";
import { contentResponseFor } from "../worker/api/content";
import type { PublicationPackage } from "../src/content/types";

function request(path: string) {
  return workerExports.default.fetch(
    new Request(`https://rocksprings.test${path}`),
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

  it("publishes a revision-traced collection manifest", async () => {
    const response = await request("/api/manifest");
    const body = await response.json<{
      ok: boolean;
      state: string;
      sourceRevision: string;
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

  it("serves a chapter by stable slug without private provenance", async () => {
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
      "/api/content/chronicles/not-a-chapter",
    );
    expect(missingEntry.status).toBe(404);
    await expect(missingEntry.json()).resolves.toMatchObject({
      ok: false,
      state: "unavailable",
      error: "content_not_found",
    });

    const missingCollection = await request("/api/collections/private-notes");
    expect(missingCollection.status).toBe(404);
    await expect(missingCollection.json()).resolves.toMatchObject({
      ok: false,
      state: "unavailable",
      error: "collection_not_found",
    });
  });

  it("returns a non-disclosing withdrawn state for tombstoned content", async () => {
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
