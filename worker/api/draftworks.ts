import type {
  ChronicleEntry,
  EntryKind,
  PublicationPackage,
  PublishedWork,
  PublishedWorkEntry,
  PublishedWorkSection,
  WorkKind,
} from "../../src/content/types";

const DRAFTWORKS_BASE = "https://www.michealburford.com/api/v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

type DraftworksDocumentSummary = {
  id: string;
  kind: string;
  title: string;
  work: { id: string; title: string };
  series: string;
  order: {
    book?: number;
    part?: number;
    chapter?: number;
    order?: number;
  };
  href: string;
};

type DraftworksWork = {
  id: string;
  title: string;
  series: string;
  documentIds: string[];
  documents: DraftworksDocumentSummary[];
};

type DraftworksWorksResponse = {
  schemaVersion: 1;
  sourceRevision: string;
  works: DraftworksWork[];
};

type DraftworksDocument = DraftworksDocumentSummary & {
  schemaVersion: 1;
  visibility: "public";
  publication: {
    state: "published";
    sourceStatus?: string;
  };
  sourceRevision: string;
  content: {
    format: "markdown";
    markdown: string;
  };
};

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

let fetchImpl: FetchLike = fetch;
let cached:
  | {
      expiresAt: number;
      value: PublicationPackage;
    }
  | undefined;
let pending: Promise<PublicationPackage> | undefined;

function slugify(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "untitled";
}

function partLabel(part: number) {
  const words = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
  ];
  return words[part] ? `Part ${words[part]}` : `Part ${part}`;
}

function entryKind(value: string): EntryKind {
  if (value === "chapter") return "chapter";
  if (value === "interlude") return "interlude";
  if (value === "anthology-entry") return "anthology-entry";
  return "story";
}

function workKind(documents: DraftworksDocumentSummary[]): WorkKind {
  if (
    documents.length > 0 &&
    documents.every((document) => document.kind === "chapter")
  ) {
    return "novel";
  }
  if (documents.some((document) => document.kind === "anthology-entry")) {
    return "anthology";
  }
  return documents.length === 1 ? "standalone" : "collection";
}

function sanitizeInlineMarkdown(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/\[\[([^\]|]+)\|([^\]]+)]]/g, "$2")
    .replace(/\[\[([^\]]+)]]/g, "$1")
    .trim();
}

function manuscriptParagraphs(markdown: string) {
  const blocks = String(markdown || "")
    .replace(/\r/g, "")
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .filter((block) => !/^#{1,6}\s+/.test(block))
    .filter((block) => !/^[-*_]{3,}$/.test(block))
    .map((block) => sanitizeInlineMarkdown(block.replace(/\n+/g, " ")))
    .filter(Boolean);
}

function plainWords(paragraphs: string[]) {
  return paragraphs
    .join(" ")
    .replace(/[*_~`#]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function entrySlug(document: DraftworksDocumentSummary) {
  if (document.kind === "chapter" && Number.isInteger(document.order.chapter)) {
    return `chapter-${String(document.order.chapter).padStart(2, "0")}`;
  }
  if (
    document.kind === "interlude" &&
    Number.isInteger(document.order.order)
  ) {
    return `interlude-${String(document.order.order).padStart(2, "0")}`;
  }
  return slugify(document.title);
}

function readerPath(
  workSlug: string,
  document: DraftworksDocumentSummary,
) {
  const slug = entrySlug(document);
  const part = document.order.part;
  return Number.isInteger(part)
    ? `/read/${workSlug}/part-${part}/${slug}`
    : `/read/${workSlug}/${slug}`;
}

async function fetchJson<T>(relative: string): Promise<T> {
  const response = await fetchImpl(
    `${DRAFTWORKS_BASE}/${relative.replace(/^\/+/, "")}`,
    {
      headers: {
        accept: "application/json",
        "user-agent": "rocksprings.michealburford.com",
      },
    },
  );
  if (!response.ok) {
    throw new Error(
      `Draftworks request failed: ${response.status} ${relative}`,
    );
  }
  return response.json<T>();
}

async function digest(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function buildPublicationPackage(): Promise<PublicationPackage> {
  const worksResponse = await fetchJson<DraftworksWorksResponse>("works.json");
  if (
    worksResponse.schemaVersion !== 1 ||
    !/^[0-9a-f]{40}$/i.test(worksResponse.sourceRevision)
  ) {
    throw new Error("Draftworks works manifest is invalid.");
  }

  const allDocuments = await Promise.all(
    worksResponse.works.flatMap((work) =>
      work.documents.map(async (descriptor) => {
        const document = await fetchJson<DraftworksDocument>(descriptor.href);
        if (
          document.schemaVersion !== 1 ||
          document.visibility !== "public" ||
          document.publication?.state !== "published" ||
          document.sourceRevision !== worksResponse.sourceRevision
        ) {
          throw new Error(
            `Draftworks document is not publicly valid: ${descriptor.id}`,
          );
        }
        return document;
      }),
    ),
  );

  const documentById = new Map(
    allDocuments.map((document) => [document.id, document]),
  );
  const chronicles: ChronicleEntry[] = [];
  const works: PublishedWork[] = [];

  for (const [workIndex, sourceWork] of worksResponse.works.entries()) {
    const workSlug = slugify(sourceWork.title);
    const sourceDocuments = sourceWork.documents
      .map((document) => documentById.get(document.id))
      .filter(
        (document): document is DraftworksDocument => Boolean(document),
      )
      .sort((left, right) => {
        const leftOrder =
          left.order.order ??
          left.order.chapter ??
          Number.MAX_SAFE_INTEGER;
        const rightOrder =
          right.order.order ??
          right.order.chapter ??
          Number.MAX_SAFE_INTEGER;
        return leftOrder - rightOrder || left.title.localeCompare(right.title);
      });

    const sectionMap = new Map<number, PublishedWorkSection>();
    const descriptors: PublishedWorkEntry[] = [];

    for (const [index, document] of sourceDocuments.entries()) {
      const slug = entrySlug(document);
      const part = document.order.part;
      let sectionId: string | undefined;

      if (Number.isInteger(part)) {
        sectionId = `${sourceWork.id}:part-${part}`;
        if (!sectionMap.has(part!)) {
          sectionMap.set(part!, {
            id: sectionId,
            slug: `part-${part}`,
            title: `Part ${part}`,
            navigationLabel: partLabel(part!),
            order: part!,
            path: `/read/${workSlug}/part-${part}`,
            entryIds: [],
          });
        }
        sectionMap.get(part!)!.entryIds.push(document.id);
      }

      descriptors.push({
        id: document.id,
        slug,
        kind: entryKind(document.kind),
        path: readerPath(workSlug, document),
        ...(sectionId ? { sectionId } : {}),
      });

      const paragraphs = manuscriptParagraphs(document.content.markdown);
      const wordCount = plainWords(paragraphs);
      chronicles.push({
        id: document.id,
        slug,
        collection: "chronicles",
        title: document.title,
        publicationState: "published",
        editorialStatus: document.publication.sourceStatus || "draft",
        provenance: {
          sourceRef: document.id,
          sourceRevision: document.sourceRevision,
        },
        sequence: {
          series: document.series || sourceWork.series,
          bookTitle: sourceWork.title,
          ...(Number.isInteger(document.order.book)
            ? { book: document.order.book }
            : {}),
          ...(Number.isInteger(document.order.part)
            ? { part: document.order.part }
            : {}),
          order:
            document.order.order ??
            document.order.chapter ??
            index + 1,
          ...(Number.isInteger(document.order.chapter)
            ? { chapter: document.order.chapter }
            : {}),
        },
        body: {
          format: "safe-inline-markdown",
          paragraphs,
        },
        presentation: {
          excerpt: paragraphs[0]?.slice(0, 320) || "",
          wordCount,
          estimatedReadingMinutes:
            wordCount > 0
              ? Math.max(1, Math.ceil(wordCount / 250))
              : 0,
        },
      });
    }

    works.push({
      id: sourceWork.id,
      slug: workSlug,
      title: sourceWork.title,
      kind: workKind(sourceDocuments),
      order: workIndex + 1,
      publicationState: "published",
      path: `/read/${workSlug}`,
      sections: [...sectionMap.values()].sort(
        (left, right) => left.order - right.order,
      ),
      entries: descriptors,
    });
  }

  const contentDigest = await digest({
    sourceRevision: worksResponse.sourceRevision,
    works,
    chronicles,
  });
  const collections = {
    chronicles: chronicles.length,
    people: 0,
    places: 0,
    events: 0,
    artifacts: 0,
    timeline: 0,
    media: 0,
  };

  return {
    schemaVersion: 2,
    manifest: {
      packageId:
        `rsc-${worksResponse.sourceRevision.slice(0, 12)}-` +
        contentDigest.slice(0, 12),
      sourceRevision: worksResponse.sourceRevision,
      contentDigest,
      approvalIds: [],
      workCount: works.length,
      world: {
        id: "rock-springs-chronicles",
        title:
          worksResponse.works[0]?.series ||
          "The Rock Springs Chronicles",
      },
      collections,
    },
    works,
    collections: {
      chronicles,
      people: [],
      places: [],
      events: [],
      artifacts: [],
      timeline: [],
      media: [],
    },
    relationships: [],
    withdrawn: [],
  };
}

export async function loadPublicationPackage(): Promise<PublicationPackage> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.value;
  if (pending) return pending;

  pending = buildPublicationPackage()
    .then((value) => {
      cached = {
        value,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
      return value;
    })
    .catch((error) => {
      if (cached) return cached.value;
      throw error;
    })
    .finally(() => {
      pending = undefined;
    });

  return pending;
}

export function resetDraftworksCacheForTest() {
  cached = undefined;
  pending = undefined;
}

export function setDraftworksFetchForTest(next?: FetchLike) {
  fetchImpl = next ?? fetch;
  resetDraftworksCacheForTest();
}

export async function publicationResponse() {
  const publication = await loadPublicationPackage();
  return Response.json(publication, {
    headers: {
      "cache-control": "public, max-age=300, stale-while-revalidate=3600",
      "x-rsc-package": publication.manifest.packageId,
    },
  });
}
