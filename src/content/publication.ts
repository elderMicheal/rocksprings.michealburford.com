import { requireWritingSnapshot } from "../adapters/writing-source";
import type {
  ChronicleEntry,
  PublishedWork,
  PublishedWorkSection,
} from "./types";

export const publicationPackage = requireWritingSnapshot();
export const publishedChronicles = publicationPackage.collections.chronicles;
export const publishedWorks = [...publicationPackage.works].sort(
  (left, right) => left.order - right.order,
);

const entryById = new Map(
  publishedChronicles.map((entry) => [entry.id, entry]),
);
const workById = new Map(publishedWorks.map((work) => [work.id, work]));

export const firstReadableChronicle = publishedChronicles.find(
  (chronicle) => chronicle.body.paragraphs.length > 0,
);
export const firstPublishedWork = publishedWorks[0];

export function entriesForWork(work: PublishedWork): ChronicleEntry[] {
  return work.entries
    .map((descriptor) => entryById.get(descriptor.id))
    .filter((entry): entry is ChronicleEntry => Boolean(entry));
}

export function entriesForSection(
  work: PublishedWork,
  section: PublishedWorkSection,
): ChronicleEntry[] {
  const ids = new Set(section.entryIds);
  return entriesForWork(work).filter((entry) => ids.has(entry.id));
}

export function workForEntry(entryId: string): PublishedWork | undefined {
  return publishedWorks.find((work) =>
    work.entries.some((entry) => entry.id === entryId),
  );
}

export function sectionForEntry(
  work: PublishedWork,
  entryId: string,
): PublishedWorkSection | undefined {
  const descriptor = work.entries.find((entry) => entry.id === entryId);
  return descriptor?.sectionId
    ? work.sections.find((section) => section.id === descriptor.sectionId)
    : undefined;
}

export function readerPathForEntry(entryId: string): string | undefined {
  for (const work of publishedWorks) {
    const descriptor = work.entries.find((entry) => entry.id === entryId);
    if (descriptor) return descriptor.path;
  }
  return undefined;
}

export function defaultReaderPath(): string {
  if (!firstPublishedWork) return "/";
  return firstPublishedWork.sections[0]?.path ?? firstPublishedWork.path;
}

export type ReaderTarget =
  | { kind: "work"; work: PublishedWork }
  | { kind: "section"; work: PublishedWork; section: PublishedWorkSection }
  | { kind: "entry"; work: PublishedWork; entry: ChronicleEntry };

function normalizedPath(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

export function resolveReaderPath(pathname: string): ReaderTarget | undefined {
  let path = normalizedPath(pathname);
  if (path === "/stories" || path === "/latest") {
    path = defaultReaderPath();
  }

  for (const work of publishedWorks) {
    if (work.path === path) {
      return { kind: "work", work };
    }

    const section = work.sections.find((candidate) => candidate.path === path);
    if (section) {
      return { kind: "section", work, section };
    }

    const descriptor = work.entries.find((candidate) => candidate.path === path);
    if (descriptor) {
      const entry = entryById.get(descriptor.id);
      if (entry) {
        return { kind: "entry", work, entry };
      }
    }
  }

  return undefined;
}

export function workByIdOrUndefined(workId: string): PublishedWork | undefined {
  return workById.get(workId);
}
