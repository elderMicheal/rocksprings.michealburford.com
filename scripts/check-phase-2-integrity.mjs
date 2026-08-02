import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const readJson = (relativePath) =>
  JSON.parse(readFileSync(path.join(projectRoot, relativePath), "utf8"));

const publicationPackage = readJson(
  "src/content/generated/publication-package.json",
);
const sourceInventory = readJson("generated/source-inventory.json");
const spatialPlan = readJson("scene-data/jackies-window-spatial-plan.json");
const sceneManifest = readJson(
  "public/assets/scenes/jackies-window/scene-manifest.json",
);
const approvalPolicy = readJson("content-policy/approved-sources.json");

function fail(message) {
  throw new Error(`Public source-evidence check failed: ${message}`);
}

function assertPartOneSourceReferences(sourceReferences, subject) {
  if (!Array.isArray(sourceReferences) || sourceReferences.length === 0) {
    fail(`${subject} has no source references`);
  }
  for (const sourceReference of sourceReferences) {
    if (!/^Chapter [1-8]:\d+(?:-\d+)?$/.test(sourceReference)) {
      fail(`${subject} has an invalid source reference: ${sourceReference}`);
    }
  }
}

const revisions = new Map([
  ["publication package", publicationPackage.manifest.sourceRevision],
  ["source inventory", sourceInventory.source.revision],
  ["spatial plan", spatialPlan.source.writingRevision],
  ["scene manifest", sceneManifest.provenance.auditedAgainstRevision],
]);
const uniqueRevisions = new Set(revisions.values());
if (uniqueRevisions.size !== 1) {
  throw new Error(
    `Phase 2 source revisions disagree:\n${[...revisions]
      .map(([name, revision]) => `- ${name}: ${revision}`)
      .join("\n")}`,
  );
}

const approval = approvalPolicy.approvals.find(
  (candidate) => candidate.id === publicationPackage.manifest.approvalId,
);
if (!approval) {
  throw new Error("Publication package approval is not present in the policy");
}

const approvedSourceRefs = new Set(
  approval.sourcePaths.map((sourcePath) => `Rock Springs Chronicles/${sourcePath}`),
);
const publishedSourceRefs = publicationPackage.collections.chronicles.map(
  (entry) => entry.provenance.sourceRef,
);
if (
  publishedSourceRefs.length !== approvedSourceRefs.size ||
  !publishedSourceRefs.every((sourceRef) => approvedSourceRefs.has(sourceRef))
) {
  throw new Error("Published source references differ from the exact approval allowlist");
}

const publiclyEligibleInventoryPaths = sourceInventory.files
  .filter((file) => file.publication?.publicEligible)
  .map((file) => `Rock Springs Chronicles/${file.path}`);
if (
  publiclyEligibleInventoryPaths.length !== approvedSourceRefs.size ||
  !publiclyEligibleInventoryPaths.every((sourceRef) =>
    approvedSourceRefs.has(sourceRef),
  )
) {
  throw new Error("Source inventory eligibility differs from the approval allowlist");
}

for (const [collectionName, entries] of Object.entries(
  publicationPackage.collections,
)) {
  if (collectionName !== "chronicles" && entries.length !== 0) {
    fail(`unapproved ${collectionName} entries are present`);
  }
}

if (spatialPlan.map2d.regions.length !== 0) {
  fail("public map contains unsourced district or region geometry");
}

const landmarkById = new Map(
  spatialPlan.landmarks.map((landmark) => [landmark.id, landmark]),
);
const roadById = new Map(spatialPlan.roads.map((road) => [road.id, road]));
const routeByName = new Map(
  spatialPlan.routes.map((route) => [route.name, route]),
);
const cameraByName = new Map(
  spatialPlan.cameras.map((camera) => [camera.name, camera]),
);

for (const road of spatialPlan.roads) {
  assertPartOneSourceReferences(road.source, `scene road ${road.id}`);
}

const expectedMapLabels = new Map([
  ["st-thomas", "St. Thomas Cathedral"],
  ["new-beginnings", "New Beginnings"],
  ["old-school-staging-lot", "Old school lot"],
  ["abbys-apartment", "Abby's apartment"],
  ["bakery-storefront", "Bakery storefront"],
  ["police-station", "Police station"],
  ["sheriffs-sons-house", "Sheriff's son's house"],
  ["detective-position", "Detective position"],
  ["city-park", "City park"],
  ["chalmers-property", "Chalmers property"],
  ["old-ruins", "Old ruins"],
]);

if (spatialPlan.map2d.landmarks.length !== expectedMapLabels.size) {
  fail("public map landmark set differs from the reviewed Part One evidence set");
}
for (const marker of spatialPlan.map2d.landmarks) {
  const landmark = landmarkById.get(marker.id);
  if (!landmark) fail(`public map references unknown landmark ${marker.id}`);
  assertPartOneSourceReferences(
    landmark.source,
    `public map landmark ${marker.id}`,
  );
  if (expectedMapLabels.get(marker.id) !== marker.label) {
    fail(`public map label is not source-safe: ${marker.id} = ${marker.label}`);
  }
}

for (const roadId of spatialPlan.map2d.roads) {
  const road = roadById.get(roadId);
  if (!road) fail(`public map references unknown road ${roadId}`);
  assertPartOneSourceReferences(road.source, `public map road ${roadId}`);
}
for (const routeName of spatialPlan.map2d.routes) {
  const route = routeByName.get(routeName);
  if (!route) fail(`public map references unknown route ${routeName}`);
  assertPartOneSourceReferences(route.source, `public map route ${routeName}`);
}

if (
  sceneManifest.fallback?.kind !== "neutral" ||
  "url" in (sceneManifest.fallback ?? {})
) {
  fail("scene fallback references presentation artwork instead of a neutral surface");
}
for (const view of sceneManifest.authoredViews) {
  const camera = cameraByName.get(view.cameraNode);
  if (!camera) fail(`public scene view has no spatial-plan camera: ${view.cameraNode}`);
  assertPartOneSourceReferences(
    view.sourceReferences,
    `public scene view ${view.cameraNode}`,
  );
  if (
    view.label !== camera.label ||
    JSON.stringify(view.sourceReferences) !== JSON.stringify(camera.source)
  ) {
    fail(`public scene view differs from source-traced camera ${view.cameraNode}`);
  }
}

const unsupportedFallbackPath = path.join(
  projectRoot,
  "public/assets/exhibit/rock-springs-river-night.png",
);
if (existsSync(unsupportedFallbackPath)) {
  fail("unsupported generated river-town fallback image is still public");
}

const publicSurfaceSources = [
  "src/App.tsx",
  "src/components/chronicle/ChronicleShell.tsx",
  "src/components/chronicle/EditionHeader.tsx",
  "src/components/chronicle/EditorialModules.tsx",
  "src/components/chronicle/StatusStrip.tsx",
  "src/components/chronicle/ChronicleFooter.tsx",
].map((relativePath) => [
  relativePath,
  readFileSync(path.join(projectRoot, relativePath), "utf8"),
]);
const unsupportedPublicConcepts = [
  "Artifacts & Case Files",
  "From the Files",
  "People in the Record",
  "Place Records",
  "Public place records",
  "Timeline entries",
  '"/people"',
  '"/places"',
  '"/timeline"',
  '"/archive"',
];
for (const [relativePath, source] of publicSurfaceSources) {
  for (const concept of unsupportedPublicConcepts) {
    if (source.includes(concept)) {
      fail(`${relativePath} still exposes unsupported public concept ${concept}`);
    }
  }
}

const sceneGeneratorSource = readFileSync(
  path.join(projectRoot, "scripts/generate-town-scene.mjs"),
  "utf8",
);
const unsupportedSceneStructures = [
  "PRESENTATION_Bridge_",
  "PRESENTATION_City_Park_Bandstand",
  "PRESENTATION_Chalmers_Barn",
  "PRESENTATION_Chalmers_Utility_Shed",
  "PRESENTATION_Bakery_Loading_Dock",
];
for (const structure of unsupportedSceneStructures) {
  if (sceneGeneratorSource.includes(structure)) {
    fail(`scene generator still contains unsupported structure ${structure}`);
  }
}

console.log(
  `Public source evidence verified at ${[...uniqueRevisions][0]} with ${publishedSourceRefs.length} approved chapters, ${spatialPlan.map2d.landmarks.length} traced map landmarks, and ${sceneManifest.authoredViews.length} traced scene views.`,
);
