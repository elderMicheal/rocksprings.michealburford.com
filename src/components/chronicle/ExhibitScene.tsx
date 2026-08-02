import { useState } from "react";
import { RockSpringsScene } from "../scene/RockSpringsScene";

export function ExhibitScene() {
  const [entered, setEntered] = useState(false);

  function enterScene() {
    setEntered(true);
    window.requestAnimationFrame(() => {
      const viewpoint = document
        .getElementById("scene-controls")
        ?.querySelector("select") as { focus(): void } | null;
      viewpoint?.focus();
    });
  }

  return (
    <section
      className={`exhibit-scene${entered ? " scene-entered" : ""}`}
      aria-labelledby="scene-title"
    >
      <RockSpringsScene />
      <div className="scene-shade" aria-hidden="true" />
      <div className="scene-copy">
        <p className="eyebrow"><span aria-hidden="true">◇</span> Chapters 1–8 · Interpretive scene</p>
        <h2 id="scene-title">Rock Springs in Part One</h2>
        <p>View spatial relationships stated in Part One, then read the source chapters.</p>
        <button
          className="exhibit-action"
          onClick={enterScene}
          type="button"
        >
          Enter the view <span aria-hidden="true">↓</span>
        </button>
      </div>
      <p className="scene-status">Interpretive visualization <span>·</span> No canonical coordinates</p>
    </section>
  );
}
