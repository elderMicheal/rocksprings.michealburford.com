import { healthResponse } from "./api/health";
import { manifestResponse } from "./api/manifest";
import { publicationResponse } from "./api/draftworks";
import {
  collectionResponse,
  contentResponse,
  relationshipsResponse,
  workEntryResponse,
  workResponse,
  worksResponse,
} from "./api/content";

function notFound() {
  return Response.json(
    {
      ok: false,
      error: "not_found",
    },
    { status: 404 },
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return await healthResponse();
    }

    if (url.pathname === "/api/manifest") {
      return await manifestResponse();
    }

    if (url.pathname === "/api/publication") {
      return await publicationResponse();
    }

    const segments = url.pathname.split("/").filter(Boolean);

    if (segments[0] === "api" && segments[1] === "works" && segments.length === 2) {
      return await worksResponse();
    }

    if (segments[0] === "api" && segments[1] === "works" && segments.length === 3) {
      return await workResponse(decodeURIComponent(segments[2]));
    }

    if (segments[0] === "api" && segments[1] === "works" && segments.length === 4) {
      return await workEntryResponse(
        decodeURIComponent(segments[2]),
        decodeURIComponent(segments[3]),
      );
    }

    if (
      segments[0] === "api" &&
      segments[1] === "collections" &&
      segments.length === 3
    ) {
      return await collectionResponse(decodeURIComponent(segments[2]));
    }

    if (
      segments[0] === "api" &&
      segments[1] === "content" &&
      segments.length === 4
    ) {
      return await contentResponse(
        decodeURIComponent(segments[2]),
        decodeURIComponent(segments[3]),
      );
    }

    if (
      segments[0] === "api" &&
      segments[1] === "relationships" &&
      segments.length === 4
    ) {
      return await relationshipsResponse(
        decodeURIComponent(segments[2]),
        decodeURIComponent(segments[3]),
      );
    }

    if (url.pathname.startsWith("/api/")) {
      return notFound();
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
