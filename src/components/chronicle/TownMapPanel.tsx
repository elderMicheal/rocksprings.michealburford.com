import spatialPlanJson from "../../../scene-data/jackies-window-spatial-plan.json";

type Point3 = [number, number, number];

interface SpatialPlan {
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

const spatialPlan = spatialPlanJson as unknown as SpatialPlan;
const mapWidth = 1_000;
const mapHeight = 1_054;
const mapPadding = 42;
const landmarkById = new Map(
  spatialPlan.landmarks.map((landmark) => [landmark.id, landmark]),
);
const roadById = new Map(spatialPlan.roads.map((road) => [road.id, road]));
const routeByName = new Map(
  spatialPlan.routes.map((route) => [route.name, route]),
);

function mapPoint(x: number, z: number) {
  const { minX, maxX, minZ, maxZ } = spatialPlan.map2d.extent;
  const drawableWidth = mapWidth - mapPadding * 2;
  const drawableHeight = mapHeight - mapPadding * 2;
  return {
    x: mapPadding + ((x - minX) / (maxX - minX)) * drawableWidth,
    y: mapPadding + ((maxZ - z) / (maxZ - minZ)) * drawableHeight,
  };
}

function roadPosition(road: SpatialPlan["roads"][number]) {
  if (road.landmarkId) {
    const landmark = landmarkById.get(road.landmarkId);
    if (!landmark) throw new Error(`Missing road landmark ${road.landmarkId}`);
    return landmark.position;
  }
  if (!road.position) throw new Error(`Road ${road.id} has no position`);
  return road.position;
}

function roadLine(road: SpatialPlan["roads"][number]) {
  const [centerX, , centerZ] = roadPosition(road);
  const halfLength = road.length / 2;
  const start =
    road.axis === "x"
      ? mapPoint(centerX - halfLength, centerZ)
      : mapPoint(centerX, centerZ - halfLength);
  const end =
    road.axis === "x"
      ? mapPoint(centerX + halfLength, centerZ)
      : mapPoint(centerX, centerZ + halfLength);
  return { start, end };
}

export function TownMapPanel() {
  const river = landmarkById.get("river");
  if (!river) throw new Error("The spatial plan is missing the river");
  const riverWest = mapPoint(spatialPlan.map2d.extent.minX, river.position[2]);
  const riverEast = mapPoint(spatialPlan.map2d.extent.maxX, river.position[2]);

  return (
    <section
      className="map-panel"
      aria-labelledby="map-title"
      data-writing-revision={spatialPlan.source.writingRevision}
    >
      <header className="module-heading">
        <div>
          <p className="eyebrow">Manuscript evidence</p>
          <h2 id="map-title">{spatialPlan.map2d.title}</h2>
        </div>
        <a href="/read/jackies-window/part-1">Read source →</a>
      </header>
      <p className="map-note">{spatialPlan.map2d.description}</p>
      <svg
        className="town-map"
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        role="img"
        aria-labelledby="town-map-svg-title town-map-svg-description"
      >
        <title id="town-map-svg-title">{spatialPlan.map2d.title}</title>
        <desc id="town-map-svg-description">
          A topological evidence diagram generated from the same source-traced
          plan as the three-dimensional scene. It distinguishes source-relative
          relationships from inferred positions without asserting exact geography.
        </desc>
        <defs>
          <pattern
            id="map-grid"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path d="M 28 0 L 0 0 0 28" className="map-grid-line" />
          </pattern>
          <filter id="map-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={mapWidth} height={mapHeight} className="map-ground" />
        <rect width={mapWidth} height={mapHeight} fill="url(#map-grid)" />

        <path
          className="map-river"
          d={`M ${riverWest.x - 20} ${riverWest.y + 5}
              C 260 ${riverWest.y - 18}, 710 ${riverWest.y + 22},
                ${riverEast.x + 20} ${riverEast.y - 4}`}
        />
        <text x={mapWidth - 126} y={riverEast.y - 13} className="map-water-label">
          River
        </text>

        {spatialPlan.map2d.roads.map((roadId) => {
          const road = roadById.get(roadId);
          if (!road) return null;
          const { start, end } = roadLine(road);
          return (
            <line
              className={`map-road map-road-${road.id}`}
              key={road.id}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
            />
          );
        })}

        {spatialPlan.map2d.routes.map((routeName) => {
          const route = routeByName.get(routeName);
          if (!route) return null;
          const points = route.points
            .map(([x, , z]) => {
              const point = mapPoint(x, z);
              return `${point.x},${point.y}`;
            })
            .join(" ");
          return (
            <polyline
              className={`map-route map-route-${route.name
                .replace(/^PATH_/, "")
                .toLowerCase()}`}
              key={route.name}
              points={points}
            />
          );
        })}

        {spatialPlan.map2d.landmarks.map((marker) => {
          const landmark = landmarkById.get(marker.id);
          if (!landmark) return null;
          const point = mapPoint(landmark.position[0], landmark.position[2]);
          return (
            <g
              className={`map-marker map-marker-${marker.confidence}`}
              key={marker.id}
              transform={`translate(${point.x} ${point.y})`}
            >
              <circle r="11" filter="url(#map-glow)" />
              <circle r="3.8" className="map-marker-core" />
              <text
                x={marker.labelOffset[0]}
                y={marker.labelOffset[1]}
                textAnchor={marker.labelOffset[0] < 0 ? "end" : "start"}
              >
                {marker.label}
              </text>
            </g>
          );
        })}

        <g className="map-north" transform={`translate(${mapWidth - 56} 54)`}>
          <path d="M 0 20 L 0 -14 M -6 -3 L 0 -14 L 6 -3" />
          <text x="0" y="37" textAnchor="middle">
            N
          </text>
        </g>
      </svg>
      <p className="map-legend">
        <span><i className="legend-relative" /> Source-relative placement</span>
        <span><i className="legend-inferred" /> Inferred bearing or position</span>
        <span><i className="legend-route" /> Source-supported relationship</span>
      </p>
    </section>
  );
}
