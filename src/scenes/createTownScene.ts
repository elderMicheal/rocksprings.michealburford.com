import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  Mesh,
  PerspectiveCamera,
  PointLight,
  Scene,
  Sphere,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import type { BufferGeometry, Material, Object3D } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type {
  AutoMotionState,
  TownSceneRuntime,
  TownSceneStatus,
} from "./sceneTypes";

interface CreateTownSceneOptions {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  modelUrl: string;
  authoredViewNames: string[];
  descent: {
    startCameraNode: string;
    endCameraNode: string;
  };
  reducedMotion: boolean;
  onStatus(status: TownSceneStatus): void;
  onAutoMotion(state: AutoMotionState): void;
}

const TOUR_DURATION = 5_200;
const VIEW_TRANSITION_DURATION = 900;

interface CameraPose {
  position: Vector3;
  target: Vector3;
}

function disposeObject(root: Object3D) {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();

  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    geometries.add(object.geometry);
    const meshMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    meshMaterials.forEach((material) => materials.add(material));
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

export async function createTownScene({
  canvas,
  container,
  modelUrl,
  authoredViewNames,
  descent,
  reducedMotion,
  onStatus,
  onAutoMotion,
}: CreateTownSceneOptions): Promise<TownSceneRuntime> {
  let renderer: WebGLRenderer;

  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch {
    throw new Error("WebGL is unavailable");
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.34;

  const scene = new Scene();
  scene.background = new Color(0x071012);
  scene.fog = new FogExp2(0x071012, 0.00115);

  const camera = new PerspectiveCamera(48, 1, 0.1, 2_000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.maxPolarAngle = Math.PI * 0.48;

  const hemisphere = new HemisphereLight(0xb8cdd0, 0x2a332d, 3.1);
  const moon = new DirectionalLight(0xcadede, 4.1);
  moon.position.set(-100, 160, 80);
  const warm = new PointLight(0xd69a55, 2_800, 280, 1.7);
  warm.position.set(235, 48, 107);
  scene.add(hemisphere, moon, warm);

  let disposed = false;
  let visible = true;
  let frame = 0;
  let tourStart = 0;
  let motionDuration = TOUR_DURATION;
  let completesAutoMotion = false;
  let model: Object3D | undefined;
  let startPosition = new Vector3();
  let endPosition = new Vector3();
  let resetPosition = new Vector3();
  let startTarget = new Vector3();
  let endTarget = new Vector3();
  let resetTarget = new Vector3();
  let descentStartPose: CameraPose | undefined;
  let descentEndPose: CameraPose | undefined;
  const viewPoses = new Map<string, CameraPose>();

  function render() {
    if (!disposed && visible) renderer.render(scene, camera);
  }

  function resize() {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  }

  function stopTour() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function tourFrame(time: number) {
    if (disposed || !visible) {
      frame = 0;
      return;
    }

    const progress = Math.min((time - tourStart) / motionDuration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    camera.position.lerpVectors(startPosition, endPosition, eased);
    controls.target.lerpVectors(startTarget, endTarget, eased);
    camera.lookAt(controls.target);
    render();

    if (progress < 1) {
      frame = requestAnimationFrame(tourFrame);
    } else {
      frame = 0;
      controls.update();
      if (completesAutoMotion) onAutoMotion("completed");
      completesAutoMotion = false;
    }
  }

  function replay() {
    if (!model || disposed || !descentStartPose || !descentEndPose) return;
    stopTour();
    startPosition = descentStartPose.position.clone();
    startTarget = descentStartPose.target.clone();
    endPosition = descentEndPose.position.clone();
    endTarget = descentEndPose.target.clone();
    camera.position.copy(startPosition);
    controls.target.copy(startTarget);
    controls.update();
    motionDuration = TOUR_DURATION;
    completesAutoMotion = true;
    tourStart = performance.now();
    onAutoMotion("playing");
    frame = requestAnimationFrame(tourFrame);
  }

  function reset() {
    if (!model || disposed) return;
    stopTour();
    camera.position.copy(resetPosition);
    controls.target.copy(resetTarget);
    controls.update();
    render();
  }

  function setView(cameraNode: string) {
    if (!model || disposed) return;
    const pose = viewPoses.get(cameraNode);
    if (!pose) return;
    stopTour();
    onAutoMotion("completed");

    if (reducedMotion) {
      camera.position.copy(pose.position);
      controls.target.copy(pose.target);
      controls.update();
      render();
      return;
    }

    startPosition = camera.position.clone();
    startTarget = controls.target.clone();
    endPosition = pose.position.clone();
    endTarget = pose.target.clone();
    motionDuration = VIEW_TRANSITION_DURATION;
    completesAutoMotion = false;
    tourStart = performance.now();
    frame = requestAnimationFrame(tourFrame);
  }

  const onControlsChange = () => render();
  const onContextLost = (event: Event) => {
    event.preventDefault();
    stopTour();
    onStatus({ phase: "error", message: "Interactive view unavailable" });
  };
  const onContextRestored = () => {
    onStatus({ phase: "ready", message: "Interactive view restored" });
    resize();
  };

  controls.addEventListener("change", onControlsChange);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        stopTour();
      } else {
        resize();
      }
    },
    { threshold: 0.01 },
  );
  intersectionObserver.observe(container);

  function dispose() {
    if (disposed) return;
    disposed = true;
    stopTour();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    controls.removeEventListener("change", onControlsChange);
    controls.dispose();
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);

    if (model) disposeObject(model);

    renderer.dispose();
    renderer.forceContextLoss();
  }

  try {
    onStatus({ phase: "loading", message: "Loading interactive town view…" });
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(modelUrl, (event) => {
      if (!event.total) return;
      const percent = Math.min(Math.round((event.loaded / event.total) * 100), 100);
      onStatus({ phase: "loading", message: `Loading interactive town view… ${percent}%` });
    });

    if (disposed) {
      disposeObject(gltf.scene);
      throw new Error("Scene initialization was cancelled");
    }

    model = gltf.scene;
    scene.add(model);

    const bounds = new Box3().setFromObject(model);
    const center = bounds.getCenter(new Vector3());
    const radius = Math.max(bounds.getBoundingSphere(new Sphere()).radius, 1);

    for (const cameraNode of [
      ...authoredViewNames,
      descent.startCameraNode,
      descent.endCameraNode,
    ]) {
      const authoredCamera = model.getObjectByName(cameraNode);
      if (!(authoredCamera instanceof PerspectiveCamera)) continue;
      const target = authoredCamera.userData.target;
      if (
        !Array.isArray(target) ||
        target.length !== 3 ||
        !target.every((value) => typeof value === "number")
      ) {
        continue;
      }
      viewPoses.set(cameraNode, {
        position: authoredCamera.getWorldPosition(new Vector3()),
        target: new Vector3(target[0], target[1], target[2]),
      });
    }

    const fallbackStart: CameraPose = {
      position: center
        .clone()
        .add(new Vector3(radius * 1.35, radius * 1.3, radius * 1.85)),
      target: center.clone(),
    };
    const fallbackEnd: CameraPose = {
      position: center
        .clone()
        .add(new Vector3(radius * 0.96, radius * 0.7, radius * 1.2)),
      target: center.clone().add(new Vector3(radius * 0.08, radius * 0.03, 0)),
    };
    descentStartPose =
      viewPoses.get(descent.startCameraNode) ?? fallbackStart;
    descentEndPose = viewPoses.get(descent.endCameraNode) ?? fallbackEnd;
    const resetPose = viewPoses.get(authoredViewNames[0]) ?? descentEndPose;

    startPosition = descentStartPose.position.clone();
    startTarget = descentStartPose.target.clone();
    endPosition = descentEndPose.position.clone();
    endTarget = descentEndPose.target.clone();
    resetPosition = resetPose.position.clone();
    resetTarget = resetPose.target.clone();

    controls.minDistance = radius * 0.18;
    controls.maxDistance = radius * 3;
    camera.near = Math.max(radius / 2_000, 0.1);
    camera.far = radius * 12;
    camera.updateProjectionMatrix();

    if (reducedMotion) {
      camera.position.copy(endPosition);
      controls.target.copy(endTarget);
      controls.update();
      onAutoMotion("skipped");
    } else {
      camera.position.copy(startPosition);
      controls.target.copy(startTarget);
      controls.update();
    }

    resize();
    onStatus({ phase: "ready", message: "Interactive view ready" });

    if (!reducedMotion) replay();

    return { replay, reset, setView, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
