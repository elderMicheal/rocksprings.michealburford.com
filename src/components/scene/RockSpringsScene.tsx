import { useEffect, useRef, useState } from "react";
import type {
  AutoMotionState,
  SceneManifest,
  ScenePhase,
  TownSceneRuntime,
} from "../../scenes/sceneTypes";

const manifestUrl = "/assets/scenes/jackies-window/scene-manifest.json";

function isSceneManifest(value: unknown): value is SceneManifest {
  if (!value || typeof value !== "object") return false;
  const manifest = value as Partial<SceneManifest>;
  return (
    manifest.schemaVersion === 1 &&
    typeof manifest.model?.url === "string" &&
    manifest.fallback?.kind === "neutral" &&
    typeof manifest.fallback?.alt === "string" &&
    manifest.provenance?.classification === "generated-presentation-media" &&
    Array.isArray(manifest.authoredViews) &&
    manifest.authoredViews.every(
      (view) =>
        typeof view.cameraNode === "string" &&
        typeof view.label === "string" &&
        Array.isArray(view.sourceReferences) &&
        view.sourceReferences.length > 0,
    ) &&
    typeof manifest.descent?.startCameraNode === "string" &&
    typeof manifest.descent?.endCameraNode === "string" &&
    Array.isArray(manifest.anchors)
  );
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function RockSpringsScene() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<TownSceneRuntime | undefined>(undefined);
  const [manifest, setManifest] = useState<SceneManifest>();
  const [shouldLoad, setShouldLoad] = useState(false);
  const [phase, setPhase] = useState<ScenePhase>("idle");
  const [message, setMessage] = useState("Interactive scene not loaded");
  const [autoMotion, setAutoMotion] = useState<AutoMotionState>("pending");
  const [selectedView, setSelectedView] = useState("Camera_Town_Overview");
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "400px" },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    setFullscreenSupported(
      Boolean(document.fullscreenEnabled && root.requestFullscreen),
    );
    const handleFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === root);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;

    const abortController = new AbortController();
    let cancelled = false;

    async function initialize() {
      const root = rootRef.current;
      const canvas = canvasRef.current;
      if (!root || !canvas) return;

      try {
        setPhase("loading");
        setMessage("Preparing interactive town view…");
        const response = await fetch(manifestUrl, { signal: abortController.signal });
        if (!response.ok) throw new Error("Scene manifest unavailable");

        const candidate: unknown = await response.json();
        if (!isSceneManifest(candidate)) throw new Error("Scene manifest is invalid");
        if (candidate.canon.publicLandmarks || candidate.anchors.length > 0) {
          throw new Error("Unapproved public scene anchors are configured");
        }

        setManifest(candidate);
        const { createTownScene } = await import("../../scenes/createTownScene");
        const runtime = await createTownScene({
          canvas,
          container: root,
          modelUrl: candidate.model.url,
          authoredViewNames: candidate.authoredViews.map((view) => view.cameraNode),
          descent: candidate.descent,
          reducedMotion: prefersReducedMotion(),
          onStatus: (status) => {
            if (cancelled) return;
            setPhase(status.phase);
            setMessage(status.message);
          },
          onAutoMotion: (state) => {
            if (!cancelled) setAutoMotion(state);
          },
        });

        if (cancelled) {
          runtime.dispose();
        } else {
          runtimeRef.current = runtime;
          setSelectedView(
            candidate.authoredViews[0]?.cameraNode ?? "Camera_Town_Overview",
          );
        }
      } catch (error) {
        if (cancelled || abortController.signal.aborted) return;
        setPhase("error");
        setMessage(error instanceof Error ? error.message : "Interactive view unavailable");
        setAutoMotion("skipped");
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      abortController.abort();
      runtimeRef.current?.dispose();
      runtimeRef.current = undefined;
    };
  }, [shouldLoad]);

  const fallbackAlt =
    manifest?.fallback.alt ?? "Neutral background behind the interpretive scene";
  const ready = phase === "ready";

  async function toggleFullscreen() {
    const root = rootRef.current;
    if (!root || !fullscreenSupported) return;

    try {
      if (document.fullscreenElement === root) {
        await document.exitFullscreen();
      } else {
        await root.requestFullscreen();
      }
    } catch {
      setMessage("Full-screen view unavailable");
    }
  }

  return (
    <div
      className={`town-scene-runtime scene-${phase}`}
      data-auto-motion={autoMotion}
      data-fullscreen={fullscreen}
      data-scene-phase={phase}
      data-scene-view={selectedView}
      ref={rootRef}
    >
      <div
        aria-label={ready ? undefined : fallbackAlt}
        aria-hidden={ready || undefined}
        className="scene-fallback"
        role={ready ? undefined : "img"}
      />
      <canvas
        aria-label="Interactive interpretive visualization of Rock Springs"
        className="scene-canvas"
        ref={canvasRef}
        role="img"
      />
      <p aria-live="polite" className="scene-load-status">{message}</p>
      <div className="scene-controls" id="scene-controls">
        <label className="scene-view-control">
          <span>View</span>
          <select
            aria-label="Town viewpoint"
            disabled={!ready}
            onChange={(event) => {
              const cameraNode = event.target.value;
              setSelectedView(cameraNode);
              runtimeRef.current?.setView(cameraNode);
            }}
            value={selectedView}
          >
            {(manifest?.authoredViews ?? []).map((view) => (
              <option key={view.cameraNode} value={view.cameraNode}>
                {view.label}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={!ready}
          onClick={() => runtimeRef.current?.reset()}
          type="button"
        >
          Reset view
        </button>
        <button
          disabled={!ready}
          onClick={() => runtimeRef.current?.replay()}
          type="button"
        >
          Replay descent
        </button>
        <button
          aria-pressed={fullscreen}
          disabled={!ready || !fullscreenSupported}
          onClick={() => void toggleFullscreen()}
          type="button"
        >
          {fullscreen ? "Exit full screen" : "Full screen"}
        </button>
      </div>
    </div>
  );
}
