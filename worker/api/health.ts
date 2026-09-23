import { writingSnapshot } from "../../src/adapters/writing-source";

export function healthResponse() {
  return Response.json({
    ok: true,
    app: "rocksprings.michealburford.com",
    version: "0.1.0",
    service: "worker-api",
    contentService: "ready",
    contentPackage: writingSnapshot.manifest.packageId,
  });
}
