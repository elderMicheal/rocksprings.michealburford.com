import { describe, expect, it } from "vitest";
import { loadRockSpringsWriting } from "../toolchain/analysis/draftworks-source.mjs";

describe("Rock Springs Analysis Draftworks source", () => {
  it("loads only public Rock Springs material through API resources", async () => {
    const revision = "b".repeat(40);
    const responses = new Map([
      [
        "/api/v1/works.json",
        {
          schemaVersion: 1,
          sourceRevision: revision,
          works: [
            {
              id: "work:rsc",
              title: "Jackie's Window",
              series: "The Rock Springs Chronicles",
              documentIds: ["doc:one"],
              documents: [
                {
                  id: "doc:one",
                  href: "documents/one.json",
                },
              ],
            },
            {
              id: "work:other",
              title: "Other",
              series: "Other Series",
              documentIds: ["doc:other"],
              documents: [
                {
                  id: "doc:other",
                  href: "documents/other.json",
                },
              ],
            },
          ],
        },
      ],
      [
        "/api/v1/documents/one.json",
        {
          schemaVersion: 1,
          id: "doc:one",
          kind: "chapter",
          title: "Chapter 1",
          series: "The Rock Springs Chronicles",
          order: { book: 1, part: 1, chapter: 1, order: 1 },
          visibility: "public",
          publication: { state: "published", sourceStatus: "draft" },
          sourceRevision: revision,
          content: { format: "markdown", markdown: "Public text." },
        },
      ],
    ]);

    const fetchImpl = async (input: RequestInfo | URL) => {
      const pathname = new URL(String(input)).pathname;
      const body = responses.get(pathname);
      return body
        ? Response.json(body)
        : new Response("not found", { status: 404 });
    };

    const result = await loadRockSpringsWriting({
      fetchImpl,
      baseUrl: "https://example.test/api/v1",
    });

    expect(result.sourceRevision).toBe(revision);
    expect(result.works).toHaveLength(1);
    expect(result.documents).toEqual([
      expect.objectContaining({
        id: "doc:one",
        workId: "work:rsc",
        title: "Chapter 1",
        markdown: "Public text.",
      }),
    ]);
  });
});
