import { RockSpringsScene } from "./RockSpringsScene";

export function TownScenePage() {
  return (
    <div className="reader-frame">
      <main id="main-content" className="reader-main">
        <div className="town-scene-page">
          <section className="reader-hero" aria-labelledby="town-scene-title">
            <p className="reader-kicker">Spatial evidence</p>
            <h2 id="town-scene-title">Interactive Rock Springs map</h2>
            <p className="reader-introduction">
              A source-traced, interpretive 3D view generated from the approved
              Part One writing. Stated distances and relationships are preserved;
              unstated coordinates, bearings, and architecture remain presentation
              choices.
            </p>
            <nav className="town-scene-page-links" aria-label="Spatial record links">
              <a className="reader-primary-link" href="/">
                ← Back to the Chronicle
              </a>
              <a className="reader-primary-link" href="/read/jackies-window/part-1">
                Read the source →
              </a>
            </nav>
          </section>
          <section
            className="exhibit-scene town-scene-page-exhibit"
            aria-label="Interactive Rock Springs spatial evidence"
          >
            <RockSpringsScene />
          </section>
        </div>
      </main>
    </div>
  );
}
