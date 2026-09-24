export interface RockSpringsAnalysisDocument {
  id: string;
  workId: string;
  workTitle: string;
  series: string;
  kind: string;
  title: string;
  order: {
    book?: number;
    part?: number;
    chapter?: number;
    order?: number;
  };
  sourceRevision: string;
  markdown: string;
}

export interface RockSpringsAnalysisWork {
  id: string;
  title: string;
  series: string;
  documentIds: string[];
}

export interface RockSpringsWritingSource {
  schemaVersion: 1;
  sourceRevision: string;
  works: RockSpringsAnalysisWork[];
  documents: RockSpringsAnalysisDocument[];
}

export interface DraftworksSourceOptions {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
}

export function loadRockSpringsWriting(
  options?: DraftworksSourceOptions,
): Promise<RockSpringsWritingSource>;
