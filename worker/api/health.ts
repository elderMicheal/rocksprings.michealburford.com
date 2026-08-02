import publicationPackage from "../../src/content/generated/publication-package.json";

export function healthResponse() {
  return Response.json({
    ok: true,
    app: "rocksprings.michealburford.com",
    version: "0.1.0",
    service: "worker-api",
    contentService: "ready",
    contentPackage: publicationPackage.manifest.packageId,
  });
}
