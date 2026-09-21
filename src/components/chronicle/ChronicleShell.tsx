import {
  defaultReaderPath,
  firstPublishedWork,
  firstReadableChronicle,
  publicationPackage,
  publishedChronicles,
  publishedWorks,
} from "../../content/publication";
import { LeadStory } from "./LeadStory";
import { TownMapPanel } from "./TownMapPanel";

function workPath(work: (typeof publishedWorks)[number]) {
  return work.sections[0]?.path ?? work.path;
}

function workBookNumber(work: (typeof publishedWorks)[number]) {
  const ids = new Set(work.entries.map((entry) => entry.id));
  return (
    publishedChronicles.find((entry) => ids.has(entry.id))?.sequence.book ??
    work.order
  );
}

export function ChronicleShell() {
  const sequence = firstReadableChronicle?.sequence ?? publishedChronicles[0]?.sequence;
  const defaultSection = firstPublishedWork?.sections[0];
  const novelWorks = publishedWorks.filter((work) => work.kind === "novel");
  const otherWorks = publishedWorks.filter((work) => work.kind !== "novel");
  const readerPath = defaultReaderPath();
  const workNoun = publishedWorks.length === 1 ? "work" : "works";
  const entryNoun = publishedChronicles.length === 1 ? "entry" : "entries";

  return (
    <div className="rsc-front-page">
      <main id="main-content" className="front-page-scroll">
        <div className="front-page-outer-frame">
          <div className="front-page-inner-frame">
            <div className="front-page-grid">
              <div className="front-page-box front-meta front-meta-1">
                <span>Independent</span>
                <strong>Record</strong>
              </div>

              <div className="front-page-box front-meta front-meta-2">
                <span>
                  {sequence?.book
                    ? "Book " + sequence.book
                    : firstPublishedWork?.kind ?? "Work"}
                </span>
                <strong>
                  {defaultSection?.navigationLabel ?? firstPublishedWork?.title ?? "—"}
                </strong>
              </div>

              <header className="front-page-box front-masthead">
                <span className="front-masthead-kicker">The</span>
                <h1>{publicationPackage.manifest.world.title}</h1>
                <span className="front-masthead-rule">A local written record</span>
              </header>

              <div className="front-page-box front-meta front-meta-3">
                <span>Published</span>
                <strong>{publishedChronicles.length}</strong>
                <span>Entries</span>
              </div>

              <div className="front-page-box front-meta front-meta-4">
                <span>Source</span>
                <strong>{publicationPackage.manifest.sourceRevision.slice(0, 6)}</strong>
              </div>

              <section className="front-page-box front-top-story" aria-label="Top story">
                <LeadStory />
              </section>

              <section className="front-page-box front-map-exhibit" aria-label="Map exhibit">
                <TownMapPanel />
              </section>

              <a className="front-page-box front-ad-banner" href={readerPath}>
                <span>Current written record</span>
                <strong>Read {firstPublishedWork?.title ?? "the record"}</strong>
                <span>Open {defaultSection?.navigationLabel ?? "reader"} →</span>
              </a>

              <section
                className="front-page-box front-introduction"
                aria-labelledby="front-introduction-title"
              >
                <p className="front-section-label">Introduction</p>
                <h2 id="front-introduction-title">The Rock Springs Chronicles</h2>
                <div className="front-introduction-copy">
                  <p>
                    The interactive world site for <em>The Rock Springs Chronicles</em>.
                    The writing repository remains the authoritative source for the
                    published Rock Springs material presented here.
                  </p>
                  <p>
                    The current public record contains {publishedWorks.length} published{" "}
                    {workNoun} with {publishedChronicles.length} approved {entryNoun}. The
                    front page draws from that revision-traced publication package and its
                    separately governed map data.
                  </p>
                </div>
                <p className="front-source-note">
                  Source revision {publicationPackage.manifest.sourceRevision.slice(0, 12)}
                </p>
              </section>

              <aside className="front-page-box front-archive" aria-label="Archive index">
                <p className="front-section-label">Archive</p>
                <div className="front-archive-list">
                  <span>Archive /</span>
                  <span>Characters /</span>
                  <span>Events /</span>
                  <span>Locations</span>
                </div>
              </aside>

              <aside className="front-page-box front-books" aria-label="Published books">
                <p className="front-section-label">Books</p>
                <div className="front-book-list">
                  {novelWorks.map((work) => (
                    <a href={workPath(work)} key={work.id}>
                      <span>Book</span>
                      <strong>{workBookNumber(work)}</strong>
                    </a>
                  ))}
                  {novelWorks.length === 0 ? (
                    <span className="front-book-unavailable">
                      <span>No published books</span>
                    </span>
                  ) : null}
                </div>
              </aside>

              <section
                className="front-page-box front-anthologies"
                aria-label="Anthologies and shorts"
              >
                <span>Anthologies</span>
                <span>&amp;</span>
                <span>Shorts</span>
                {otherWorks.map((work) => (
                  <a href={workPath(work)} key={work.id}>
                    {work.title}
                  </a>
                ))}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
