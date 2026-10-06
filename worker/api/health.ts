import { loadPublicationPackage } from "./draftworks";

export async function healthResponse() {
  try {
    const publication = await loadPublicationPackage();
    return Response.json({
      ok: true,
      app: "rocksprings.michealburford.com",
      version: "0.1.0",
      service: "worker-api",
      contentService: "ready",
      contentPackage: publication.manifest.packageId,
      sourceRevision: publication.manifest.sourceRevision,
    });
  } catch {
    return Response.json({
      ok: true,
      app: "rocksprings.michealburford.com",
      version: "0.1.0",
      service: "worker-api",
      contentService: "degraded",
      contentPackage: null,
      sourceRevision: null,
    });
  }
}
