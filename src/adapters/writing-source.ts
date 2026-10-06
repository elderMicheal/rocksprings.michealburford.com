import { validatePublicationPackage } from "../content/schema";
import type { PublicationPackage } from "../content/types";

const CACHE_KEY = "rsc:last-valid-publication";
let writingSnapshot: PublicationPackage | undefined;

function accept(value: unknown) {
  validatePublicationPackage(value);
  writingSnapshot = value;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // Browser storage is only a resilience cache.
  }
  return value;
}

export async function initializeWritingSnapshot() {
  try {
    const response = await fetch("/api/publication", {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Publication request failed: ${response.status}`);
    }
    return accept(await response.json());
  } catch (error) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return accept(JSON.parse(cached));
    } catch {
      // Fall through to the original network/validation error.
    }
    throw error;
  }
}

export function requireWritingSnapshot(): PublicationPackage {
  if (!writingSnapshot) {
    throw new Error("Rock Springs writing data was accessed before initialization.");
  }
  return writingSnapshot;
}
