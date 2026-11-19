import { publicationPackage } from "../../content/publication";

export function ChronicleFooter() {
  return (
    <footer className="series-footer">
      <div>
        <strong>The Rock Springs Chronicles</strong>
        <p>Fiction by Micheal Burford</p>
        <small>
          © {new Date().getFullYear()} Micheal Burford. All rights reserved.
        </small>
      </div>
      <nav aria-label="Footer navigation">
        <a href="/#library">The books</a>
        <a href="/map">Explore the town</a>
        <a href="https://www.michealburford.com">Author website ↗</a>
      </nav>
      <details>
        <summary>Publication information</summary>
        <p>
          Approved working-draft text. Interpretive exhibits are labelled
          separately.
        </p>
        <small>
          Source revision{" "}
          {publicationPackage.manifest.sourceRevision.slice(0, 12)}
        </small>
      </details>
    </footer>
  );
}
