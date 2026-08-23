import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const readJson = (relativePath) =>
  JSON.parse(readFileSync(path.join(projectRoot, relativePath), "utf8"));

const publicationPackage = readJson("src/content/generated/publication-package.json");
const sourceInventory = readJson("generated/source-inventory.json");
const spatialPlan = readJson("scene-data/jackies-window-spatial-plan.json");
const sceneManifest = readJson("public/assets/scenes/jackies-window/scene-manifest.json");
const sceneSourceManifest = readJson("public/assets/scenes/jackies-window/source-manifest.json");
const approvalPolicy = readJson("content-policy/approved-sources.json");

function fail(message) { throw new Error(`Public source-evidence check failed: ${message}`); }
function assertPartOneSourceReferences(sourceReferences, subject) {
  if (!Array.isArray(sourceReferences) || sourceReferences.length === 0) fail(`${subject} has no source references`);
  for (const sourceReference of sourceReferences) {
    if (!/^Chapter [1-8]:\d+(?:-\d+)?$/.test(sourceReference)) fail(`${subject} has an invalid source reference: ${sourceReference}`);
  }
}

// Publication content and spatial evidence are independently audited products.
// A map refresh may advance without falsely relabeling the repository-wide inventory.
// Each product must remain internally revision-consistent and both must obey the same
// explicit approval allowlist.
const publicationRevisions = new Map([
  ["publication package", publicationPackage.manifest.sourceRevision],
  ["source inventory", sourceInventory.source.revision],
]);
if (new Set(publicationRevisions.values()).size !== 1) {
  throw new Error(`Published-content source revisions disagree:\n${[...publicationRevisions].map(([name, revision]) => `- ${name}: ${revision}`).join("\n")}`);
}
const sceneRevisions = new Map([
  ["spatial plan", spatialPlan.source.writingRevision],
  ["scene manifest", sceneManifest.provenance.auditedAgainstRevision],
  ["scene source manifest", sceneSourceManifest.sourceRevision],
]);
if (new Set(sceneRevisions.values()).size !== 1) {
  throw new Error(`Scene source revisions disagree:\n${[...sceneRevisions].map(([name, revision]) => `- ${name}: ${revision}`).join("\n")}`);
}

const approval = approvalPolicy.approvals.find((candidate) => candidate.id === publicationPackage.manifest.approvalId);
if (!approval) throw new Error("Publication package approval is not present in the policy");
if (spatialPlan.source.approvalId !== approval.id) fail("spatial plan does not name the active Part One approval boundary");
if (sceneSourceManifest.publicationBoundary?.approvalId !== approval.id) fail("scene source manifest does not name the active Part One approval boundary");

const approvedSourceRefs = new Set(approval.sourcePaths.map((sourcePath) => `Rock Springs Chronicles/${sourcePath}`));
const publishedSourceRefs = publicationPackage.collections.chronicles.map((entry) => entry.provenance.sourceRef);
if (publishedSourceRefs.length !== approvedSourceRefs.size || !publishedSourceRefs.every((sourceRef) => approvedSourceRefs.has(sourceRef))) {
  throw new Error("Published source references differ from the exact approval allowlist");
}
const publiclyEligibleInventoryPaths = sourceInventory.files.filter((file) => file.publication?.publicEligible).map((file) => `Rock Springs Chronicles/${file.path}`);
if (publiclyEligibleInventoryPaths.length !== approvedSourceRefs.size || !publiclyEligibleInventoryPaths.every((sourceRef) => approvedSourceRefs.has(sourceRef))) {
  throw new Error("Source inventory eligibility differs from the approval allowlist");
}
const sceneSourceRefs = sceneSourceManifest.sourceFiles ?? [];
if (sceneSourceRefs.length !== approvedSourceRefs.size || !sceneSourceRefs.every((sourceRef) => approvedSourceRefs.has(sourceRef))) fail("scene source files differ from the exact approval allowlist");

const expectedApprovedChapters = [1,2,3,4,5,6,7,8];
if (JSON.stringify(sceneSourceManifest.publicationBoundary?.approvedChapters) !== JSON.stringify(expectedApprovedChapters) || JSON.stringify(spatialPlan.source.chapters) !== JSON.stringify(expectedApprovedChapters)) fail("scene chapter boundary is not exactly approved Chapters 1–8");
for (const excluded of sceneSourceManifest.publicationBoundary?.excludedCurrentDrafts ?? []) if (expectedApprovedChapters.includes(excluded)) fail(`scene source manifest excludes an approved chapter: ${excluded}`);
const expectedSceneShaKeys = expectedApprovedChapters.map((chapter) => `Chapter ${String(chapter).padStart(2, "0")}.md`);
const sceneShaEntries = Object.entries(sceneSourceManifest.sourceShas ?? {});
if (sceneShaEntries.length !== expectedSceneShaKeys.length || !expectedSceneShaKeys.every((key) => sceneSourceManifest.sourceShas?.[key]) || !sceneShaEntries.every(([, sha]) => /^[0-9a-f]{40}$/.test(sha))) fail("scene source manifest does not pin every approved chapter blob");

for (const [collectionName, entries] of Object.entries(publicationPackage.collections)) if (collectionName !== "chronicles" && entries.length !== 0) fail(`unapproved ${collectionName} entries are present`);
if (spatialPlan.map2d.regions.length !== 0) fail("public map contains unsourced district or region geometry");

const landmarkById = new Map(spatialPlan.landmarks.map((landmark) => [landmark.id, landmark]));
const roadById = new Map(spatialPlan.roads.map((road) => [road.id, road]));
const routeByName = new Map(spatialPlan.routes.map((route) => [route.name, route]));
const cameraByName = new Map(spatialPlan.cameras.map((camera) => [camera.name, camera]));
for (const road of spatialPlan.roads) assertPartOneSourceReferences(road.source, `scene road ${road.id}`);
for (const landmark of spatialPlan.landmarks) assertPartOneSourceReferences(landmark.source, `scene landmark ${landmark.id}`);
for (const route of spatialPlan.routes) assertPartOneSourceReferences(route.source, `scene route ${route.name}`);
for (const camera of spatialPlan.cameras) assertPartOneSourceReferences(camera.source, `scene camera ${camera.name}`);
for (const relationship of spatialPlan.relationships ?? []) assertPartOneSourceReferences(relationship.source, `scene relationship ${relationship.id}`);

const expectedMapLabels = new Map([
  ["st-thomas","St. Thomas Cathedral"],["new-beginnings","New Beginnings"],["old-school-staging-lot","Old school lot"],["abbys-apartment","Abby's apartment"],["bakery-storefront","Bakery storefront"],["police-station","Police station"],["sheriffs-sons-house","Sheriff's son's house"],["detective-position","Detective position"],["city-park","City park"],["chalmers-property","Chalmers property"],["old-ruins","Old ruins"],
]);
if (spatialPlan.map2d.landmarks.length !== expectedMapLabels.size) fail("public map landmark set differs from the reviewed Part One evidence set");
for (const marker of spatialPlan.map2d.landmarks) {
  const landmark = landmarkById.get(marker.id); if (!landmark) fail(`public map references unknown landmark ${marker.id}`);
  assertPartOneSourceReferences(landmark.source, `public map landmark ${marker.id}`);
  if (expectedMapLabels.get(marker.id) !== marker.label) fail(`public map label is not source-safe: ${marker.id} = ${marker.label}`);
}
for (const roadId of spatialPlan.map2d.roads) { const road = roadById.get(roadId); if (!road) fail(`public map references unknown road ${roadId}`); assertPartOneSourceReferences(road.source, `public map road ${roadId}`); }
for (const routeName of spatialPlan.map2d.routes) { const route = routeByName.get(routeName); if (!route) fail(`public map references unknown route ${routeName}`); assertPartOneSourceReferences(route.source, `public map route ${routeName}`); }

if (sceneManifest.fallback?.kind !== "neutral" || "url" in (sceneManifest.fallback ?? {})) fail("scene fallback references presentation artwork instead of a neutral surface");
for (const view of sceneManifest.authoredViews) {
  const camera = cameraByName.get(view.cameraNode); if (!camera) fail(`public scene view has no spatial-plan camera: ${view.cameraNode}`);
  assertPartOneSourceReferences(view.sourceReferences, `public scene view ${view.cameraNode}`);
  if (view.label !== camera.label || JSON.stringify(view.sourceReferences) !== JSON.stringify(camera.source)) fail(`public scene view differs from source-traced camera ${view.cameraNode}`);
}

const unsupportedFallbackPath = path.join(projectRoot, "public/assets/exhibit/rock-springs-river-night.png");
if (existsSync(unsupportedFallbackPath)) fail("unsupported generated river-town fallback image is still public");
const publicSurfaceSources = [
  "src/App.tsx","src/components/chronicle/ChronicleShell.tsx","src/components/chronicle/EditionHeader.tsx","src/components/chronicle/EditorialModules.tsx","src/components/chronicle/StatusStrip.tsx","src/components/chronicle/ChronicleFooter.tsx","src/components/chronicle/TownMapPanel.tsx","src/components/scene/TownScenePage.tsx","src/components/scene/RockSpringsScene.tsx",
].map((relativePath) => [relativePath, readFileSync(path.join(projectRoot, relativePath), "utf8")]);
const unsupportedPublicConcepts = ["Artifacts & Case Files","From the Files","People in the Record","Place Records","Public place records","Timeline entries",'"/people"','"/places"','"/timeline"','"/archive"'];
for (const [relativePath, source] of publicSurfaceSources) for (const concept of unsupportedPublicConcepts) if (source.includes(concept)) fail(`${relativePath} still exposes unsupported public concept ${concept}`);
const sceneGeneratorSource = readFileSync(path.join(projectRoot, "scripts/generate-town-scene.mjs"), "utf8");
const unsupportedSceneStructures = ["PRESENTATION_Bridge_","PRESENTATION_City_Park_Bandstand","PRESENTATION_Chalmers_Barn","PRESENTATION_Chalmers_Utility_Shed","PRESENTATION_Bakery_Loading_Dock"];
for (const structure of unsupportedSceneStructures) if (sceneGeneratorSource.includes(structure)) fail(`scene generator still contains unsupported structure ${structure}`);

console.log(`Public source evidence verified: published package ${publicationPackage.manifest.sourceRevision}; scene ${spatialPlan.source.writingRevision}; ${publishedSourceRefs.length} approved chapters; ${spatialPlan.map2d.landmarks.length} traced public map landmarks; ${sceneManifest.authoredViews.length} traced 3D scene views.`);
