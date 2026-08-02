import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Quaternion,
  Scene,
  SphereGeometry,
  Vector3,
} from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

const planPath = resolve(
  process.argv[2] ?? "scene-data/jackies-window-spatial-plan.json",
);
const outputPath = resolve(
  process.argv[3] ??
    "public/assets/scenes/jackies-window/rock-springs-jackies-window.glb",
);
const sourcePlan = JSON.parse(readFileSync(planPath, "utf8"));
const horizontalScale = sourcePlan.coordinates.horizontalMetersPerUnit ?? 1;

function toWorldPosition([x, y, z]) {
  return [x * horizontalScale, y, z * horizontalScale];
}

const plan = structuredClone(sourcePlan);
plan.bounds = {
  minX: sourcePlan.bounds.minX * horizontalScale,
  maxX: sourcePlan.bounds.maxX * horizontalScale,
  minZ: sourcePlan.bounds.minZ * horizontalScale,
  maxZ: sourcePlan.bounds.maxZ * horizontalScale,
};
plan.landmarks = sourcePlan.landmarks.map((landmark) => ({
  ...landmark,
  position: toWorldPosition(landmark.position),
}));
plan.roads = sourcePlan.roads.map((road) => ({
  ...road,
  position: road.position ? toWorldPosition(road.position) : undefined,
  length: road.length * horizontalScale,
}));
plan.cameras = sourcePlan.cameras.map((camera) => ({
  ...camera,
  position: toWorldPosition(camera.position),
  target: toWorldPosition(camera.target),
}));
plan.routes = sourcePlan.routes.map((route) => ({
  ...route,
  points: route.points.map(toWorldPosition),
}));
const landmarkById = new Map(plan.landmarks.map((landmark) => [landmark.id, landmark]));

class NodeFileReader {
  result = null;
  onloadend = null;

  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.({ target: this });
    });
  }

  readAsDataURL(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = `data:${blob.type};base64,${Buffer.from(result).toString("base64")}`;
      this.onloadend?.({ target: this });
    });
  }
}

globalThis.FileReader ??= NodeFileReader;

const scene = new Scene();
scene.name = "Rock_Springs_Architectural_Blockout";
scene.userData = {
  modelId: plan.id,
  source: `${plan.source.work}, Chapters ${plan.source.chapters[0]}–${plan.source.chapters.at(-1)}`,
  writingRevision: plan.source.writingRevision,
  coordinateConvention: {
    ...sourcePlan.coordinates,
    glbMetersPerUnit: 1,
    note: "Horizontal plan coordinates are converted to meters in the GLB.",
  },
  canonNotice:
    "Named locations and stated relationships are source-derived. Coordinates, architecture, and filler geometry remain interpretive.",
};

const groups = Object.fromEntries(
  plan.requiredGroups.map((name) => {
    const group = new Group();
    group.name = name;
    group.userData = {
      classification:
        name === "Authored_Cameras" || name === "Authored_Paths"
          ? "presentation-metadata"
          : "scene-hierarchy",
    };
    scene.add(group);
    return [name, group];
  }),
);

const geometryCache = new Map();
const materials = {};

function geometry(key, factory) {
  if (!geometryCache.has(key)) geometryCache.set(key, factory());
  return geometryCache.get(key);
}

function material(name, options) {
  const value = new MeshStandardMaterial({
    roughness: 0.84,
    metalness: 0.03,
    ...options,
  });
  value.name = name;
  materials[name] = value;
  return value;
}

const palette = {
  ground: material("MAT_Glacial_Earth", { color: 0x313831, roughness: 1 }),
  grass: material("MAT_Unkempt_Grass", { color: 0x364431, roughness: 1 }),
  field: material("MAT_Fallow_Field", { color: 0x635c3d, roughness: 1 }),
  asphalt: material("MAT_Cracked_Asphalt", { color: 0x292b2a, roughness: 0.97 }),
  concrete: material("MAT_Aged_Concrete", { color: 0x74746c, roughness: 0.94 }),
  brick: material("MAT_Dark_Brick", { color: 0x4d3028, roughness: 0.92 }),
  redBrick: material("MAT_School_Brick", { color: 0x633328, roughness: 0.95 }),
  grayBrick: material("MAT_Eisenhower_Gray_Brick", { color: 0x68675f, roughness: 0.92 }),
  industrial: material("MAT_Industrial_Soot", { color: 0x343633, roughness: 0.9 }),
  whiteSiding: material("MAT_Aged_White_Siding", { color: 0xb8b5a5, roughness: 0.9 }),
  redSiding: material("MAT_Oxide_Red_Siding", { color: 0x6f2b26, roughness: 0.91 }),
  blueSiding: material("MAT_Faded_Blue_Siding", { color: 0x4d6670, roughness: 0.9 }),
  greenSiding: material("MAT_Faded_Green_Siding", { color: 0x596955, roughness: 0.91 }),
  tanSiding: material("MAT_Faded_Tan_Siding", { color: 0x8b7c61, roughness: 0.92 }),
  roof: material("MAT_Aged_Roofing", { color: 0x252525, roughness: 0.95 }),
  blackPaint: material("MAT_Chipped_Black_Paint", { color: 0x171615, roughness: 0.98 }),
  exposedWood: material("MAT_Exposed_Porch_Wood", { color: 0x82634a, roughness: 1 }),
  pothole: material("MAT_Pothole_Depression", { color: 0x111313, roughness: 1 }),
  tentCanvas: material("MAT_Aged_Circus_Canvas", { color: 0xb8aa8a, roughness: 0.95 }),
  roofRust: material("MAT_Rusted_Metal_Roof", {
    color: 0x54352b,
    roughness: 0.88,
    metalness: 0.28,
  }),
  wood: material("MAT_Weathered_Wood", { color: 0x554638, roughness: 1 }),
  metal: material("MAT_Dull_Metal", {
    color: 0x4f5654,
    roughness: 0.72,
    metalness: 0.62,
  }),
  water: material("MAT_Rock_River", {
    color: 0x17343d,
    roughness: 0.24,
    metalness: 0.12,
    transparent: true,
    opacity: 0.9,
  }),
  treeTrunk: material("MAT_Tree_Trunk", { color: 0x332c24, roughness: 1 }),
  townLeaves: material("MAT_Town_Foliage", { color: 0x344538, roughness: 1 }),
  woodsLeaves: material("MAT_Woods_Foliage", { color: 0x172b25, roughness: 1 }),
  warmWindow: material("MAT_Warm_Window", {
    color: 0x8e6841,
    emissive: 0xd98e45,
    emissiveIntensity: 3.2,
    roughness: 0.35,
  }),
  cathedralGlass: material("MAT_Stained_Glass", {
    color: 0x513b55,
    emissive: 0x6d486c,
    emissiveIntensity: 2.1,
    roughness: 0.42,
  }),
  darkWindow: material("MAT_Dark_Window", {
    color: 0x10191b,
    metalness: 0.3,
    roughness: 0.35,
  }),
};

const houseBodyMaterials = [
  palette.tanSiding,
  palette.blueSiding,
  palette.greenSiding,
  palette.whiteSiding,
  palette.redSiding,
  palette.grayBrick,
  palette.brick,
  palette.tanSiding,
];

function seededRandom(seed = 0x1879) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

const random = seededRandom();
const yAxis = new Vector3(0, 1, 0);

function glacialBase(x, z) {
  return (
    1.4 +
    Math.sin((x + 55) * 0.0105) * 0.7 +
    Math.cos((z - 36) * 0.0135) * 0.55 +
    Math.sin((x + z) * 0.006) * 0.45
  );
}

function riverCenterZ(x) {
  const river = landmarkById.get("river");
  return (
    river.position[2] +
    Math.sin((x + 67) * 0.009) * 4.4 +
    Math.sin(x * 0.023) * 1.4
  );
}

function terrainHeight(x, z) {
  let height = glacialBase(x, z);
  const riverDistance = Math.abs(z - riverCenterZ(x));
  height -= Math.exp(-(riverDistance * riverDistance) / 90) * 5.3;

  const farm = landmarkById.get("chalmers-property");
  const ruins = landmarkById.get("old-ruins");
  if (z > farm.position[2] - 70 && x < farm.position[0] + 110) {
    height += Math.min((z - (farm.position[2] - 70)) * 0.025, 3.1);
  }
  if (z > ruins.position[2] - 95 && x < farm.position[0] - 20) {
    height -= Math.min((z - (ruins.position[2] - 95)) * 0.075, 10.5);
  }

  const downtownCenter = toWorldPosition([77, 0, 35]);
  if (
    x > downtownCenter[0] - 175 &&
    x < downtownCenter[0] + 175 &&
    z > downtownCenter[2] - 160 &&
    z < downtownCenter[2] + 160
  ) {
    height += 0.8;
  }

  return height;
}

const roads = plan.roads.map((road) => {
  const position = road.landmarkId
    ? landmarkById.get(road.landmarkId)?.position
    : road.position;
  if (!position) throw new Error(`Road ${road.id} has no position`);
  return { ...road, position };
});

function isWithinRoadCorridor(x, z, clearance = 0) {
  for (const road of roads) {
    const [centerX, , centerZ] = road.position;
    const { axis, length, width } = road;
    const sidewalkExtent = width / 2 + 2.1;
    const along = axis === "x" ? Math.abs(x - centerX) : Math.abs(z - centerZ);
    const across = axis === "x" ? Math.abs(z - centerZ) : Math.abs(x - centerX);
    if (along <= length / 2 + clearance && across <= sidewalkExtent + clearance) {
      return true;
    }
  }

  return false;
}

function doesFootprintIntersectRoad(x, z, halfWidth, halfDepth) {
  for (const road of roads) {
    const [centerX, , centerZ] = road.position;
    const { axis, length, width } = road;
    const sidewalkExtent = width / 2 + 2.1;
    const along =
      axis === "x"
        ? Math.abs(x - centerX) <= length / 2 + halfWidth
        : Math.abs(z - centerZ) <= length / 2 + halfDepth;
    const across =
      axis === "x"
        ? Math.abs(z - centerZ) <= sidewalkExtent + halfDepth
        : Math.abs(x - centerX) <= sidewalkExtent + halfWidth;
    if (along && across) {
      return true;
    }
  }

  return false;
}

function reservationFor(id, halfWidth, halfDepth) {
  const landmark = landmarkById.get(id);
  return {
    x: landmark.position[0],
    z: landmark.position[2],
    halfWidth,
    halfDepth,
  };
}

function reservationFromFootprint(id, paddingX = 0, paddingZ = paddingX) {
  const landmark = landmarkById.get(id);
  if (!landmark.footprint) {
    throw new Error(`Reservation landmark ${id} has no footprint`);
  }
  return reservationFor(
    id,
    landmark.footprint[0] / 2 + paddingX,
    landmark.footprint[1] / 2 + paddingZ,
  );
}

const townReservations = [
  reservationFromFootprint("new-beginnings", 8, 12),
  reservationFromFootprint("old-school-staging-lot", 12, 14),
  reservationFromFootprint("old-school", 8, 12),
  reservationFromFootprint("abbys-apartment", 18, 14),
  reservationFromFootprint("police-station", 16, 17),
  reservationFromFootprint("st-thomas", 11, 13),
  reservationFromFootprint("sheriffs-sons-house", 23, 18),
  reservationFromFootprint("detective-position", 17, 16),
  reservationFromFootprint("city-park", 6, 6),
  {
    x: toWorldPosition([77, 0, 35])[0],
    z: toWorldPosition([77, 0, 35])[2],
    halfWidth: 175,
    halfDepth: 160,
  },
  reservationFromFootprint("chalmers-property", 76, 57),
];

const residentialLotCenters = [
  [-25, 78],
  [-12, 78],
  [2, 78],
  [-25, 96],
  [-12, 96],
  [2, 96],
  [132, 100],
  [146, 100],
  [160, 100],
  [132, 118],
  [146, 118],
  [160, 118],
  [142, 18],
  [158, 18],
  [174, 18],
  [142, 58],
  [158, 58],
  [174, 58],
].map(([x, z]) => {
  const [worldX, , worldZ] = toWorldPosition([x, 0, z]);
  return [worldX, worldZ];
});

function isWithinReservedTownSite(x, z, clearance = 0) {
  return townReservations.some(
    (reservation) =>
      Math.abs(x - reservation.x) <= reservation.halfWidth + clearance &&
      Math.abs(z - reservation.z) <= reservation.halfDepth + clearance,
  );
}

function assertNamedBuildingClearance() {
  const structures = [
    ["st-thomas", 7.4, 9.5],
    ["abbys-apartment", 5.5, 4.5],
    ["bakery-storefront", 3.5, 4.5],
    ["old-school", 10.3, 4.5],
    ["police-station", 5.5, 4.5],
    ["sheriffs-sons-house", 3.9, 4.1],
  ];
  for (const [id, halfWidth, halfDepth] of structures) {
    const landmark = landmarkById.get(id);
    if (
      doesFootprintIntersectRoad(
        landmark.position[0],
        landmark.position[2],
        halfWidth,
        halfDepth,
      )
    ) {
      throw new Error(`${landmark.nodeName} intersects a reserved road corridor`);
    }
  }
}

function classify(object, classification, source = []) {
  object.userData = {
    ...object.userData,
    classification,
    source,
  };
  return object;
}

function addBox(
  parent,
  name,
  size,
  position,
  boxMaterial,
  {
    rotationY = 0,
    classification = "presentation-geometry",
    source = [],
  } = {},
) {
  const mesh = new Mesh(
    geometry("unit-box", () => new BoxGeometry(1, 1, 1)),
    boxMaterial,
  );
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...size);
  mesh.rotation.y = rotationY;
  classify(mesh, classification, source);
  parent.add(mesh);
  return mesh;
}

function createGableGeometry() {
  const positions = [
    -0.5, 0, -0.5,
    0.5, 0, -0.5,
    0, 0.5, -0.5,
    -0.5, 0, 0.5,
    0.5, 0, 0.5,
    0, 0.5, 0.5,
  ];
  const indices = [
    0, 2, 1,
    3, 4, 5,
    0, 3, 5,
    0, 5, 2,
    1, 2, 5,
    1, 5, 4,
    0, 1, 4,
    0, 4, 3,
  ];
  const result = new BufferGeometry();
  result.setAttribute("position", new Float32BufferAttribute(positions, 3));
  result.setIndex(indices);
  result.computeVertexNormals();
  return result;
}

function addGableRoof(
  parent,
  name,
  width,
  depth,
  height,
  position,
  roofMaterial = palette.roof,
) {
  const roof = new Mesh(
    geometry("unit-gable", createGableGeometry),
    roofMaterial,
  );
  roof.name = name;
  roof.position.set(...position);
  roof.scale.set(width, height * 2, depth);
  classify(roof, "presentation-architecture");
  parent.add(roof);
  return roof;
}

function addWindow(
  parent,
  name,
  position,
  size,
  windowMaterial = palette.darkWindow,
) {
  return addBox(parent, name, size, position, windowMaterial, {
    classification: "presentation-lighting-detail",
  });
}

function createTerrain() {
  const width = plan.bounds.maxX - plan.bounds.minX;
  const depth = plan.bounds.maxZ - plan.bounds.minZ;
  const centerX = (plan.bounds.minX + plan.bounds.maxX) / 2;
  const centerZ = (plan.bounds.minZ + plan.bounds.maxZ) / 2;
  const geometryValue = new PlaneGeometry(width, depth, 60, 60);
  geometryValue.rotateX(-Math.PI / 2);
  const positions = geometryValue.getAttribute("position");

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index) + centerX;
    const z = positions.getZ(index) + centerZ;
    positions.setXYZ(index, x, terrainHeight(x, z), z);
  }

  positions.needsUpdate = true;
  geometryValue.computeVertexNormals();

  const terrain = new Mesh(geometryValue, palette.ground);
  terrain.name = "PRESENTATION_Glacial_Terrain";
  terrain.receiveShadow = true;
  classify(terrain, "presentation-terrain");
  groups.Town_Ground.add(terrain);

  const fieldWidth = 210;
  const fieldDepth = 145;
  const fieldSegmentsX = 24;
  const fieldSegmentsZ = 16;
  const farmLandmark = landmarkById.get("chalmers-property");
  const fieldCenterX = farmLandmark.position[0];
  const fieldCenterZ = farmLandmark.position[2];
  const fieldPositions = [];
  const fieldIndices = [];

  for (let zIndex = 0; zIndex <= fieldSegmentsZ; zIndex += 1) {
    for (let xIndex = 0; xIndex <= fieldSegmentsX; xIndex += 1) {
      const x = fieldCenterX - fieldWidth / 2 + (fieldWidth * xIndex) / fieldSegmentsX;
      const z = fieldCenterZ - fieldDepth / 2 + (fieldDepth * zIndex) / fieldSegmentsZ;
      fieldPositions.push(x, terrainHeight(x, z) + 0.08, z);
    }
  }
  for (let zIndex = 0; zIndex < fieldSegmentsZ; zIndex += 1) {
    for (let xIndex = 0; xIndex < fieldSegmentsX; xIndex += 1) {
      const row = fieldSegmentsX + 1;
      const offset = zIndex * row + xIndex;
      fieldIndices.push(
        offset,
        offset + row,
        offset + 1,
        offset + 1,
        offset + row,
        offset + row + 1,
      );
    }
  }

  const fieldGeometry = new BufferGeometry();
  fieldGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(fieldPositions, 3),
  );
  fieldGeometry.setIndex(fieldIndices);
  fieldGeometry.computeVertexNormals();
  const farmland = new Mesh(fieldGeometry, palette.field);
  farmland.name = "PRESENTATION_Chalmers_Field_Surface";
  classify(farmland, "presentation-terrain");
  groups.Town_Ground.add(farmland);
  farmland.userData.note = "Interpretive farmland extent";
}

function createRiver() {
  const landmark = landmarkById.get("river");
  const group = new Group();
  group.name = landmark.nodeName;
  group.position.set(...landmark.position);
  classify(group, landmark.classification, landmark.source);
  groups.River.add(group);

  const positions = [];
  const indices = [];
  const samples = 96;

  for (let index = 0; index < samples; index += 1) {
    const worldX =
      plan.bounds.minX +
      ((plan.bounds.maxX - plan.bounds.minX) * index) / (samples - 1);
    const centerZ = riverCenterZ(worldX);
    const width = 7.5 + Math.sin(index * 0.31) * 1.4;
    const y = terrainHeight(worldX, centerZ) + 0.18;
    positions.push(
      worldX - landmark.position[0],
      y - landmark.position[1],
      centerZ - width - landmark.position[2],
      worldX - landmark.position[0],
      y - landmark.position[1],
      centerZ + width - landmark.position[2],
    );
    if (index < samples - 1) {
      const offset = index * 2;
      indices.push(
        offset,
        offset + 2,
        offset + 1,
        offset + 1,
        offset + 2,
        offset + 3,
      );
    }
  }

  const riverGeometry = new BufferGeometry();
  riverGeometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  riverGeometry.setIndex(indices);
  riverGeometry.computeVertexNormals();

  const water = new Mesh(riverGeometry, palette.water);
  water.name = "PRESENTATION_River_Surface";
  classify(water, "canon-feature-interpretive-course", landmark.source);
  group.add(water);
}

function createRoad(
  parent,
  name,
  center,
  length,
  width,
  axis = "x",
  classification = "presentation-infrastructure",
) {
  const group = new Group();
  group.name = name;
  group.position.set(...center);
  classify(group, classification);
  parent.add(group);

  const roadSize = axis === "x" ? [length, 0.22, width] : [width, 0.22, length];
  addBox(group, `${name}_Surface`, roadSize, [0, 0, 0], palette.asphalt, {
    classification,
  });

  const sidewalkOffset = width / 2 + 1.25;
  const sidewalkSize =
    axis === "x" ? [length, 0.18, 1.55] : [1.55, 0.18, length];
  const curbSize =
    axis === "x" ? [length, 0.32, 0.22] : [0.22, 0.32, length];

  for (const side of [-1, 1]) {
    const sidewalkPosition =
      axis === "x" ? [0, 0.12, side * sidewalkOffset] : [side * sidewalkOffset, 0.12, 0];
    const curbPosition =
      axis === "x" ? [0, 0.18, side * (width / 2 + 0.22)] : [side * (width / 2 + 0.22), 0.18, 0];
    addBox(
      group,
      `${name}_Sidewalk_${side > 0 ? "NorthEast" : "SouthWest"}`,
      sidewalkSize,
      sidewalkPosition,
      palette.concrete,
    );
    addBox(
      group,
      `${name}_Curb_${side > 0 ? "NorthEast" : "SouthWest"}`,
      curbSize,
      curbPosition,
      palette.concrete,
    );
  }

  return group;
}

function createStreetGrid() {
  for (const road of roads) {
    const parent = road.landmarkId ? groups.Downtown : groups.Town_Ground;
    const roadGroup = createRoad(
      parent,
      road.nodeName,
      road.position,
      road.length,
      road.width,
      road.axis,
      road.classification,
    );
    roadGroup.userData.source = road.source;
    if (road.landmarkId) {
      roadGroup.userData.bearing = "inferred-east-west";
      for (const child of roadGroup.children) {
        child.name = child.name.replace(
          new RegExp(`^${road.nodeName}`),
          `PRESENTATION_${road.nodeName.replace(/^CANON_/, "")}`,
        );
        child.userData.classification = "presentation-infrastructure";
      }
    }
  }
}

function createNamedHouse({
  parent,
  name,
  position,
  width = 7,
  depth = 8,
  floors = 2,
  bodyMaterial = palette.whiteSiding,
  roofMaterial = palette.roof,
  rotationY = 0,
  classification = "presentation-architecture",
  source = [],
  porchWidth = width * 0.68,
  porchMaterial = palette.wood,
  glowWindow = false,
}) {
  const group = new Group();
  group.name = name;
  group.position.set(...position);
  group.rotation.y = rotationY;
  classify(group, classification, source);
  parent.add(group);
  const detailPrefix = `PRESENTATION_${name.replace(/^(CANON|INFERRED)_/, "")}`;

  const floorHeight = 3.1;
  const bodyHeight = floors * floorHeight;
  addBox(
    group,
    `${detailPrefix}_Foundation`,
    [width + 0.5, 0.65, depth + 0.5],
    [0, 0.32, 0],
    palette.concrete,
  );
  addBox(
    group,
    `${detailPrefix}_Body`,
    [width, bodyHeight, depth],
    [0, bodyHeight / 2 + 0.65, 0],
    bodyMaterial,
    { classification: "presentation-architecture" },
  );
  addGableRoof(
    group,
    `${detailPrefix}_Roof`,
    width + 0.75,
    depth + 0.8,
    2.1,
    [0, bodyHeight + 0.65, 0],
    roofMaterial,
  );
  addBox(
    group,
    `${detailPrefix}_Porch`,
    [porchWidth, 0.42, 2.25],
    [0, 0.9, -depth / 2 - 0.9],
    porchMaterial,
  );
  addBox(
    group,
    `${detailPrefix}_Porch_Roof`,
    [porchWidth + 0.5, 0.25, 2.5],
    [0, 3.05, -depth / 2 - 0.9],
    roofMaterial,
  );
  for (const x of [-porchWidth / 2 + 0.35, porchWidth / 2 - 0.35]) {
    addBox(
      group,
      `${detailPrefix}_Porch_Post_${x}`,
      [0.2, 2.2, 0.2],
      [x, 1.95, -depth / 2 - 1.15],
      porchMaterial,
    );
  }
  addBox(
    group,
    `${detailPrefix}_Chimney`,
    [0.7, 3.1, 0.9],
    [width * 0.27, bodyHeight + 1.15, 0.7],
    palette.brick,
  );

  const windowMaterial = glowWindow ? palette.warmWindow : palette.darkWindow;
  for (let floor = 0; floor < floors; floor += 1) {
    const y = 2.25 + floor * floorHeight;
    for (const x of [-width * 0.27, width * 0.27]) {
      addWindow(
        group,
        `${detailPrefix}_Front_Window_${floor}_${x}`,
        [x, y, -depth / 2 - 0.03],
        [1.05, 1.35, 0.12],
        floor === floors - 1 && glowWindow ? windowMaterial : palette.darkWindow,
      );
    }
  }

  return group;
}

function createResidentialInstances() {
  const placements = [];

  for (const [x, z] of residentialLotCenters) {
    if (isWithinRoadCorridor(x, z, 4.2)) continue;
    if (isWithinReservedTownSite(x, z, 1.5)) continue;
    placements.push({
      x,
      z,
      rotation: z < 0 ? Math.PI : 0,
      scale: 0.74 + random() * 0.14,
      variant: Math.floor(random() * 8),
    });
  }

  for (const placement of placements) {
    if (isWithinRoadCorridor(placement.x, placement.z, 4.2)) {
      throw new Error(
        `Residential placement intersects a reserved road corridor at ${placement.x}, ${placement.z}`,
      );
    }
  }

  const unitBox = geometry("unit-box", () => new BoxGeometry(1, 1, 1));
  const unitGable = geometry("unit-gable", createGableGeometry);
  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  const position = new Vector3();
  const scale = new Vector3();

  for (let variant = 0; variant < 8; variant += 1) {
    const instances = placements.filter((placement) => placement.variant === variant);
    if (instances.length === 0) continue;
    const older = variant >= 5;
    const width = older ? 6.6 + (variant % 2) * 1.1 : 7.2 + (variant % 3) * 0.8;
    const depth = older ? 8.6 : 7.1 + (variant % 2) * 1.2;
    const height = older ? 6.6 : 3.5 + (variant % 3 === 0 ? 2.8 : 0);

    const body = new InstancedMesh(unitBox, houseBodyMaterials[variant], instances.length);
    const roof = new InstancedMesh(unitGable, variant % 3 === 0 ? palette.roofRust : palette.roof, instances.length);
    const porch = new InstancedMesh(unitBox, palette.wood, instances.length);
    body.name = `PRESENTATION_House_Variant_${variant + 1}_Bodies`;
    roof.name = `PRESENTATION_House_Variant_${variant + 1}_Roofs`;
    porch.name = `PRESENTATION_House_Variant_${variant + 1}_Porches`;
    classify(body, "presentation-instanced-residential");
    classify(roof, "presentation-instanced-residential");
    classify(porch, "presentation-instanced-residential");

    instances.forEach((placement, index) => {
      const baseY = terrainHeight(placement.x, placement.z);
      quaternion.setFromAxisAngle(yAxis, placement.rotation);

      position.set(placement.x, baseY + (height * placement.scale) / 2, placement.z);
      scale.set(width * placement.scale, height * placement.scale, depth * placement.scale);
      matrix.compose(position, quaternion, scale);
      body.setMatrixAt(index, matrix);

      position.set(placement.x, baseY + height * placement.scale, placement.z);
      scale.set(
        (width + 0.65) * placement.scale,
        (older ? 4.3 : 3.2) * placement.scale,
        (depth + 0.7) * placement.scale,
      );
      matrix.compose(position, quaternion, scale);
      roof.setMatrixAt(index, matrix);

      const localPorch = new Vector3(0, 0, -(depth / 2 + 0.8) * placement.scale)
        .applyQuaternion(quaternion)
        .add(new Vector3(placement.x, baseY + 0.55, placement.z));
      position.copy(localPorch);
      scale.set(width * 0.55 * placement.scale, 0.35, 1.6 * placement.scale);
      matrix.compose(position, quaternion, scale);
      porch.setMatrixAt(index, matrix);
    });

    body.instanceMatrix.needsUpdate = true;
    roof.instanceMatrix.needsUpdate = true;
    porch.instanceMatrix.needsUpdate = true;
    groups.Residential.add(body, roof, porch);
  }
}

function createFence(parent, name, points, height = 1.45) {
  const group = new Group();
  group.name = name;
  classify(group, "presentation-boundary");
  parent.add(group);

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = new Vector3(...points[index]);
    const end = new Vector3(...points[index + 1]);
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const length = start.distanceTo(end);
    const angle = Math.atan2(end.x - start.x, end.z - start.z);
    addBox(
      group,
      `${name}_Rail_${index}`,
      [0.09, 0.08, length],
      [midpoint.x, midpoint.y + height * 0.55, midpoint.z],
      palette.metal,
      { rotationY: angle },
    );
    addBox(
      group,
      `${name}_Top_Rail_${index}`,
      [0.09, 0.08, length],
      [midpoint.x, midpoint.y + height, midpoint.z],
      palette.metal,
      { rotationY: angle },
    );
    for (let offset = 0; offset <= length; offset += 2.4) {
      const fraction = length === 0 ? 0 : offset / length;
      const post = start.clone().lerp(end, fraction);
      addBox(
        group,
        `${name}_Post_${index}_${offset}`,
        [0.11, height, 0.11],
        [post.x, post.y + height / 2, post.z],
        palette.metal,
      );
    }
  }
  return group;
}

function createTreeInstances(parent, name, placements, foliageMaterial, style = "deciduous") {
  const trunkGeometry = geometry(
    "unit-tree-trunk",
    () => new CylinderGeometry(0.5, 0.7, 1, 7),
  );
  const crownGeometry =
    style === "conifer"
      ? geometry("unit-conifer-crown", () => new ConeGeometry(1, 2, 8))
      : geometry("unit-deciduous-crown", () => new SphereGeometry(1, 7, 5));
  const trunks = new InstancedMesh(trunkGeometry, palette.treeTrunk, placements.length);
  const crowns = new InstancedMesh(crownGeometry, foliageMaterial, placements.length);
  trunks.name = `${name}_Trunks`;
  crowns.name = `${name}_Crowns`;
  classify(trunks, "presentation-instanced-vegetation");
  classify(crowns, "presentation-instanced-vegetation");

  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  const position = new Vector3();
  const scale = new Vector3();

  placements.forEach(({ x, z, size = 1, y }, index) => {
    const baseY = y ?? terrainHeight(x, z);
    quaternion.setFromAxisAngle(yAxis, random() * Math.PI * 2);
    position.set(x, baseY + 1.8 * size, z);
    scale.set(0.55 * size, 3.6 * size, 0.55 * size);
    matrix.compose(position, quaternion, scale);
    trunks.setMatrixAt(index, matrix);

    position.set(x, baseY + (style === "conifer" ? 5.7 : 5.2) * size, z);
    scale.set(
      (style === "conifer" ? 3.2 : 3.7) * size,
      (style === "conifer" ? 5.4 : 3.1) * size,
      (style === "conifer" ? 3.2 : 3.7) * size,
    );
    matrix.compose(position, quaternion, scale);
    crowns.setMatrixAt(index, matrix);
  });

  trunks.instanceMatrix.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  parent.add(trunks, crowns);
}

function createVegetation() {
  const townTrees = [];
  let attempts = 0;
  while (townTrees.length < 26 && attempts < 260) {
    attempts += 1;
    const [townMinX, , townMinZ] = toWorldPosition([-30, 0, -25]);
    const [townMaxX, , townMaxZ] = toWorldPosition([180, 0, 130]);
    const x = townMinX + random() * (townMaxX - townMinX);
    const z = townMinZ + random() * (townMaxZ - townMinZ);
    if (isWithinRoadCorridor(x, z, 1.4)) continue;
    if (isWithinReservedTownSite(x, z, 0.8)) continue;
    if (
      residentialLotCenters.some(
        ([houseX, houseZ]) => Math.hypot(x - houseX, z - houseZ) < 5.8,
      )
    ) {
      continue;
    }
    townTrees.push({
      x,
      z,
      size: 0.55 + random() * 0.45,
    });
  }
  createTreeInstances(
    groups.Residential,
    "PRESENTATION_Town_Trees",
    townTrees,
    palette.townLeaves,
  );

  const riverTrees = [];
  for (let index = 0; index < 38; index += 1) {
    const x =
      plan.bounds.minX +
      random() * (plan.bounds.maxX - plan.bounds.minX);
    const side = random() > 0.5 ? 1 : -1;
    riverTrees.push({
      x,
      z: riverCenterZ(x) + side * (11 + random() * 8),
      size: 0.65 + random() * 0.55,
    });
  }
  createTreeInstances(
    groups.River,
    "PRESENTATION_Riverbank_Trees",
    riverTrees,
    palette.townLeaves,
  );

  const woodsTrees = [];
  const ruins = landmarkById.get("old-ruins");
  const farm = landmarkById.get("chalmers-property");
  for (let index = 0; index < 150; index += 1) {
    woodsTrees.push({
      x: ruins.position[0] - 85 + random() * 210,
      z: farm.position[2] + 80 + random() * 205,
      size: 0.72 + random() * 0.75,
    });
  }
  createTreeInstances(
    groups.Woods,
    "PRESENTATION_Dense_Woods",
    woodsTrees,
    palette.woodsLeaves,
    "conifer",
  );
}

function createDowntown() {
  const downtown = groups.Downtown;
  const blocks = [
    [52, 4, 12, 12, 16],
    [67, 3, 10, 11, 22],
    [82, 4, 12, 10, 18],
    [98, 3, 9, 12, 13],
    [113, 4, 11, 10, 15],
    [53, 43, 11, 10, 13],
    [69, 45, 10, 9, 18],
    [84, 45, 11, 10, 15],
    [99, 43, 8, 9, 11],
  ].map(([x, z, width, depth, height]) => {
    const [worldX, , worldZ] = toWorldPosition([x, 0, z]);
    return [worldX, worldZ, width, depth, height];
  });
  blocks.forEach(([x, z, width, depth, height], index) => {
    const y = terrainHeight(x, z);
    const building = addBox(
      downtown,
      `PRESENTATION_Downtown_Block_${String(index + 1).padStart(2, "0")}`,
      [width, height, depth],
      [x, y + height / 2, z],
      index % 3 === 0 ? palette.grayBrick : palette.brick,
      { classification: "presentation-architecture" },
    );
    building.userData.maxStories = Math.min(Math.round(height / 3.2), 6);
    for (let floor = 1; floor < height / 3; floor += 1) {
      addWindow(
        downtown,
        `PRESENTATION_Downtown_Window_${index}_${floor}`,
        [x + width / 2 + 0.05, y + floor * 3, z],
        [0.12, 1.1, Math.max(depth - 2, 2)],
        floor === 2 && index % 4 === 0 ? palette.warmWindow : palette.darkWindow,
      );
    }
  });

  const shopNames = [
    "Pawn_And_Bail",
    "Hair_Salon",
    "Accountant",
    "Hobby_Store",
    "Bella_Miha_Diner",
  ];
  shopNames.forEach((shop, index) => {
    const [x, , z] = toWorldPosition([50 + index * 10, 0, 73]);
    const shopGroup = new Group();
    shopGroup.name = `PRESENTATION_${shop}`;
    shopGroup.position.set(x, terrainHeight(x, z), z);
    classify(shopGroup, "canon-business-type-presentation-architecture", ["Chapter 2:67"]);
    downtown.add(shopGroup);
    addBox(shopGroup, `${shopGroup.name}_Body`, [6.6, 4.8, 6.4], [0, 2.4, 0], palette.grayBrick);
    addWindow(
      shopGroup,
      `${shopGroup.name}_Storefront`,
      [0, 2.05, -3.23],
      [4.8, 2.4, 0.12],
      shop === "Bella_Miha_Diner" ? palette.warmWindow : palette.darkWindow,
    );
    addBox(shopGroup, `${shopGroup.name}_Awning`, [5.1, 0.18, 1.1], [0, 3.1, -3.65], index % 2 ? palette.redSiding : palette.metal);
  });

  const industrialSites = [
    [35, -82, 18, 11, 9],
    [55, -82, 14, 10, 12],
    [75, -81, 16, 10, 8],
    [95, -82, 18, 11, 11],
  ].map(([x, z, width, depth, height]) => {
    const [worldX, , worldZ] = toWorldPosition([x, 0, z]);
    return [worldX, worldZ, width, depth, height];
  });
  industrialSites.forEach(([x, z, width, depth, height], index) => {
    const y = terrainHeight(x, z);
    addBox(
      downtown,
      `PRESENTATION_River_Industry_${index + 1}`,
      [width, height, depth],
      [x, y + height / 2, z],
      palette.industrial,
    );
    const stack = new Mesh(
      geometry("unit-stack", () => new CylinderGeometry(0.5, 0.8, 1, 10)),
      palette.brick,
    );
    stack.name = `PRESENTATION_Smokestack_${index + 1}`;
    stack.position.set(x + width * 0.28, y + height + 7, z);
    stack.scale.set(1.3, 14, 1.3);
    classify(stack, "presentation-industrial-detail");
    downtown.add(stack);
  });
}

function createCathedral() {
  const landmark = landmarkById.get("st-thomas");
  const cathedral = new Group();
  cathedral.name = landmark.nodeName;
  cathedral.position.set(...landmark.position);
  classify(cathedral, landmark.classification, landmark.source);
  groups.Downtown.add(cathedral);

  addBox(cathedral, "PRESENTATION_St_Thomas_Nave", [8, 8.5, 18], [0, 4.25, 0], palette.brick);
  addBox(cathedral, "PRESENTATION_St_Thomas_Transept", [14, 7.4, 6], [0, 3.7, 1.5], palette.brick);
  addGableRoof(cathedral, "PRESENTATION_St_Thomas_Nave_Roof", 8.8, 19, 3.4, [0, 8.5, 0], palette.roof);
  addGableRoof(cathedral, "PRESENTATION_St_Thomas_Transept_Roof", 14.8, 6.8, 2.7, [0, 7.4, 1.5], palette.roof);
  addBox(cathedral, "PRESENTATION_St_Thomas_Bell_Tower", [4.8, 16, 5.2], [0, 8, -8], palette.brick);

  const spire = new Mesh(
    geometry("cathedral-spire", () => new ConeGeometry(3.3, 11, 8)),
    palette.roof,
  );
  spire.name = "PRESENTATION_St_Thomas_Spire";
  spire.position.set(0, 21.5, -8);
  classify(spire, "presentation-architecture");
  cathedral.add(spire);

  for (const x of [-2.3, 0, 2.3]) {
    addWindow(
      cathedral,
      `PRESENTATION_St_Thomas_Stained_Glass_${x}`,
      [x, 5, -9.05],
      [1.15, 3, 0.12],
      palette.cathedralGlass,
    );
  }
}

function createNewBeginnings() {
  const landmark = landmarkById.get("new-beginnings");
  const jackiesHouseLandmark = landmarkById.get("jackies-house");
  const newBeginnings = new Group();
  newBeginnings.name = landmark.nodeName;
  newBeginnings.position.set(...landmark.position);
  classify(newBeginnings, landmark.classification, landmark.source);
  groups.New_Beginnings.add(newBeginnings);

  const houses = [
    {
      name: "CANON_New_Beginnings_House_01",
      x: -18 * horizontalScale,
      width: 6,
      depth: 7.6,
      bodyMaterial: palette.tanSiding,
      roofMaterial: palette.roofRust,
      porchWidth: 4.4,
    },
    {
      name: "CANON_New_Beginnings_House_02",
      x: -6 * horizontalScale,
      width: 5.6,
      depth: 8,
      bodyMaterial: palette.greenSiding,
      roofMaterial: palette.roof,
      porchWidth: 5,
    },
    {
      name: "CANON_Jackies_House",
      x: jackiesHouseLandmark.position[0] - landmark.position[0],
      width: 6,
      depth: 7.8,
      bodyMaterial: palette.redSiding,
      roofMaterial: palette.roof,
      porchWidth: 4.7,
      porchMaterial: palette.blackPaint,
      glowWindow: true,
      source: jackiesHouseLandmark.source,
      classification: jackiesHouseLandmark.classification,
    },
    {
      name: "CANON_New_Beginnings_House_04",
      x: 18 * horizontalScale,
      width: 6.2,
      depth: 7.5,
      bodyMaterial: palette.whiteSiding,
      roofMaterial: palette.roofRust,
      porchWidth: 5.7,
    },
  ];

  for (const house of houses) {
    const worldX = landmark.position[0] + house.x;
    const worldZ = landmark.position[2];
    if (
      doesFootprintIntersectRoad(
        worldX,
        worldZ,
        house.width / 2,
        house.depth / 2,
      )
    ) {
      throw new Error(`${house.name} intersects a reserved road corridor`);
    }
    const result = createNamedHouse({
      parent: newBeginnings,
      name: house.name,
      position: [house.x, 0, 0],
      width: house.width,
      depth: house.depth,
      floors: 2,
      bodyMaterial: house.bodyMaterial,
      roofMaterial: house.roofMaterial,
      porchWidth: house.porchWidth,
      porchMaterial: house.porchMaterial,
      glowWindow: house.glowWindow,
      classification:
        house.classification ?? "canon-location-presentation-architecture",
      source: house.source ?? landmark.source,
    });
    result.userData.institutionalRow = true;

    if (house.name === jackiesHouseLandmark.nodeName) {
      const detailPrefix = "PRESENTATION_Jackies_House";
      const exposedPatches = [
        [`${detailPrefix}_Porch_Chip_01`, [0.7, 0.06, 0.16], [-1.45, 0.69, -5.38]],
        [`${detailPrefix}_Porch_Chip_02`, [0.45, 0.06, 0.16], [0.85, 0.69, -5.38]],
        [`${detailPrefix}_Porch_Post_Chip_01`, [0.22, 0.48, 0.22], [-2, 1.45, -5.52]],
        [`${detailPrefix}_Porch_Post_Chip_02`, [0.22, 0.34, 0.22], [2, 2.25, -5.52]],
      ];
      for (const [name, size, position] of exposedPatches) {
        addBox(result, name, size, position, palette.exposedWood);
      }
      for (let step = 0; step < 3; step += 1) {
        addBox(
          result,
          `${detailPrefix}_Porch_Step_${step + 1}`,
          [2.2 - step * 0.24, 0.22, 0.65],
          [0, 0.62 - step * 0.2, -5.9 - step * 0.48],
          palette.blackPaint,
        );
      }

      const brokenWalk = new Group();
      brokenWalk.name = "CANON_Jackies_Broken_Sidewalk";
      classify(
        brokenWalk,
        "canon-feature-presentation-geometry",
        ["Chapter 8:20"],
      );
      newBeginnings.add(brokenWalk);
      const walkSlabs = [
        [house.x - 0.08, 0.14, -4.55, 1.25, 1.4, -0.03],
        [house.x + 0.12, 0.13, -5.95, 1.2, 1.25, 0.05],
        [house.x - 0.16, 0.11, -7.25, 1.16, 1.2, -0.04],
        [house.x + 0.2, 0.08, -8.55, 1.12, 1.28, 0.07],
        [house.x - 0.22, 0.05, -9.85, 1.08, 1.3, -0.05],
      ];
      walkSlabs.forEach(([x, y, z, width, depth, rotationY], index) =>
        addBox(
          brokenWalk,
          `PRESENTATION_Jackies_Broken_Sidewalk_Slab_${index + 1}`,
          [width, 0.12, depth],
          [x, y, z],
          palette.concrete,
          { rotationY },
        ),
      );
    } else {
      addBox(
        newBeginnings,
        `PRESENTATION_${house.name.replace(/^CANON_/, "")}_Walk`,
        [1.25, 0.12, 7.2],
        [house.x, 0.14, -7.2],
        palette.concrete,
      );
    }
  }

  const jackiesWindowLandmark = landmarkById.get("jackies-window");
  const jackieLocalX =
    jackiesHouseLandmark.position[0] - landmark.position[0];
  const jackiesWindow = new Object3D();
  jackiesWindow.name = jackiesWindowLandmark.nodeName;
  jackiesWindow.position.set(
    jackiesWindowLandmark.position[0] - landmark.position[0],
    jackiesWindowLandmark.position[1] - landmark.position[1],
    jackiesWindowLandmark.position[2] - landmark.position[2],
  );
  classify(
    jackiesWindow,
    jackiesWindowLandmark.classification,
    jackiesWindowLandmark.source,
  );
  newBeginnings.add(jackiesWindow);

  createFence(
    newBeginnings,
    "PRESENTATION_New_Beginnings_West_Fence",
    [
      [-18 * horizontalScale - 5, 0, -6.2],
      [jackieLocalX - 4.3, 0, -6.2],
    ],
    1.55,
  );
  createFence(
    newBeginnings,
    "PRESENTATION_New_Beginnings_East_Fence",
    [
      [jackieLocalX + 4.3, 0, -6.2],
      [18 * horizontalScale + 5, 0, -6.2],
    ],
    1.55,
  );

  const sinkingFence = new Group();
  sinkingFence.name = "CANON_Jackies_Sinking_Fence";
  classify(
    sinkingFence,
    "canon-feature-presentation-geometry",
    ["Chapter 8:20"],
  );
  newBeginnings.add(sinkingFence);
  const fencePosts = [
    [jackieLocalX - 4.3, 0.62, -6.2, -0.16],
    [jackieLocalX - 1.45, 0.48, -6.2, -0.09],
    [jackieLocalX + 1.45, 0.7, -6.2, 0.1],
    [jackieLocalX + 4.3, 0.52, -6.2, 0.17],
  ];
  fencePosts.forEach(([x, y, z, tilt], index) => {
    const post = addBox(
      sinkingFence,
      `PRESENTATION_Jackies_Sinking_Fence_Post_${index + 1}`,
      [0.12, 1.45, 0.12],
      [x, y, z],
      palette.metal,
    );
    post.rotation.z = tilt;
  });
  const fenceRails = [
    [jackieLocalX - 2.88, 1.02, -0.08],
    [jackieLocalX, 0.88, 0.1],
    [jackieLocalX + 2.88, 0.96, -0.12],
  ];
  fenceRails.forEach(([x, y, tilt], index) => {
    const rail = addBox(
      sinkingFence,
      `PRESENTATION_Jackies_Sinking_Fence_Rail_${index + 1}`,
      [2.35, 0.1, 0.1],
      [x, y, -6.2],
      palette.metal,
    );
    rail.rotation.z = tilt;
  });

  const potholeStreet = new Group();
  potholeStreet.name = "CANON_Pothole_Ridden_Street_At_Jackies";
  classify(
    potholeStreet,
    "canon-feature-presentation-geometry",
    ["Chapter 8:20"],
  );
  newBeginnings.add(potholeStreet);
  [
    [jackieLocalX - 3.4, -12.1, 0.9, 0.58, 0.18],
    [jackieLocalX, -11.35, 0.65, 0.42, -0.25],
    [jackieLocalX + 3.2, -12.65, 0.78, 0.5, 0.08],
  ].forEach(([x, z, radiusX, radiusZ, rotationY], index) => {
    const pothole = new Mesh(
      geometry("unit-pothole", () => new CylinderGeometry(1, 1, 1, 14)),
      palette.pothole,
    );
    pothole.name = `PRESENTATION_Jackies_Street_Pothole_${index + 1}`;
    pothole.position.set(x, -0.25, z);
    pothole.scale.set(radiusX, 0.055, radiusZ);
    pothole.rotation.y = rotationY;
    classify(pothole, "presentation-infrastructure", ["Chapter 8:20"]);
    potholeStreet.add(pothole);
  });
}

function createAbbyDistrict() {
  const abbyLandmark = landmarkById.get("abbys-apartment");
  const abby = new Group();
  abby.name = abbyLandmark.nodeName;
  abby.position.set(...abbyLandmark.position);
  abby.rotation.y = Math.PI / 2;
  classify(abby, abbyLandmark.classification, abbyLandmark.source);
  groups.Abby_District.add(abby);

  addBox(abby, "PRESENTATION_Abby_Apartment_Body", [9, 14.2, 11], [0, 7.1, 0], palette.brick);
  addBox(abby, "PRESENTATION_Abby_Apartment_Cornice", [9.6, 0.65, 11.6], [0, 14.2, 0], palette.concrete);
  for (let floor = 0; floor < 4; floor += 1) {
    for (const x of [-2.5, 0, 2.5]) {
      addWindow(
        abby,
        `PRESENTATION_Abby_Window_${floor}_${x}`,
        [x, 2.2 + floor * 3.2, -5.55],
        [1.25, 1.45, 0.12],
        floor === 3 && x === 0 ? palette.warmWindow : palette.darkWindow,
      );
    }
  }
  addBox(abby, "PRESENTATION_Abby_Rooftop_Garden_Base", [7.2, 0.35, 7.8], [0, 14.7, 0], palette.concrete);
  for (const x of [-2.5, 0, 2.5]) {
    addBox(abby, `PRESENTATION_Abby_Roof_Planter_${x}`, [1.5, 0.8, 5], [x, 15.15, 0], palette.wood);
    addBox(abby, `PRESENTATION_Abby_Roof_Growth_${x}`, [1.25, 0.65, 4.7], [x, 15.75, 0], palette.grass);
  }
  abby.userData.viewpoint = [
    abbyLandmark.position[0],
    abbyLandmark.position[1] + 13.3,
    abbyLandmark.position[2],
  ];

  const bakeryLandmark = landmarkById.get("bakery-storefront");
  const bakery = new Group();
  bakery.name = bakeryLandmark.nodeName;
  bakery.position.set(...bakeryLandmark.position);
  classify(bakery, bakeryLandmark.classification, bakeryLandmark.source);
  groups.Abby_District.add(bakery);
  addBox(bakery, "PRESENTATION_Bakery_Storefront_Body", [7, 5.2, 9], [0, 2.6, 0], palette.grayBrick);
  addWindow(bakery, "PRESENTATION_Bakery_Storefront_Glow", [3.55, 2.3, 0], [0.12, 2.8, 5.7], palette.warmWindow);
  addBox(bakery, "PRESENTATION_Bakery_Storefront_Awning", [0.9, 0.24, 6.2], [4, 3.65, 0], palette.redSiding);
}

function createParadeDistrict() {
  const schoolLandmark = landmarkById.get("old-school");
  const stagingLotLandmark = landmarkById.get("old-school-staging-lot");
  const school = new Group();
  school.name = schoolLandmark.nodeName;
  school.position.set(...schoolLandmark.position);
  classify(school, schoolLandmark.classification, schoolLandmark.source);
  groups.Parade_District.add(school);

  addBox(school, "PRESENTATION_Old_School_Main", [13, 8, 8], [0, 4, 0], palette.redBrick);
  addBox(school, "PRESENTATION_Old_School_Wing", [6.5, 5.7, 9], [-7, 2.85, 0.6], palette.redBrick);
  addBox(school, "PRESENTATION_Old_School_Roof", [13.8, 0.65, 8.8], [0, 8.15, 0], palette.roof);
  for (const x of [-4.2, -1.4, 1.4, 4.2]) {
    addWindow(school, `PRESENTATION_Old_School_Boarded_Window_${x}`, [x, 3.9, -4.05], [1.45, 2.1, 0.18], palette.wood);
  }
  for (let step = 0; step < 5; step += 1) {
    addBox(
      school,
      `PRESENTATION_Old_School_Side_Step_${step}`,
      [2.8, 0.32, 0.72 + step * 0.58],
      [7.4, 0.18 + step * 0.29, -2.5 - step * 0.29],
      palette.concrete,
    );
  }

  addBox(
    groups.Parade_District,
    stagingLotLandmark.nodeName,
    [27, 0.24, 7.5],
    stagingLotLandmark.position,
    palette.asphalt,
    {
      classification: stagingLotLandmark.classification,
      source: stagingLotLandmark.source,
    },
  );
  const fadedPaint = material("MAT_Faded_Road_Paint", {
    color: 0xa7a389,
    roughness: 0.95,
  });
  for (
    let x = stagingLotLandmark.position[0] - 10;
    x <= stagingLotLandmark.position[0] + 10;
    x += 4.8
  ) {
    addBox(
      groups.Parade_District,
      `PRESENTATION_Staging_Lot_Line_${x}`,
      [0.12, 0.035, 4.2],
      [x, stagingLotLandmark.position[1] + 0.15, stagingLotLandmark.position[2] - 1],
      fadedPaint,
    );
  }

  const stagingActivity = new Group();
  stagingActivity.name = "CANON_Labor_Day_Staging_Activity";
  stagingActivity.position.set(...stagingLotLandmark.position);
  classify(
    stagingActivity,
    "canon-event-presentation-geometry",
    ["Chapter 3:69", "Chapter 8:18", "Chapter 8:52", "Chapter 8:84-88"],
  );
  groups.Parade_District.add(stagingActivity);

  const scoutClusters = [
    [-7.8, -1.4],
    [-5.9, 0.7],
    [-3.9, -1.1],
    [-1.8, 1.2],
    [0.3, -0.8],
    [2.4, 1.1],
    [4.3, -1],
  ];
  scoutClusters.forEach(([x, z], index) => {
    addBox(
      stagingActivity,
      `PRESENTATION_Webelos_Cluster_${index + 1}`,
      [0.55, 1.25, 0.55],
      [x, 0.72, z],
      index % 2 === 0 ? palette.greenSiding : palette.tanSiding,
      {
        classification: "presentation-event-proxy",
        source: ["Chapter 8:18", "Chapter 8:78-88"],
      },
    );
  });

  [
    [7.3, 0.2, -0.08],
    [9.2, -2.2, 0.05],
  ].forEach(([x, z, rotationY], index) => {
    const van = new Group();
    van.name = `PRESENTATION_Staging_News_Van_${index + 1}`;
    van.position.set(x, 0.25, z);
    van.rotation.y = rotationY;
    classify(van, "presentation-event-vehicle", ["Chapter 3:69", "Chapter 8:52"]);
    stagingActivity.add(van);
    addBox(van, `${van.name}_Body`, [3.4, 1.7, 1.65], [0, 0.9, 0], palette.whiteSiding);
    addBox(van, `${van.name}_Cab`, [1.2, 1.35, 1.65], [2.05, 0.68, 0], palette.grayBrick);
    addBox(van, `${van.name}_Mast`, [0.12, 3.5, 0.12], [-0.4, 3.15, 0], palette.metal);
  });

  const paradeFloat = new Group();
  paradeFloat.name = "PRESENTATION_Labor_Day_Parade_Float";
  const mainStreet = landmarkById.get("main-street");
  paradeFloat.position.set(
    mainStreet.position[0] + 24,
    mainStreet.position[1] + 0.55,
    mainStreet.position[2],
  );
  classify(paradeFloat, "presentation-event-vehicle", ["Chapter 8:52"]);
  groups.Parade_District.add(paradeFloat);
  addBox(paradeFloat, "PRESENTATION_Parade_Float_Base", [7.2, 0.65, 2.7], [0, 0.55, 0], palette.wood);
  addBox(paradeFloat, "PRESENTATION_Parade_Float_Display", [4.2, 2.5, 1.7], [0, 2.05, 0], palette.redSiding);
}

function createPoliceDistrict() {
  const policeLandmark = landmarkById.get("police-station");
  const station = new Group();
  station.name = policeLandmark.nodeName;
  station.position.set(...policeLandmark.position);
  classify(station, policeLandmark.classification, policeLandmark.source);
  groups.Police_District.add(station);
  addBox(station, "PRESENTATION_Police_Station_Body", [11, 6.5, 9], [0, 3.25, 0], palette.grayBrick);
  addBox(station, "PRESENTATION_Police_Station_Entry", [4, 4.2, 2], [0, 2.1, -5], palette.concrete);
  addWindow(station, "PRESENTATION_Police_Station_Light", [0, 2.4, -6.05], [2.4, 2.1, 0.12], palette.warmWindow);
  addBox(station, "PRESENTATION_Police_Station_Lot", [17, 0.2, 13], [0, 0, 9], palette.asphalt);

  const houseLandmark = landmarkById.get("sheriffs-sons-house");
  const targetHouse = createNamedHouse({
    parent: groups.Police_District,
    name: houseLandmark.nodeName,
    position: houseLandmark.position,
    width: 7.8,
    depth: 8.1,
    floors: 1,
    bodyMaterial: palette.tanSiding,
    classification: houseLandmark.classification,
    source: houseLandmark.source,
    porchWidth: 4.2,
  });
  targetHouse.userData.frontElevationOrientation = "south";
  const [houseX, houseY, houseZ] = houseLandmark.position;
  createFence(
    groups.Police_District,
    "PRESENTATION_Sheriffs_Son_Chain_Link_Fence",
    [
      [houseX - 5, houseY - 0.3, houseZ - 6],
      [houseX + 5, houseY - 0.3, houseZ - 6],
      [houseX + 5, houseY - 0.3, houseZ + 5],
      [houseX - 5, houseY - 0.3, houseZ + 5],
      [houseX - 5, houseY - 0.3, houseZ - 6],
    ],
  );
  addBox(
    groups.Police_District,
    "PRESENTATION_Sheriffs_Son_Gravel_Pull_Off",
    [9, 0.15, 3.4],
    [houseX, houseY - 0.2, houseZ - 6.3],
    palette.concrete,
  );
  addBox(
    groups.Police_District,
    "PRESENTATION_Sheriffs_Buick_Roadmaster",
    [5.2, 1.5, 2.1],
    [houseX - 1.8, houseY + 0.65, houseZ - 6.3],
    palette.metal,
    {
      classification: "canon-event-proxy",
      source: ["Chapter 2:17-23"],
    },
  );

  const detectiveLandmark = landmarkById.get("detective-position");
  const detectivePosition = new Group();
  detectivePosition.name = detectiveLandmark.nodeName;
  detectivePosition.position.set(...detectiveLandmark.position);
  classify(
    detectivePosition,
    detectiveLandmark.classification,
    detectiveLandmark.source,
  );
  groups.Police_District.add(detectivePosition);
  addBox(
    detectivePosition,
    "PRESENTATION_Surveillance_Commercial_Lot",
    [14, 0.15, 8],
    [0, -0.15, 0],
    palette.asphalt,
    {
      classification: "canon-feature-presentation-geometry",
      source: ["Chapter 2:57-67"],
    },
  );
  addBox(
    detectivePosition,
    "PRESENTATION_Surveillance_Closed_Shop",
    [7, 4.8, 6],
    [0, 2.25, -7],
    palette.grayBrick,
    {
      classification: "canon-business-type-presentation-architecture",
      source: ["Chapter 2:67"],
    },
  );
  addBox(
    detectivePosition,
    "PRESENTATION_Detective_Crown_Victoria",
    [4.8, 1.45, 2.05],
    [0, 0.85, 0],
    palette.metal,
    { rotationY: Math.PI / 2 },
  );
  detectivePosition.userData.targetNode = houseLandmark.nodeName;
}

function createCityPark() {
  const parkLandmark = landmarkById.get("city-park");
  const park = new Group();
  park.name = parkLandmark.nodeName;
  park.position.set(...parkLandmark.position);
  classify(park, parkLandmark.classification, parkLandmark.source);
  groups.Residential.add(park);
  addBox(park, "PRESENTATION_City_Park_Lawn", [27, 0.18, 20], [0, 0, 0], palette.grass);
  addBox(park, "PRESENTATION_City_Park_Path_NS", [2.2, 0.12, 18], [0, 0.14, 0], palette.concrete);
  addBox(park, "PRESENTATION_City_Park_Path_EW", [23, 0.12, 2.2], [0, 0.14, 0], palette.concrete);

  const circus = new Group();
  circus.name = "INFERRED_Labor_Day_Circus_Grounds";
  circus.position.set(4.8, 0.2, -1.8);
  classify(
    circus,
    "inferred-event-placement",
    ["Chapter 3:65", "Chapter 8:56"],
  );
  park.add(circus);

  [
    ["Main", [0, 0, 0], [5.1, 4.1, 5.1], [8.2, 2.2, 7]],
    ["Side", [7.4, 0, 3.4], [3.1, 2.9, 3.1], [5.2, 1.7, 4.5]],
  ].forEach(([label, position, canopyScale, bodySize]) => {
    const tent = new Group();
    tent.name = `PRESENTATION_Circus_Tent_${label}`;
    tent.position.set(...position);
    classify(tent, "presentation-event-geometry", ["Chapter 8:56"]);
    circus.add(tent);

    addBox(
      tent,
      `PRESENTATION_Circus_Tent_${label}_Canvas`,
      bodySize,
      [0, bodySize[1] / 2, 0],
      palette.tentCanvas,
      {
        classification: "presentation-event-geometry",
        source: ["Chapter 8:56"],
      },
    );
    const canopy = new Mesh(
      geometry("unit-circus-canopy", () => new ConeGeometry(1, 1, 16)),
      palette.redSiding,
    );
    canopy.name = `PRESENTATION_Circus_Tent_${label}_Canopy`;
    canopy.position.set(0, bodySize[1] + canopyScale[1] / 2, 0);
    canopy.scale.set(...canopyScale);
    classify(canopy, "presentation-event-geometry", ["Chapter 8:56"]);
    tent.add(canopy);
    addBox(
      tent,
      `PRESENTATION_Circus_Tent_${label}_Center_Pole`,
      [0.15, bodySize[1] + canopyScale[1] + 1.2, 0.15],
      [0, (bodySize[1] + canopyScale[1] + 1.2) / 2, 0],
      palette.wood,
      {
        classification: "presentation-event-geometry",
        source: ["Chapter 8:56"],
      },
    );
  });
}

function createChalmersAndWoods() {
  const farmLandmark = landmarkById.get("chalmers-property");
  const farm = new Group();
  farm.name = farmLandmark.nodeName;
  farm.position.set(...farmLandmark.position);
  classify(farm, farmLandmark.classification, farmLandmark.source);
  groups.Chalmers_Farm.add(farm);
  createNamedHouse({
    parent: farm,
    name: "CANON_Chalmers_White_Farmhouse",
    position: [0, 0, 0],
    width: 11.5,
    depth: 10.5,
    floors: 2,
    bodyMaterial: palette.whiteSiding,
    roofMaterial: palette.roofRust,
    porchWidth: 9.5,
    classification: "canon-feature-presentation-architecture",
    source: ["Chapter 4:65"],
  });

  createFence(
    farm,
    "PRESENTATION_Chalmers_Field_Boundary",
    [
      [-34, -1, -19],
      [20, -1, -19],
      [20, -1, 14],
      [10, -1, 14],
      [7, -1, 14],
      [-34, -1, 14],
      [-34, -1, -19],
    ],
    1.2,
  );

  const bicycleRoute = plan.routes.find(
    (route) => route.name === "PATH_Boys_Bicycle_Route",
  );
  const pathPoints = bicycleRoute.points.map(([x, , z]) => [
    x,
    terrainHeight(x, z) + 0.12,
    z,
  ]);
  for (let index = 0; index < pathPoints.length - 1; index += 1) {
    const start = new Vector3(...pathPoints[index]);
    const end = new Vector3(...pathPoints[index + 1]);
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const length = start.distanceTo(end);
    const angle = Math.atan2(end.x - start.x, end.z - start.z);
    addBox(
      groups.Town_Ground,
      `PRESENTATION_Bicycle_Path_Segment_${index + 1}`,
      [1.35, 0.12, length],
      [midpoint.x, midpoint.y, midpoint.z],
      palette.wood,
      {
        rotationY: angle,
        classification: "canon-route-presentation-geometry",
        source: bicycleRoute.source,
      },
    );
  }

  const woodsThreshold = new Object3D();
  woodsThreshold.name = "CANON_Woods_Threshold";
  const [thresholdX, , thresholdZ] = pathPoints.at(-2);
  woodsThreshold.position.set(
    thresholdX,
    terrainHeight(thresholdX, thresholdZ),
    thresholdZ,
  );
  classify(woodsThreshold, "canon-feature-inferred-placement", [
    "Chapter 4:57-63",
  ]);
  groups.Woods.add(woodsThreshold);
}

function createRuins() {
  const ruinsLandmark = landmarkById.get("old-ruins");
  const ruins = new Group();
  ruins.name = ruinsLandmark.nodeName;
  ruins.position.set(...ruinsLandmark.position);
  classify(ruins, ruinsLandmark.classification, ruinsLandmark.source);
  groups.Ruins.add(ruins);
  const walls = [
    [-4.5, 2.4, 0, 0.8, 4.8, 9],
    [4.5, 1.7, 1.5, 0.7, 3.4, 6],
    [0, 1.2, -4, 9, 2.4, 0.7],
    [-1.5, 0.8, 4.3, 6, 1.6, 0.65],
  ];
  walls.forEach(([x, y, z, width, height, depth], index) =>
    addBox(
      ruins,
      `PRESENTATION_Old_Ruins_Ambiguous_Wall_${index + 1}`,
      [width, height, depth],
      [x, y, z],
      palette.industrial,
      {
        rotationY: (index - 1) * 0.11,
        classification: "canon-feature-presentation-architecture",
        source: ruinsLandmark.source,
      },
    ),
  );
  addBox(ruins, "PRESENTATION_Ruins_Fallen_Slab", [7, 0.6, 3], [1, 0.4, 1], palette.concrete, {
    rotationY: 0.37,
  });
}

function createLightingProxies() {
  const jackiesWindowPosition = landmarkById.get("jackies-window").position;
  const bakeryPosition = landmarkById.get("bakery-storefront").position;
  const abbyPosition = landmarkById.get("abbys-apartment").position;
  const cathedralPosition = landmarkById.get("st-thomas").position;
  const policePosition = landmarkById.get("police-station").position;
  const lights = [
    ["PRESENTATION_Light_Bakery", [bakeryPosition[0], bakeryPosition[1] + 4, bakeryPosition[2]], 0xd69050, 42, 22],
    ["PRESENTATION_Light_Abby", [abbyPosition[0], abbyPosition[1] + 13, abbyPosition[2]], 0xd59b61, 30, 18],
    ["PRESENTATION_Light_Jackie", jackiesWindowPosition, 0xd17b4c, 36, 20],
    ["PRESENTATION_Light_Cathedral", [cathedralPosition[0], cathedralPosition[1] + 9.4, cathedralPosition[2]], 0x7c668f, 44, 25],
    ["PRESENTATION_Light_Police", [policePosition[0], policePosition[1] + 4, policePosition[2] - 4], 0x8ca2a8, 28, 19],
  ];
  lights.forEach(([name, position, color, intensity, distance]) => {
    const light = new PointLight(color, intensity, distance, 2);
    light.name = name;
    light.position.set(...position);
    classify(light, "presentation-lighting-proxy");
    groups.Lighting_Proxies.add(light);
  });
}

function createAuthoredCameras() {
  for (const cameraDefinition of plan.cameras) {
    const camera = new PerspectiveCamera(44, 16 / 9, 0.1, 1_200);
    camera.name = cameraDefinition.name;
    camera.position.set(...cameraDefinition.position);
    camera.lookAt(new Vector3(...cameraDefinition.target));
    camera.userData = {
      classification: "authored-presentation-camera",
      label: cameraDefinition.label,
      target: cameraDefinition.target,
      source: cameraDefinition.source,
    };
    groups.Authored_Cameras.add(camera);
  }
}

function createAuthoredPaths() {
  for (const route of plan.routes) {
    const routeGroup = new Group();
    routeGroup.name = route.name;
    routeGroup.userData = {
      classification: route.classification,
      presentationDefault: "hidden",
      points: route.points,
      source: route.source ?? [],
    };
    groups.Authored_Paths.add(routeGroup);

    route.points.forEach((point, index) => {
      const waypoint = new Object3D();
      waypoint.name = `${route.name}_Waypoint_${String(index + 1).padStart(2, "0")}`;
      waypoint.position.set(...point);
      waypoint.userData = {
        classification: "route-waypoint",
        sequence: index + 1,
        source: route.source ?? [],
      };
      routeGroup.add(waypoint);
    });
  }
}

function createLandmarkReferences() {
  for (const landmark of plan.landmarks) {
    const reference = new Object3D();
    reference.name = `LANDMARK_REF_${landmark.id.replaceAll("-", "_")}`;
    reference.position.set(...landmark.position);
    reference.userData = {
      classification: "landmark-reference",
      targetNode: landmark.nodeName,
      sourceClassification: landmark.classification,
      source: landmark.source,
      publicInteraction: false,
    };
    groups.Landmarks.add(reference);
  }
}

assertNamedBuildingClearance();
createTerrain();
createRiver();
createStreetGrid();
createResidentialInstances();
createVegetation();
createDowntown();
createCathedral();
createNewBeginnings();
createAbbyDistrict();
createParadeDistrict();
createPoliceDistrict();
createCityPark();
createChalmersAndWoods();
createRuins();
createLightingProxies();
createAuthoredCameras();
createAuthoredPaths();
createLandmarkReferences();

scene.updateMatrixWorld(true);

const exporter = new GLTFExporter();
const arrayBuffer = await exporter.parseAsync(scene, {
  binary: true,
  onlyVisible: true,
  trs: true,
  includeCustomExtensions: false,
});
const model = Buffer.from(arrayBuffer);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, model);

const hash = createHash("sha256").update(model).digest("hex");
console.log(
  [
    `Generated ${plan.id}.`,
    `${model.length} bytes`,
    `SHA256 ${hash}`,
    `${geometryCache.size} shared geometries`,
  ].join(" · "),
);
