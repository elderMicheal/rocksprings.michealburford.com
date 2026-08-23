import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const planPath = resolve(process.argv[2] ?? "scene-data/jackies-window-spatial-plan.json");
const outputPath = resolve(process.argv[3] ?? "public/assets/scenes/jackies-window/rock-springs-jackies-window.glb");
const manifestPath = resolve(process.argv[4] ?? "public/assets/scenes/jackies-window/scene-manifest.json");
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const horizontalScale = plan.coordinates.horizontalMetersPerUnit;
const toWorld = ([x, y, z]) => [x * horizontalScale, y, z * horizontalScale];
const toWorldScale = ([x, y, z]) => [x * horizontalScale, y, z * horizontalScale];

const materialsDef = {
  ground: [0.12, 0.15, 0.13, 1],
  asphalt: [0.09, 0.10, 0.10, 1],
  concrete: [0.38, 0.39, 0.37, 1],
  stone: [0.42, 0.41, 0.37, 1],
  brick: [0.28, 0.16, 0.13, 1],
  school: [0.35, 0.16, 0.12, 1],
  red: [0.39, 0.10, 0.08, 1],
  siding: [0.54, 0.52, 0.43, 1],
  campus: [0.43, 0.34, 0.27, 1],
  tan: [0.48, 0.41, 0.30, 1],
  cool: [0.20, 0.42, 0.50, 1],
  warm: [0.88, 0.57, 0.24, 1],
  farm: [0.70, 0.68, 0.58, 1],
  grass: [0.18, 0.28, 0.17, 1],
  water: [0.06, 0.20, 0.25, 0.92],
  earth: [0.30, 0.29, 0.22, 1],
  industrial: [0.18, 0.19, 0.18, 1],
  commercial: [0.32, 0.30, 0.27, 1],
  brutalist: [0.36, 0.37, 0.36, 1],
  sign: [0.32, 0.38, 0.42, 1],
  route: [0.70, 0.54, 0.28, 1],
};

const gltf = {
  asset: { version: "2.0", generator: "RSC deterministic spatial-evidence generator" },
  scene: 0,
  scenes: [{ name: "Rock_Springs_Spatial_Evidence", nodes: [] }],
  nodes: [], meshes: [], materials: [], accessors: [], bufferViews: [],
  buffers: [{ byteLength: 0 }], cameras: [],
};

const binaryChunks = [];
let binaryLength = 0;
function align4() {
  const pad = (4 - (binaryLength % 4)) % 4;
  if (pad) { binaryChunks.push(Buffer.alloc(pad)); binaryLength += pad; }
}
function addBuffer(buffer, target) {
  align4();
  const byteOffset = binaryLength;
  binaryChunks.push(buffer); binaryLength += buffer.length;
  const index = gltf.bufferViews.length;
  gltf.bufferViews.push({ buffer: 0, byteOffset, byteLength: buffer.length, ...(target ? { target } : {}) });
  return index;
}
function addAccessor(bufferView, componentType, count, type, extras = {}) {
  const index = gltf.accessors.length;
  gltf.accessors.push({ bufferView, componentType, count, type, ...extras });
  return index;
}

const cubePositions = new Float32Array([
  -0.5,-0.5,0.5, 0.5,-0.5,0.5, 0.5,0.5,0.5, -0.5,0.5,0.5,
  0.5,-0.5,-0.5, -0.5,-0.5,-0.5, -0.5,0.5,-0.5, 0.5,0.5,-0.5,
  -0.5,-0.5,-0.5, -0.5,-0.5,0.5, -0.5,0.5,0.5, -0.5,0.5,-0.5,
  0.5,-0.5,0.5, 0.5,-0.5,-0.5, 0.5,0.5,-0.5, 0.5,0.5,0.5,
  -0.5,0.5,0.5, 0.5,0.5,0.5, 0.5,0.5,-0.5, -0.5,0.5,-0.5,
  -0.5,-0.5,-0.5, 0.5,-0.5,-0.5, 0.5,-0.5,0.5, -0.5,-0.5,0.5,
]);
const cubeNormals = new Float32Array([
  0,0,1,0,0,1,0,0,1,0,0,1, 0,0,-1,0,0,-1,0,0,-1,0,0,-1,
  -1,0,0,-1,0,0,-1,0,0,-1,0,0, 1,0,0,1,0,0,1,0,0,1,0,0,
  0,1,0,0,1,0,0,1,0,0,1,0, 0,-1,0,0,-1,0,0,-1,0,0,-1,0,
]);
const cubeIndices = new Uint16Array([
  0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,
  12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23,
]);
const posView = addBuffer(Buffer.from(cubePositions.buffer), 34962);
const normView = addBuffer(Buffer.from(cubeNormals.buffer), 34962);
const idxView = addBuffer(Buffer.from(cubeIndices.buffer), 34963);
const posAccessor = addAccessor(posView, 5126, 24, "VEC3", { min: [-0.5,-0.5,-0.5], max: [0.5,0.5,0.5] });
const normAccessor = addAccessor(normView, 5126, 24, "VEC3");
const idxAccessor = addAccessor(idxView, 5123, 36, "SCALAR");

const materialIndex = new Map();
const meshIndex = new Map();
for (const [name, baseColorFactor] of Object.entries(materialsDef)) {
  const m = gltf.materials.length;
  gltf.materials.push({ name: `MAT_${name}`, pbrMetallicRoughness: { baseColorFactor, metallicFactor: name === "industrial" ? 0.2 : 0.02, roughnessFactor: 0.88 }, ...(baseColorFactor[3] < 1 ? { alphaMode: "BLEND", doubleSided: true } : {}) });
  materialIndex.set(name, m);
  if (name !== "route") {
    const mesh = gltf.meshes.length;
    gltf.meshes.push({ name: `MESH_Box_${name}`, primitives: [{ attributes: { POSITION: posAccessor, NORMAL: normAccessor }, indices: idxAccessor, material: m }] });
    meshIndex.set(name, mesh);
  }
}
function addNode(node) { const i = gltf.nodes.length; gltf.nodes.push(node); return i; }
const groupIndex = new Map();
for (const name of plan.requiredGroups) {
  const i = addNode({ name, children: [] }); groupIndex.set(name, i); gltf.scenes[0].nodes.push(i);
}
function child(parent, index) { gltf.nodes[parent].children ??= []; gltf.nodes[parent].children.push(index); }
function addBox(parent, name, material, translation, scale, extras = {}) {
  const mesh = meshIndex.get(material) ?? meshIndex.get("stone");
  const i = addNode({ name, mesh, translation, scale, ...(Object.keys(extras).length ? { extras } : {}) }); child(parent, i); return i;
}
function groupForLandmark(id) {
  if (["new-beginnings","jackies-house","jackies-window","old-school","old-school-staging-lot","founder-statue"].includes(id)) return "New_Beginnings";
  if (["abbys-apartment","bakery-storefront"].includes(id)) return "Abby_District";
  if (["police-station","sheriffs-sons-house","detective-position"].includes(id)) return "Police_District";
  if (id === "chalmers-property") return "Chalmers_Farm";
  if (id === "old-ruins") return "Ruins";
  if (["trainyard","trainyard-sound-barrier"].includes(id)) return "Residential";
  if (["ledford-home","southside-mills-docks","stanford-south-tower"].includes(id)) return "Southside_Industrial";
  if (["diner-strip-mall","north-bridge-crossing","stanford-north-tower","highway-approach-marker"].includes(id)) return "Eastside_Commercial";
  if (id === "river") return "River";
  return "Downtown";
}
const namedNode = new Map();
const landmarkById = new Map(plan.landmarks.map((x) => [x.id, x]));
function addVisual(parent, landmark) {
  const visual = landmark.visual ?? { kind: "none" };
  if (visual.kind === "none") return;
  if (visual.kind === "campus") {
    for (const [index, house] of visual.houses.entries()) {
      const [dx,,dz] = house.offset;
      addBox(parent, `PRESENTATION_New_Beginnings_House_${String(index+1).padStart(2,"0")}`, house.campus ? "campus" : "siding", [dx*horizontalScale,3.2,dz*horizontalScale], toWorldScale([5.3,6.4,6.5]));
    }
    return;
  }
  if (visual.kind === "diner-strip") {
    addBox(parent, "PRESENTATION_Diner", "commercial", [0,3.2,0], toWorldScale([9,6,8]));
    addBox(parent, "PRESENTATION_Strip_Mall_Long_Leg", "commercial", [-10*horizontalScale,2.5,6*horizontalScale], toWorldScale([18,5,5]));
    addBox(parent, "PRESENTATION_Strip_Mall_Short_Leg", "commercial", [-17*horizontalScale,2.5,-2*horizontalScale], toWorldScale([5,5,12]));
    return;
  }
  if (visual.kind === "industrial") {
    addBox(parent, `PRESENTATION_${landmark.id}_Main`, visual.material, [0,4.5,0], toWorldScale(visual.size));
    addBox(parent, `PRESENTATION_${landmark.id}_Stack`, "industrial", [6*horizontalScale,12,-4*horizontalScale], toWorldScale([2.2,24,2.2])); return;
  }
  if (visual.kind === "ruins") {
    addBox(parent, "PRESENTATION_Ruins_Block_A", "stone", [-2*horizontalScale,1.5,0], toWorldScale([3,3,5]));
    addBox(parent, "PRESENTATION_Ruins_Block_B", "stone", [2*horizontalScale,1,1*horizontalScale], toWorldScale([2,2,4])); return;
  }
  if (visual.kind === "river") {
    const centerX = (plan.bounds.minX + plan.bounds.maxX) / 2;
    addBox(parent, "PRESENTATION_River_Surface", "water", [(centerX-landmark.position[0])*horizontalScale,0,0], toWorldScale([plan.bounds.maxX-plan.bounds.minX,0.4,15])); return;
  }
  const size = visual.size ?? [3,3,3];
  addBox(parent, `PRESENTATION_${landmark.id}_Volume`, visual.material ?? "stone", [0,size[1]/2,0], toWorldScale(size));
}
for (const landmark of plan.landmarks) {
  const semantic = addNode({ name: landmark.nodeName, translation: toWorld(landmark.position), children: [], extras: { classification: landmark.classification } });
  child(groupIndex.get(groupForLandmark(landmark.id)), semantic); namedNode.set(landmark.nodeName, semantic); addVisual(semantic, landmark);
  child(groupIndex.get("Landmarks"), addNode({ name: `LANDMARK_REF_${landmark.id.replaceAll("-","_")}`, translation: toWorld(landmark.position) }));
}
function roadPosition(road) { return road.landmarkId ? landmarkById.get(road.landmarkId).position : road.position; }
for (const road of plan.roads) {
  const pos = roadPosition(road); let semantic = namedNode.get(road.nodeName);
  if (semantic === undefined) {
    semantic = addNode({ name: road.nodeName, translation: toWorld(pos), children: [], extras: { classification: road.classification } });
    child(groupIndex.get(road.id === "jefferson-street" ? "Southside_Industrial" : "Residential"), semantic); namedNode.set(road.nodeName, semantic);
  }
  const scale = road.axis === "x" ? [road.length*horizontalScale,0.22,road.width*horizontalScale] : [road.width*horizontalScale,0.22,road.length*horizontalScale];
  addBox(semantic, `PRESENTATION_Road_${road.id}`, "asphalt", [0,0.05,0], scale);
}
const groundCenter = [(plan.bounds.minX+plan.bounds.maxX)/2,-4,(plan.bounds.minZ+plan.bounds.maxZ)/2];
addBox(groupIndex.get("Town_Ground"), "PRESENTATION_Town_Ground", "ground", toWorld(groundCenter), toWorldScale([plan.bounds.maxX-plan.bounds.minX,0.6,plan.bounds.maxZ-plan.bounds.minZ]));
for (const route of plan.routes) {
  const routeParent = addNode({ name: route.name, children: [] }); child(groupIndex.get("Authored_Paths"), routeParent);
  const worldPoints = route.points.map(toWorld); const flat = new Float32Array(worldPoints.flat()); const view = addBuffer(Buffer.from(flat.buffer), 34962);
  const mins = [0,1,2].map((axis) => Math.min(...worldPoints.map((p) => p[axis]))); const maxs = [0,1,2].map((axis) => Math.max(...worldPoints.map((p) => p[axis])));
  const accessor = addAccessor(view,5126,worldPoints.length,"VEC3",{min:mins,max:maxs}); const mesh = gltf.meshes.length;
  gltf.meshes.push({ name: `MESH_${route.name}`, primitives: [{ attributes: { POSITION: accessor }, material: materialIndex.get("route"), mode: 3 }] });
  child(routeParent, addNode({ name: `PRESENTATION_${route.name}_Line`, mesh }));
  worldPoints.forEach((point,index) => child(routeParent, addNode({ name: `${route.name}_Waypoint_${String(index+1).padStart(2,"0")}`, translation: point })));
}
for (const camera of plan.cameras) {
  const cameraIndex = gltf.cameras.length;
  gltf.cameras.push({ name: camera.name, type: "perspective", perspective: { yfov: Math.PI/4, znear: 0.1, zfar: 12000 } });
  child(groupIndex.get("Authored_Cameras"), addNode({ name: camera.name, camera: cameraIndex, translation: toWorld(camera.position), extras: { target: toWorld(camera.target) } }));
}
align4();
const binary = Buffer.concat(binaryChunks); gltf.buffers[0].byteLength = binary.length;
function jsonChunkBuffer(value) { const raw = Buffer.from(JSON.stringify(value)); const pad = (4 - (raw.length % 4)) % 4; return pad ? Buffer.concat([raw, Buffer.alloc(pad,0x20)]) : raw; }
const jsonChunk = jsonChunkBuffer(gltf); const binPad = (4-(binary.length%4))%4; const binChunk = binPad ? Buffer.concat([binary,Buffer.alloc(binPad)]) : binary;
const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length; const header = Buffer.alloc(12);
header.write("glTF",0,"ascii"); header.writeUInt32LE(2,4); header.writeUInt32LE(totalLength,8);
const jsonHeader=Buffer.alloc(8); jsonHeader.writeUInt32LE(jsonChunk.length,0); jsonHeader.writeUInt32LE(0x4e4f534a,4);
const binHeader=Buffer.alloc(8); binHeader.writeUInt32LE(binChunk.length,0); binHeader.writeUInt32LE(0x004e4942,4);
const glb=Buffer.concat([header,jsonHeader,jsonChunk,binHeader,binChunk]); mkdirSync(dirname(outputPath),{recursive:true}); writeFileSync(outputPath,glb);
let triangles=0, primitives=0;
for (const mesh of gltf.meshes) for (const primitive of mesh.primitives ?? []) { primitives++; if (primitive.indices !== undefined) triangles += Math.floor(gltf.accessors[primitive.indices].count/3); }
const stats={nodes:gltf.nodes.length,meshes:gltf.meshes.length,primitives,baseTriangles:triangles,materials:gltf.materials.length,cameras:gltf.cameras.length};
const manifest={schemaVersion:1,id:plan.id,title:"Rock Springs: Jackie's Window",model:{url:"/assets/scenes/jackies-window/rock-springs-jackies-window.glb",sha256:createHash("sha256").update(glb).digest("hex"),bytes:glb.length,format:"glTF 2.0 binary",stats,extensions:[]},fallback:{kind:"neutral",alt:"Neutral background behind the interpretive scene"},provenance:{classification:"generated-presentation-media",sourceReferences:["Jackie's Window, Part 1, approved Chapters 1–8"],auditedAgainstRevision:plan.source.writingRevision,spatialPlan:"scene-data/jackies-window-spatial-plan.json",evidenceDocument:"docs/phase-2/JACKIES_WINDOW_SPATIAL_EVIDENCE.md",generator:"scripts/generate-town-scene.mjs",sourceManifest:"public/assets/scenes/jackies-window/source-manifest.json"},canon:{geometry:"interpretive",distances:"source-stated distances are scaled; otherwise approximate",architecture:"interpretive",publicLandmarks:false,nodeNaming:"CANON_* identifies source-established locations or relationships; INFERRED_* identifies reasoned placement; PRESENTATION_* identifies connective geometry.",notice:"The scene is an interpretive visualization of the approved Part One writing. Unspecified distances, coordinates, bearings, and architecture are not asserted as canon."},requiredLandmarkNodes:plan.landmarks.map((x)=>x.nodeName),authoredViews:plan.cameras.filter((x)=>!x.name.startsWith("Camera_Descent_")).map((x)=>({cameraNode:x.name,label:x.label,sourceReferences:x.source})),descent:{startCameraNode:"Camera_Descent_Start",endCameraNode:"Camera_Descent_End"},authoredRoutes:plan.routes.map((x)=>x.name),anchors:[]};
writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+"\n");
console.log(`Generated ${outputPath}: ${glb.length} bytes, ${stats.nodes} nodes, ${stats.meshes} meshes, ${stats.baseTriangles} base triangles.`);
