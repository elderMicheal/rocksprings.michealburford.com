export const collectionNames = [
  "chronicles",
  "people",
  "places",
  "events",
  "artifacts",
  "timeline",
  "media",
] as const;

export type CollectionName = (typeof collectionNames)[number];
export type PublicationState =
  | "private"
  | "draft"
  | "review"
  | "publishable"
  | "published"
  | "withdrawn";

export interface Provenance {
  sourceRef: string;
  sourceRevision: string;
  approvalId: string;
}

export interface ChronicleEntry {
  id: string;
  slug: string;
  collection: "chronicles";
  title: string;
  publicationState: "published";
  editorialStatus: string;
  provenance: Provenance;
  sequence: {
    series: string;
    bookTitle: string;
    book: number;
    part: number;
    order: number;
    chapter: number;
  };
  body: {
    format: "safe-inline-markdown";
    paragraphs: string[];
  };
  presentation: {
    excerpt: string;
    wordCount: number;
    estimatedReadingMinutes: number;
  };
}

export interface EmptyCollectionEntry {
  id: string;
  slug: string;
  collection: Exclude<CollectionName, "chronicles">;
  title: string;
  publicationState: "published";
  provenance: Provenance;
}

export interface ContentRelationship {
  id: string;
  type:
    | "chronicle-person"
    | "chronicle-place"
    | "chronicle-event"
    | "event-timeline"
    | "artifact-chronicle"
    | "artifact-event"
    | "media-entry";
  from: string;
  to: string;
  basis: "authored";
}

export interface PublicationManifest {
  packageId: string;
  sourceRevision: string;
  contentDigest: string;
  approvalId: string;
  world: {
    id: "rock-springs-chronicles";
    title: string;
  };
  collections: Record<CollectionName, number>;
}

export interface WithdrawnRecord {
  collection: CollectionName;
  slug: string;
}

export interface PublicationPackage {
  schemaVersion: 1;
  manifest: PublicationManifest;
  collections: {
    chronicles: ChronicleEntry[];
    people: EmptyCollectionEntry[];
    places: EmptyCollectionEntry[];
    events: EmptyCollectionEntry[];
    artifacts: EmptyCollectionEntry[];
    timeline: EmptyCollectionEntry[];
    media: EmptyCollectionEntry[];
  };
  relationships: ContentRelationship[];
  withdrawn: WithdrawnRecord[];
}
