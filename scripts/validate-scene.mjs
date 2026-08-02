import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifestPath = resolve(
  process.argv[2] ?? "public/assets/scenes/jackies-window/scene-manifest.json",
);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const spatialPlanPath = resolve(
  manifest.provenance.spatialPlan.replace(/^\/+/, ""),
);
const spatialPlan = JSON.parse(readFileSync(spatialPlanPath, "utf8"));
const modelPath = resolve("public", manifest.model.url.replace(/^\/+/, ""));
const model = readFileSync(modelPath);

function fail(message) {
  throw new Error(`Scene validation failed: ${message}`);
}

function assertPartOneSourceReferences(sourceReferences, subject) {
  if (!Array.isArray(sourceReferences) || sourceReferences.length === 0) {
    fail(`${subject} lacks source evidence`);
  }
  for (const sourceReference of sourceReferences) {
    const match = /^Chapter ([1-8]):\d+(?:-\d+)?$/.exec(sourceReference);
    if (!match) {
      fail(`${subject} has an invalid Part One source reference: ${sourceReference}`);
    }
  }
}

if (spatialPlan.schemaVersion !== 2) fail("unsupported spatial-plan schema");
if (
  manifest.fallback?.kind !== "neutral" ||
  "url" in (manifest.fallback ?? {})
) {
  fail("public fallback must be neutral and must not reference invented artwork");
}
const feetPerUnit = spatialPlan.coordinates.horizontalFeetPerUnit;
const metersPerPlanUnit = spatialPlan.coordinates.horizontalMetersPerUnit;
if (
  !Number.isFinite(feetPerUnit) ||
  !Number.isFinite(metersPerPlanUnit) ||
  feetPerUnit <= 0 ||
  metersPerPlanUnit <= 0
) {
  fail("spatial plan must declare positive horizontal coordinate scales");
}

const planLandmarkByName = new Map(
  spatialPlan.landmarks.map((landmark) => [landmark.nodeName, landmark]),
);
const planLandmarkById = new Map(
  spatialPlan.landmarks.map((landmark) => [landmark.id, landmark]),
);
const planRoadById = new Map(spatialPlan.roads.map((road) => [road.id, road]));

if (planLandmarkById.size !== spatialPlan.landmarks.length) {
  fail("spatial plan contains duplicate landmark ids");
}
if (planRoadById.size !== spatialPlan.roads.length) {
  fail("spatial plan contains duplicate road ids");
}
for (const road of spatialPlan.roads) {
  assertPartOneSourceReferences(road.source, `scene road ${road.id}`);
}

for (const landmark of spatialPlan.landmarks) {
  if (
    !Array.isArray(landmark.position) ||
    landmark.position.length !== 3 ||
    !landmark.position.every(Number.isFinite)
  ) {
    fail(`landmark has an invalid position: ${landmark.id}`);
  }
  assertPartOneSourceReferences(landmark.source, `landmark ${landmark.id}`);
}

for (const roadId of spatialPlan.map2d.roads) {
  const road = planRoadById.get(roadId);
  if (!road) {
    fail(`2D map references an unknown road: ${roadId}`);
  }
  assertPartOneSourceReferences(road.source, `public map road ${roadId}`);
}
for (const marker of spatialPlan.map2d.landmarks) {
  const landmark = planLandmarkById.get(marker.id);
  if (!landmark) {
    fail(`2D map references an unknown landmark: ${marker.id}`);
  }
  assertPartOneSourceReferences(
    landmark.source,
    `public map landmark ${marker.id}`,
  );
}
const planRouteNames = new Set(spatialPlan.routes.map((route) => route.name));
for (const routeName of spatialPlan.map2d.routes) {
  const route = spatialPlan.routes.find((candidate) => candidate.name === routeName);
  if (!route || !planRouteNames.has(routeName)) {
    fail(`2D map references an unknown route: ${routeName}`);
  }
  assertPartOneSourceReferences(route.source, `public map route ${routeName}`);
}

function horizontalDistanceFeet(subject, object) {
  return (
    Math.hypot(
      object.position[0] - subject.position[0],
      object.position[2] - subject.position[2],
    ) * feetPerUnit
  );
}

function closestFootprintDistanceFeet(subject, object) {
  if (!subject.footprint || !object.footprint) {
    fail(`footprint distance requires footprints on ${subject.id} and ${object.id}`);
  }
  const subjectHalfWidth =
    (subject.footprint[0] / metersPerPlanUnit) / 2;
  const subjectHalfDepth =
    (subject.footprint[1] / metersPerPlanUnit) / 2;
  const objectHalfWidth = (object.footprint[0] / metersPerPlanUnit) / 2;
  const objectHalfDepth = (object.footprint[1] / metersPerPlanUnit) / 2;
  const dx = Math.max(
    Math.abs(object.position[0] - subject.position[0]) -
      subjectHalfWidth -
      objectHalfWidth,
    0,
  );
  const dz = Math.max(
    Math.abs(object.position[2] - subject.position[2]) -
      subjectHalfDepth -
      objectHalfDepth,
    0,
  );
  return Math.hypot(dx, dz) * feetPerUnit;
}

for (const relationship of spatialPlan.relationships ?? []) {
  if (!relationship.constraint) continue;
  const subject = planLandmarkByName.get(relationship.subject);
  const object = planLandmarkByName.get(relationship.object);
  if (!subject || !object) continue;

  const { constraint } = relationship;
  const distanceFeet =
    constraint.kind === "closest-footprint-distance"
      ? closestFootprintDistanceFeet(subject, object)
      : horizontalDistanceFeet(subject, object);

  if (
    Number.isFinite(constraint.feet) &&
    Math.abs(distanceFeet - constraint.feet) > constraint.toleranceFeet
  ) {
    fail(
      `${relationship.id} is ${distanceFeet.toFixed(1)} feet; expected ${constraint.feet} ± ${constraint.toleranceFeet}`,
    );
  }
  if (
    Number.isFinite(constraint.maxFeet) &&
    distanceFeet >= constraint.maxFeet
  ) {
    fail(
      `${relationship.id} is ${distanceFeet.toFixed(1)} feet; expected less than ${constraint.maxFeet}`,
    );
  }
  if (
    constraint.direction === "northwest" &&
    !(
      object.position[0] < subject.position[0] &&
      object.position[2] > subject.position[2]
    )
  ) {
    fail(`${relationship.id} does not place its object northwest of its subject`);
  }
}

const abby = planLandmarkById.get("abbys-apartment");
const newBeginnings = planLandmarkById.get("new-beginnings");
const oldSchool = planLandmarkById.get("old-school");
const stagingLot = planLandmarkById.get("old-school-staging-lot");
const river = planLandmarkById.get("river");
const mainStreet = planLandmarkById.get("main-street");
const jackiesHouse = planLandmarkById.get("jackies-house");
if (!(river.position[2] < abby.position[2])) {
  fail("river must remain south of Abby's apartment");
}
for (const [name, landmark] of [
  ["old school", oldSchool],
  ["staging lot", stagingLot],
]) {
  if (
    !(
      landmark.position[2] > abby.position[2] &&
      landmark.position[2] < newBeginnings.position[2]
    )
  ) {
    fail(`${name} must remain between Abby and New Beginnings`);
  }
}
if (
  !(
    mainStreet.position[2] < stagingLot.position[2] &&
    stagingLot.position[2] < jackiesHouse.position[2]
  )
) {
  fail("Main Street, staging lot, and Jackie's house have the wrong south-to-north order");
}

if (manifest.schemaVersion !== 1) fail("unsupported manifest schema");
if (manifest.provenance.classification !== "generated-presentation-media") {
  fail("scene must remain classified as generated presentation media");
}
if (
  manifest.provenance.auditedAgainstRevision !==
  spatialPlan.source.writingRevision
) {
  fail("manifest and spatial plan writing revisions differ");
}
if (manifest.canon.publicLandmarks === false && manifest.anchors.length > 0) {
  fail("public anchors cannot be configured while publicLandmarks is false");
}
if (manifest.model.bytes !== model.length) {
  fail(`manifest byte count is ${manifest.model.bytes}; model is ${model.length}`);
}

const actualHash = createHash("sha256").update(model).digest("hex");
if (actualHash !== manifest.model.sha256) {
  fail(`model hash mismatch; expected ${manifest.model.sha256}, received ${actualHash}`);
}
if (model.subarray(0, 4).toString("ascii") !== "glTF") fail("model is not a GLB file");
if (model.readUInt32LE(4) !== 2) fail("model is not glTF 2.0");
if (model.readUInt32LE(8) !== model.length) fail("declared GLB length does not match file size");

const jsonChunkLength = model.readUInt32LE(12);
const jsonChunkType = model.readUInt32LE(16);
if (jsonChunkType !== 0x4e4f534a) fail("first GLB chunk is not JSON");

const gltf = JSON.parse(
  model
    .subarray(20, 20 + jsonChunkLength)
    .toString("utf8")
    .replace(/\0+$/g, "")
    .trim(),
);
const externalUris = [
  ...(gltf.buffers ?? []).map((buffer) => buffer.uri),
  ...(gltf.images ?? []).map((image) => image.uri),
].filter(Boolean);
if (externalUris.length > 0) fail(`model contains external URIs: ${externalUris.join(", ")}`);

const nodes = gltf.nodes ?? [];
const nodeNames = new Set(nodes.map((node) => node.name).filter(Boolean));
const nodeNameCounts = new Map();
for (const node of nodes) {
  if (!node.name) continue;
  nodeNameCounts.set(node.name, (nodeNameCounts.get(node.name) ?? 0) + 1);
}

const duplicateStableNames = [
  ...spatialPlan.requiredGroups,
  ...manifest.requiredLandmarkNodes,
  ...spatialPlan.cameras.map((camera) => camera.name),
  ...spatialPlan.routes.map((route) => route.name),
].filter((name) => nodeNameCounts.get(name) !== 1);
if (duplicateStableNames.length > 0) {
  fail(`missing or duplicated stable nodes: ${duplicateStableNames.join(", ")}`);
}

function assertNodeTranslation(nodeName, expected) {
  const node = nodes.find((candidate) => candidate.name === nodeName);
  if (!node) fail(`coordinate reference node is missing: ${nodeName}`);
  const actual = node.translation ?? [0, 0, 0];
  const mismatch = actual.some(
    (value, index) => Math.abs(value - expected[index]) > 0.002,
  );
  if (mismatch) {
    fail(
      `${nodeName} is at ${JSON.stringify(actual)}; expected ${JSON.stringify(expected)}`,
    );
  }
}

for (const landmark of spatialPlan.landmarks) {
  assertNodeTranslation(
    `LANDMARK_REF_${landmark.id.replaceAll("-", "_")}`,
    [
      landmark.position[0] * metersPerPlanUnit,
      landmark.position[1],
      landmark.position[2] * metersPerPlanUnit,
    ],
  );
}

const planLandmarkNames = spatialPlan.landmarks.map((landmark) => landmark.nodeName);
if (
  JSON.stringify([...planLandmarkNames].sort()) !==
  JSON.stringify([...manifest.requiredLandmarkNodes].sort())
) {
  fail("manifest landmark contract differs from spatial plan");
}

const malformedCanonNodes = nodes.filter(
  (node) =>
    node.name?.startsWith("CANON_") &&
    !node.extras?.classification?.startsWith("canon-"),
);
if (malformedCanonNodes.length > 0) {
  fail(
    `CANON nodes lack canon classification: ${malformedCanonNodes
      .map((node) => node.name)
      .join(", ")}`,
  );
}

const malformedInferredNodes = nodes.filter(
  (node) =>
    node.name?.startsWith("INFERRED_") &&
    !node.extras?.classification?.startsWith("inferred-"),
);
if (malformedInferredNodes.length > 0) {
  fail(
    `INFERRED nodes lack inferred classification: ${malformedInferredNodes
      .map((node) => node.name)
      .join(", ")}`,
  );
}

const anchorNames = manifest.anchors.map((anchor) => anchor.nodeName);
const duplicateAnchors = anchorNames.filter((name, index) => anchorNames.indexOf(name) !== index);
if (duplicateAnchors.length > 0) fail(`duplicate anchors: ${duplicateAnchors.join(", ")}`);

const missingAnchors = anchorNames.filter((nodeName) => !nodeNames.has(nodeName));
if (missingAnchors.length > 0) fail(`anchor nodes not found: ${missingAnchors.join(", ")}`);

let triangles = 0;
let primitives = 0;
const meshTriangles = [];
for (const mesh of gltf.meshes ?? []) {
  let meshTriangleCount = 0;
  for (const primitive of mesh.primitives ?? []) {
    primitives += 1;
    if (primitive.indices !== undefined) {
      const primitiveTriangles = Math.floor(
        gltf.accessors[primitive.indices].count / 3,
      );
      triangles += primitiveTriangles;
      meshTriangleCount += primitiveTriangles;
    }
  }
  meshTriangles.push(meshTriangleCount);
}

let renderedTriangles = triangles;
let instancedNodes = 0;
for (const node of nodes) {
  const instancing = node.extensions?.EXT_mesh_gpu_instancing;
  if (!instancing || node.mesh === undefined) continue;
  const accessorIndex = Object.values(instancing.attributes)[0];
  const instanceCount = gltf.accessors[accessorIndex].count;
  renderedTriangles += meshTriangles[node.mesh] * Math.max(instanceCount - 1, 0);
  instancedNodes += 1;
}

const cameraNodes = nodes.filter((node) => node.camera !== undefined);
const cameraNodeNames = new Set(cameraNodes.map((node) => node.name));
const missingViewCameras = manifest.authoredViews
  .map((view) => view.cameraNode)
  .filter((name) => !cameraNodeNames.has(name));
if (missingViewCameras.length > 0) {
  fail(`authored view cameras are missing: ${missingViewCameras.join(", ")}`);
}
for (const camera of spatialPlan.cameras) {
  if (!cameraNodeNames.has(camera.name)) {
    fail(`spatial-plan camera is missing: ${camera.name}`);
  }
  assertPartOneSourceReferences(camera.source, `authored camera ${camera.name}`);
}
for (const view of manifest.authoredViews) {
  const camera = spatialPlan.cameras.find(
    (candidate) => candidate.name === view.cameraNode,
  );
  if (!camera) {
    fail(`public authored view has no spatial-plan camera: ${view.cameraNode}`);
  }
  assertPartOneSourceReferences(
    view.sourceReferences,
    `public authored view ${view.cameraNode}`,
  );
  if (
    JSON.stringify(view.sourceReferences) !== JSON.stringify(camera.source)
  ) {
    fail(`public authored view evidence differs from camera ${view.cameraNode}`);
  }
}
if (!cameraNodeNames.has(manifest.descent.startCameraNode)) {
  fail("descent start camera is missing");
}
if (!cameraNodeNames.has(manifest.descent.endCameraNode)) {
  fail("descent end camera is missing");
}

for (const route of spatialPlan.routes) {
  if (!nodeNames.has(route.name)) fail(`authored route is missing: ${route.name}`);
  assertPartOneSourceReferences(route.source, `authored route ${route.name}`);
  const missingWaypoints = route.points
    .map(
      (_, index) =>
        `${route.name}_Waypoint_${String(index + 1).padStart(2, "0")}`,
    )
    .filter((name) => !nodeNames.has(name));
  if (missingWaypoints.length > 0) {
    fail(`route waypoints are missing: ${missingWaypoints.join(", ")}`);
  }
}

const relationshipIds = new Set();
for (const relationship of spatialPlan.relationships ?? []) {
  if (!relationship.id || relationshipIds.has(relationship.id)) {
    fail(`missing or duplicated relationship id: ${relationship.id ?? "(missing)"}`);
  }
  relationshipIds.add(relationship.id);
  if (!nodeNames.has(relationship.subject)) {
    fail(`relationship subject is missing: ${relationship.subject}`);
  }
  if (!nodeNames.has(relationship.object)) {
    fail(`relationship object is missing: ${relationship.object}`);
  }
  if (!Array.isArray(relationship.source) || relationship.source.length === 0) {
    fail(`relationship lacks source evidence: ${relationship.id}`);
  }
}

for (const extension of manifest.model.extensions) {
  if (!(gltf.extensionsUsed ?? []).includes(extension)) {
    fail(`required glTF extension is missing: ${extension}`);
  }
}

const actualStats = {
  nodes: nodes.length,
  meshes: gltf.meshes?.length ?? 0,
  primitives,
  baseTriangles: triangles,
  materials: gltf.materials?.length ?? 0,
  cameras: gltf.cameras?.length ?? 0,
};
for (const [stat, expected] of Object.entries(manifest.model.stats)) {
  if (actualStats[stat] !== expected) {
    fail(`manifest ${stat} is ${expected}; model is ${actualStats[stat]}`);
  }
}

if (model.length > 1_000_000) fail("model exceeds the 1 MB blockout budget");
if (nodes.length > 900) fail("model exceeds the 900-node blockout budget");
if (primitives > 100) fail("model exceeds the 100-primitive blockout budget");
if (renderedTriangles > 100_000) {
  fail("model exceeds the 100,000 rendered-triangle blockout budget");
}

console.log(
  [
    `Validated ${manifest.id}.`,
    `${model.length} bytes`,
    `${nodes.length} nodes`,
    `${gltf.meshes?.length ?? 0} meshes`,
    `${primitives} primitives`,
    `${triangles} base triangles`,
    `${renderedTriangles} rendered triangles`,
    `${instancedNodes} instanced nodes`,
    `${cameraNodes.length} cameras`,
    `${spatialPlan.routes.length} routes`,
    `${manifest.anchors.length} public anchors`,
  ].join(" · "),
);
