import { loadPublicationPackage } from "./draftworks";
import {
  collectionNames,
  type CollectionName,
  type PublicationPackage,
} from "../../src/content/types";
import { publicChronicle } from "../../src/content/schema";

const cacheHeaders = {
  "cache-control": "public, max-age=300, stale-while-revalidate=3600",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: cacheHeaders });
}

function isCollectionName(value: string): value is CollectionName {
  return collectionNames.includes(value as CollectionName);
}

function publicEntries(
  packageData: PublicationPackage,
  collection: CollectionName,
) {
  if (collection === "chronicles") {
    return packageData.collections.chronicles.map(publicChronicle);
  }
  return packageData.collections[collection].map(
    ({ provenance: _provenance, ...entry }) => entry,
  );
}

function publicWork(packageData: PublicationPackage, workSlug: string) {
  const work = packageData.works.find((candidate) => candidate.slug === workSlug);
  if (!work) return undefined;

  const entryIds = new Set(work.entries.map((entry) => entry.id));
  return {
    ...work,
    entries: work.entries.map((descriptor) => ({
      ...descriptor,
      entry: packageData.collections.chronicles
        .filter((entry) => entryIds.has(entry.id))
        .find((entry) => entry.id === descriptor.id)
        ? publicChronicle(
            packageData.collections.chronicles.find(
              (entry) => entry.id === descriptor.id,
            )!,
          )
        : undefined,
    })),
  };
}

export function worksResponseFor(packageData: PublicationPackage) {
  return json({
    ok: true,
    state: packageData.works.length > 0 ? "ready" : "empty",
    count: packageData.works.length,
    works: packageData.works,
  });
}

export function workResponseFor(
  packageData: PublicationPackage,
  workSlug: string,
) {
  const work = publicWork(packageData, workSlug);
  if (!work) {
    return json(
      { ok: false, state: "unavailable", error: "work_not_found", workSlug },
      404,
    );
  }

  return json({ ok: true, state: "ready", work });
}

export function workEntryResponseFor(
  packageData: PublicationPackage,
  workSlug: string,
  entrySlug: string,
) {
  const work = packageData.works.find((candidate) => candidate.slug === workSlug);
  if (!work) {
    return json(
      { ok: false, state: "unavailable", error: "work_not_found", workSlug },
      404,
    );
  }

  const descriptor = work.entries.find((entry) => entry.slug === entrySlug);
  if (!descriptor) {
    return json(
      {
        ok: false,
        state: "unavailable",
        error: "content_not_found",
        workSlug,
        slug: entrySlug,
      },
      404,
    );
  }

  const entry = packageData.collections.chronicles.find(
    (candidate) => candidate.id === descriptor.id,
  );
  if (!entry) {
    return json(
      {
        ok: false,
        state: "unavailable",
        error: "content_not_found",
        workSlug,
        slug: entrySlug,
      },
      404,
    );
  }

  return json({ ok: true, state: "ready", entry: publicChronicle(entry) });
}

export function collectionResponseFor(
  packageData: PublicationPackage,
  collection: string,
) {
  if (!isCollectionName(collection)) {
    return json(
      { ok: false, state: "unavailable", error: "collection_not_found" },
      404,
    );
  }

  const entries = publicEntries(packageData, collection);
  return json({
    ok: true,
    state: entries.length > 0 ? "ready" : "empty",
    collection,
    count: entries.length,
    entries,
  });
}

export function contentResponseFor(
  packageData: PublicationPackage,
  collection: string,
  slug: string,
) {
  if (!isCollectionName(collection)) {
    return json(
      { ok: false, state: "unavailable", error: "collection_not_found" },
      404,
    );
  }

  const withdrawn = packageData.withdrawn.find(
    (candidate) =>
      candidate.collection === collection && candidate.slug === slug,
  );
  if (withdrawn) {
    return json(
      {
        ok: false,
        state: "withdrawn",
        error: "content_withdrawn",
        collection,
        slug,
      },
      410,
    );
  }

  const matches = publicEntries(packageData, collection).filter(
    (candidate) => candidate.slug === slug,
  );
  if (matches.length > 1) {
    return json(
      {
        ok: false,
        state: "ambiguous",
        error: "content_slug_requires_work",
        collection,
        slug,
      },
      409,
    );
  }

  const entry = matches[0];
  if (!entry) {
    return json(
      {
        ok: false,
        state: "unavailable",
        error: "content_not_found",
        collection,
        slug,
      },
      404,
    );
  }

  return json({ ok: true, state: "ready", entry });
}

export function relationshipsResponseFor(
  packageData: PublicationPackage,
  collection: string,
  slug: string,
) {
  if (!isCollectionName(collection)) {
    return json(
      { ok: false, state: "unavailable", error: "collection_not_found" },
      404,
    );
  }

  const matchingEntries = packageData.collections[collection].filter(
    (candidate) => candidate.slug === slug,
  );
  if (matchingEntries.length > 1) {
    return json(
      {
        ok: false,
        state: "ambiguous",
        error: "content_slug_requires_work",
        collection,
        slug,
      },
      409,
    );
  }

  const entry = matchingEntries[0];
  if (!entry) {
    return json(
      { ok: false, state: "unavailable", error: "content_not_found" },
      404,
    );
  }

  const relationships = packageData.relationships.filter(
    (relationship) =>
      relationship.from === entry.id || relationship.to === entry.id,
  );
  return json({
    ok: true,
    state: relationships.length > 0 ? "ready" : "empty",
    collection,
    slug,
    relationships,
  });
}

export async function worksResponse() {
  return worksResponseFor(await loadPublicationPackage());
}

export async function workResponse(workSlug: string) {
  return workResponseFor(await loadPublicationPackage(), workSlug);
}

export async function workEntryResponse(workSlug: string, entrySlug: string) {
  return workEntryResponseFor(await loadPublicationPackage(), workSlug, entrySlug);
}

export async function collectionResponse(collection: string) {
  return collectionResponseFor(await loadPublicationPackage(), collection);
}

export async function contentResponse(collection: string, slug: string) {
  return contentResponseFor(await loadPublicationPackage(), collection, slug);
}

export async function relationshipsResponse(collection: string, slug: string) {
  return relationshipsResponseFor(await loadPublicationPackage(), collection, slug);
}
