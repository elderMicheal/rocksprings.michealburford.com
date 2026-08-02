export type ScenePhase = "idle" | "loading" | "ready" | "error";
export type AutoMotionState = "pending" | "playing" | "completed" | "skipped";

export interface AuthoredSceneView {
  cameraNode: string;
  label: string;
  sourceReferences: string[];
}

export interface SceneManifest {
  schemaVersion: 1;
  id: string;
  title: string;
  model: {
    url: string;
    sha256: string;
    bytes: number;
    format: "glTF 2.0 binary";
    stats: {
      nodes: number;
      meshes: number;
      primitives: number;
      baseTriangles: number;
      materials: number;
      cameras: number;
    };
    extensions: string[];
  };
  fallback: {
    kind: "neutral";
    alt: string;
  };
  provenance: {
    classification: "generated-presentation-media";
    sourceReferences: string[];
    auditedAgainstRevision: string;
    spatialPlan: string;
    evidenceDocument: string;
    generator: string;
  };
  canon: {
    geometry: "interpretive";
    distances: "approximate";
    architecture: "interpretive";
    publicLandmarks: boolean;
    nodeNaming: string;
    notice: string;
  };
  requiredLandmarkNodes: string[];
  authoredViews: AuthoredSceneView[];
  descent: {
    startCameraNode: string;
    endCameraNode: string;
  };
  authoredRoutes: string[];
  anchors: Array<{
    nodeName: string;
    entryId: string;
    sourceReferences: string[];
    spatialConfidence: "stated" | "relative" | "interpretive";
  }>;
}

export interface TownSceneStatus {
  phase: ScenePhase;
  message: string;
}

export interface TownSceneRuntime {
  replay(): void;
  reset(): void;
  setView(cameraNode: string): void;
  dispose(): void;
}
