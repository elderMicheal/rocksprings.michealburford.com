import {
  defaultReaderPath,
  entriesForWork,
  firstPublishedWork,
  firstReadableChronicle,
  publicationPackage,
  publishedWorks,
} from "../../content/publication";
import { EditionHeader } from "./EditionHeader";
import { ChronicleFooter } from "./ChronicleFooter";
import { TownMapPanel } from "./TownMapPanel";

export function ChronicleShell() {
  const hasReading = publishedWorks.length > 0;
  const excerpt = firstReadableChronicle?.presentation.excerpt;
  return (
    <div
      className="series-site"
      data-writing-revision={publicationPackage.manifest.sourceRevision}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <EditionHeader />
      <main id="main-content">
        <section className="series-hero">
          <div className="series-hero-copy">
            <p className="eyebrow">The fiction of Micheal Burford</p>
            <h1>
              The Rock Springs
              <br />
              <em>Chronicles</em>
            </h1>
            <p>
              A town to explore.
              <br />A story to step inside.
            </p>
            <div className="hero-actions">
              <a
                className="series-button"
                href={hasReading ? defaultReaderPath() : "/map"}
              >
                {hasReading ? "Start reading" : "Explore the town"}{" "}
                <span aria-hidden="true">→</span>
              </a>
              <a href="#library">Discover the books ↓</a>
            </div>
          </div>
          <a
            className="series-feature"
            href={hasReading ? defaultReaderPath() : "#library"}
            aria-label={
              "Explore " +
              (firstPublishedWork?.title ?? "The Rock Springs Chronicles")
            }
          >
            <div className="series-book">
              <small>The Rock Springs Chronicles</small>
              <strong>
                {firstPublishedWork?.title ?? "The Rock Springs Chronicles"}
              </strong>
              <span>Micheal Burford</span>
            </div>
            <span className="series-feature-label">
              {hasReading ? "The story begins here" : "A series in progress"}
            </span>
          </a>
        </section>
        <section
          className="series-library"
          id="library"
          aria-labelledby="library-title"
        >
          <div className="section-intro">
            <div>
              <p className="eyebrow">The library</p>
              <h2 id="library-title">
                {hasReading
                  ? "Choose your next chapter."
                  : "The next chapter is taking shape."}
              </h2>
            </div>
            <p>
              Read the published working drafts.
              <br />
              New writing appears as it is shared.
            </p>
          </div>
          <div className="series-books">
            {publishedWorks.map((work, index) => {
              const entries = entriesForWork(work);
              const words = entries.reduce(
                (sum, entry) => sum + entry.presentation.wordCount,
                0,
              );
              return (
                <a
                  className="series-work"
                  key={work.id}
                  href={work.sections[0]?.path ?? work.path}
                >
                  <div className={"library-book book-tone-" + (index % 3)}>
                    <small>The Rock Springs Chronicles</small>
                    <strong>{work.title}</strong>
                    <span>Micheal Burford</span>
                  </div>
                  <div className="work-copy">
                    <p className="eyebrow">{work.kind} · Working draft</p>
                    <h3>{work.title}</h3>
                    <p>
                      {entries.length} published{" "}
                      {entries.length === 1 ? "entry" : "entries"} ·{" "}
                      {Math.max(1, Math.ceil(words / 250))} min read
                    </p>
                    <span>Open book →</span>
                  </div>
                </a>
              );
            })}
          </div>
          {!publishedWorks.length && (
            <p className="library-empty">
              Public reading editions are being prepared. Follow the Writing
              Monitor for the latest progress.
            </p>
          )}
        </section>
        <section className="series-world" id="world">
          <div className="world-copy">
            <p className="eyebrow">Beyond the page</p>
            <h2>
              Find your way
              <br />
              through Rock Springs.
            </h2>
            <p>
              Explore the places and connections drawn from the writing in the
              interactive town exhibit.
            </p>
            <a className="series-button" href="/map">
              Explore the town ↗
            </a>
            <small>
              The map distinguishes source-supported locations from inferred
              placement.
            </small>
          </div>
          <TownMapPanel />
        </section>
        {excerpt && (
          <section className="series-excerpt">
            <p className="eyebrow">
              From {firstReadableChronicle?.sequence.bookTitle}
            </p>
            <blockquote>{excerpt}</blockquote>
            <a href={defaultReaderPath()}>Continue reading →</a>
          </section>
        )}
        <section className="author-connection">
          <div>
            <p className="eyebrow">Behind the stories</p>
            <h2>Micheal Burford</h2>
            <p>Follow the writing and the work in progress.</p>
          </div>
          <a href="https://www.michealburford.com/#writing-monitor">
            Visit the author’s Writing Monitor ↗
          </a>
        </section>
      </main>
      <ChronicleFooter />
    </div>
  );
}
