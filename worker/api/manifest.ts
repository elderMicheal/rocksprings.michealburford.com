import publicationPackage from "../../src/content/generated/publication-package.json";

export function manifestResponse() {
  return Response.json(
    {
      ok: true,
      state: "ready",
      schemaVersion: publicationPackage.schemaVersion,
      packageId: publicationPackage.manifest.packageId,
      sourceRevision: publicationPackage.manifest.sourceRevision,
      contentDigest: publicationPackage.manifest.contentDigest,
      world: publicationPackage.manifest.world,
      collections: publicationPackage.manifest.collections,
      relationshipCount: publicationPackage.relationships.length,
      withdrawnCount: publicationPackage.withdrawn.length,
    },
    {
      headers: {
        "cache-control": "public, max-age=300, stale-while-revalidate=3600",
        "x-rsc-package": publicationPackage.manifest.packageId,
      },
    },
  );
}
