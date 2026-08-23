import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const readJson = (relativePath) =>
  JSON.parse(readFileSync(path.join(projectRoot, relativePath), "utf8"));

const publicationPackage = readJson("src/content/generated/publication-package.json");
const sourceInventory = readJson("generated/source-inventory.json");
const approvalPolicy = readJson("content-policy/approved-sources.json");
const spatialPlan = readJson("scene-data/jackies-window-spatial-plan.json");
const evidenceCatalog = readJson(spatialPlan.source.mapEvidence);
const sceneManifest = readJson("public/assets/scenes/jackies-window/scene-manifest.json");
const sceneSourceManifest = readJson(
  "public/assets/scenes/jackies-window/source-manifest.json",
);

function fail(message) {
  throw new Error(`Public source-evidence check failed: ${message}`);
}

function assertSameValues(actual, expected, subject) {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  if (JSON.stringify(actualSorted) !== JSON.stringify(expectedSorted)) {
    fail(`${subject} differs from its approved allowlist`);
  }
}

const publicationRevision = publicationPackage.manifest.sourceRevision;
if (sourceInventory.source.revision !== publicationRevision) {
  fail("publication package and committed source inventory revisions disagree");
}

const mapRevision = spatialPlan.source.writingRevision;
for (const [subject, revision] of [
  ["map evidence", evidenceCatalog.source.revision],
  ["scene manifest", sceneManifest.provenance.auditedAgainstRevision],
  ["scene source manifest", sceneSourceManifest.sourceRevision],
]) {
  if (revision !== mapRevision) fail(`${subject} revision differs from the spatial plan`);
}

const approval = approvalPolicy.approvals.find(
  (candidate) => candidate.id === publicationPackage.manifest.approvalId,
);
if (!approval) fail("publication package approval is not present in policy");
if (spatialPlan.source.readerApprovalId !== approval.id) {
  fail("spatial plan does not preserve the reader publication boundary");
}

const approvedReaderPaths = approval.sourcePaths.map(
  (sourcePath) => `Rock Springs Chronicles/${sourcePath}`,
);
const publishedPaths = publicationPackage.collections.chronicles.map(
  (entry) => entry.provenance.sourceRef,
);
assertSameValues(publishedPaths, approvedReaderPaths, "published reader content");

const publiclyEligibleInventoryPaths = sourceInventory.files
  .filter((file) => file.publication?.publicEligible)
  .map((file) => `Rock Springs Chronicles/${file.path}`);
assertSameValues(
  publiclyEligibleInventoryPaths,
  approvedReaderPaths,
  "source-inventory reader eligibility",
);

for (const [collectionName, entries] of Object.entries(publicationPackage.collections)) {
  if (collectionName !== "chronicles" && entries.length !== 0) {
    fail(`unapproved ${collectionName} entries are present`);
  }
}

const publishedEvidenceSources = evidenceCatalog.sources
  .filter((source) => source.publicationState === "published")
  .map((source) => source.path);
assertSameValues(
  publishedEvidenceSources,
  approvedReaderPaths,
  "published map-evidence sources",
);

for (const source of evidenceCatalog.sources) {
  if (!/^[0-9a-f]{40}$/.test(source.gitBlob)) {
    fail(`map-evidence source is not pinned to a Git blob: ${source.id}`);
  }
  if (
    source.publicationState === "unpublished" &&
    (source.canonicalStatus !== "canonical" || !source.usage?.includes("no prose"))
  ) {
    fail(`unpublished map source is missing the canonical/no-prose boundary: ${source.id}`);
  }
}

const evidenceSourceIds = new Set(evidenceCatalog.sources.map((source) => source.id));
const evidenceFactIds = new Set();
for (const fact of evidenceCatalog.facts) {
  if (!fact.id || evidenceFactIds.has(fact.id)) {
    fail(`missing or duplicate evidence fact id: ${fact.id ?? "(missing)"}`);
  }
  if (!evidenceSourceIds.has(fact.sourceId)) {
    fail(`evidence fact ${fact.id} references an unknown source`);
  }
  evidenceFactIds.add(fact.id);
}

function assertMapSourceReferences(sourceReferences, subject) {
  if (!Array.isArray(sourceReferences) || sourceReferences.length === 0) {
    fail(`${subject} has no source references`);
  }
  for (const reference of sourceReferences) {
    if (/^Chapter [1-8]:\d+(?:-\d+)?$/.test(reference)) continue;
    const evidence = /^Evidence:([a-z0-9-]+)$/.exec(reference);
    if (!evidence || !evidenceFactIds.has(evidence[1])) {
      fail(`${subject} has an invalid source reference: ${reference}`);
    }
  }
}

const landmarkById = new Map(
  spatialPlan.landmarks.map((landmark) => [landmark.id, landmark]),
);
const roadById = new Map(spatialPlan.roads.map((road) => [road.id, road]));
const routeByName = new Map(spatialPlan.routes.map((route) => [route.name, route]));
const cameraByName = new Map(spatialPlan.cameras.map((camera) => [camera.name, camera]));

for (const [collection, name] of [
  [spatialPlan.roads, "road"],
  [spatialPlan.landmarks, "landmark"],
  [spatialPlan.routes, "route"],
  [spatialPlan.cameras, "camera"],
  [spatialPlan.relationships ?? [], "relationship"],
]) {
  for (const record of collection) {
    assertMapSourceReferences(record.source, `${name} ${record.id ?? record.name}`);
  }
}

if (roadById.get("main-street")?.axis !== "z") {
  fail("Main Street / Highway 13 is not modeled north-south");
}
if (roadById.get("broad-street")?.axis !== "x") {
  fail("Broad Street is not modeled across Main Street");
}
if (spatialPlan.map2d.regions.length !== 0) {
  fail("public map contains unsourced district or region geometry");
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
  ["railroad-trestle", "Railroad trestle"],
  ["trainyard", "Trainyard"],
  ["southside-industry", "Mills and docks"],
  ["diner-strip-mall", "Diner and shops"],
  ["stanford-north-tower", "Stanford towers"],
]);
if (spatialPlan.map2d.landmarks.length !== expectedMapLabels.size) {
  fail("public map landmark set differs from the reviewed evidence set");
}
for (const marker of spatialPlan.map2d.landmarks) {
  const landmark = landmarkById.get(marker.id);
  if (!landmark) fail(`public map references unknown landmark ${marker.id}`);
  if (expectedMapLabels.get(marker.id) !== marker.label) {
    fail(`public map label is not source-safe: ${marker.id} = ${marker.label}`);
  }
}
for (const roadId of spatialPlan.map2d.roads) {
  if (!roadById.has(roadId)) fail(`public map references unknown road ${roadId}`);
}
for (const routeName of spatialPlan.map2d.routes) {
  if (!routeByName.has(routeName)) fail(`public map references unknown route ${routeName}`);
}

if (sceneManifest.fallback?.kind !== "neutral" || "url" in (sceneManifest.fallback ?? {})) {
  fail("scene fallback references presentation artwork instead of a neutral surface");
}
for (const view of sceneManifest.authoredViews) {
  const camera = cameraByName.get(view.cameraNode);
  if (!camera) fail(`public scene view has no spatial-plan camera: ${view.cameraNode}`);
  if (
    view.label !== camera.label ||
    JSON.stringify(view.sourceReferences) !== JSON.stringify(camera.source)
  ) {
    fail(`public scene view differs from source-traced camera ${view.cameraNode}`);
  }
}

assertSameValues(
  sceneSourceManifest.publishedReaderSources,
  approvedReaderPaths,
  "scene source manifest published boundary",
);
assertSameValues(
  sceneSourceManifest.mapEvidenceSources,
  evidenceCatalog.sources.map((source) => source.path),
  "scene source manifest evidence boundary",
);

const unsupportedFallbackPath = path.join(
  projectRoot,
  "public/assets/exhibit/rock-springs-river-night.png",
);
if (existsSync(unsupportedFallbackPath)) {
  fail("unsupported generated river-town fallback image is still public");
}

const appSource = readFileSync(path.join(projectRoot, "src/App.tsx"), "utf8");
const mapPanelSource = readFileSync(
  path.join(projectRoot, "src/components/chronicle/TownMapPanel.tsx"),
  "utf8",
);
if (!appSource.includes('pathname === "/map"') || !mapPanelSource.includes('href="/map"')) {
  fail("the shared 3D map is not intentionally reachable from the public 2D map");
}

const sceneGeneratorSource = readFileSync(
  path.join(projectRoot, "scripts/generate-town-scene.mjs"),
  "utf8",
);
for (const structure of [
  "PRESENTATION_City_Park_Bandstand",
  "PRESENTATION_Chalmers_Barn",
  "PRESENTATION_Chalmers_Utility_Shed",
  "PRESENTATION_Bakery_Loading_Dock",
]) {
  if (sceneGeneratorSource.includes(structure)) {
    fail(`scene generator still contains unsupported structure ${structure}`);
  }
}

console.log(
  `Reader content verified at ${publicationRevision}; map evidence verified independently at ${mapRevision} with ${publishedPaths.length} published chapters, ${evidenceCatalog.sources.filter((source) => source.publicationState === "unpublished").length} canonical unpublished evidence source, ${spatialPlan.map2d.landmarks.length} map landmarks, and ${sceneManifest.authoredViews.length} scene views.`,
);
