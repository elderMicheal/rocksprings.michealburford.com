import spatialPlanJson from "../../scene-data/jackies-window-spatial-plan.json";

export type Point3 = [number, number, number];

export interface RockSpringsMapPlan {
  source: {
    writingRevision: string;
  };
  landmarks: Array<{
    id: string;
    position: Point3;
  }>;
  roads: Array<{
    id: string;
    landmarkId?: string;
    position?: Point3;
    axis: "x" | "z";
    length: number;
    width: number;
  }>;
  routes: Array<{
    name: string;
    points: Point3[];
  }>;
  map2d: {
    title: string;
    description: string;
    extent: {
      minX: number;
      maxX: number;
      minZ: number;
      maxZ: number;
    };
    roads: string[];
    routes: string[];
    regions: Array<{
      id: string;
      label: string;
      center: [number, number];
      size: [number, number];
      classification: "relative" | "inferred";
    }>;
    landmarks: Array<{
      id: string;
      label: string;
      confidence: "relative" | "inferred";
      labelOffset: [number, number];
    }>;
  };
}

/**
 * Website-facing boundary for Rock Springs Toolchain outputs.
 *
 * Presentation components consume this module instead of knowing where
 * Reconstruction stores plans or scene manifests. The implementation may move
 * later without forcing presentation code to follow the storage layout.
 */
export const rockSpringsMapPlan =
  spatialPlanJson as unknown as RockSpringsMapPlan;

export const rockSpringsSceneManifestUrl =
  "/assets/scenes/jackies-window/scene-manifest.json";
