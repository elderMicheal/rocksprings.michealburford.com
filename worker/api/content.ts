import publicationPackageJson from "../../src/content/generated/publication-package.json";
import { collectionNames, type CollectionName, type PublicationPackage } from "../../src/content/types";
import { publicChronicle } from "../../src/content/schema";

const publicationPackage = publicationPackageJson as PublicationPackage;
const cacheHeaders = {
  "cache-control": "public, max-age=300, stale-while-revalidate=3600",
  "x-rsc-package": publicationPackage.manifest.packageId,
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
  return packageData.collections[collection].map(({ provenance: _provenance, ...entry }) => entry);
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

  const entry = publicEntries(packageData, collection).find(
    (candidate) => candidate.slug === slug,
  );
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

  const entry = packageData.collections[collection].find(
    (candidate) => candidate.slug === slug,
  );
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

export function collectionResponse(collection: string) {
  return collectionResponseFor(publicationPackage, collection);
}

export function contentResponse(collection: string, slug: string) {
  return contentResponseFor(publicationPackage, collection, slug);
}

export function relationshipsResponse(collection: string, slug: string) {
  return relationshipsResponseFor(publicationPackage, collection, slug);
}
