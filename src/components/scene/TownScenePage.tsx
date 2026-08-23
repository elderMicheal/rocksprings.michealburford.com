import { ExhibitScene } from "../chronicle/ExhibitScene";

export function TownScenePage() {
  return (
    <div className="town-scene-page">
      <main id="main-content" className="town-scene-main">
        <header className="town-scene-header">
          <p className="reader-kicker">Shared spatial record</p>
          <h1>Rock Springs</h1>
          <p>
            The two-dimensional diagram and this interactive scene are generated
            from one evidence model. Confirmed geography and city character come
            from the canonical writing; unstated coordinates and dimensions remain
            interpretive.
          </p>
          <nav aria-label="Map page links">
            <a className="reader-primary-link" href="/">
              ← Front page
            </a>
            <a className="reader-primary-link" href="/read/jackies-window/part-1">
              Read Part One →
            </a>
          </nav>
        </header>

        <ExhibitScene />

        <p className="town-scene-evidence-note">
          The map may use derived geographic facts from canonical unpublished
          material. No unpublished manuscript prose is included in this application.
        </p>
      </main>
    </div>
  );
}
