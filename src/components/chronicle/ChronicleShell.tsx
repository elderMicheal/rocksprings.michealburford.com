import {
  firstReadableChronicle,
  publicationPackage,
  publishedChronicles,
} from "../../content/publication";
import { LeadStory } from "./LeadStory";
import { TownMapPanel } from "./TownMapPanel";

const books = [1, 2, 3, 4, 5, 6] as const;

export function ChronicleShell() {
  const sequence = firstReadableChronicle?.sequence ?? publishedChronicles[0]?.sequence;
  const book = sequence?.book ?? 1;
  const part = sequence?.part ?? 1;

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
                <span>Book {book}</span>
                <strong>Part {part}</strong>
              </div>

              <header className="front-page-box front-masthead">
                <span className="front-masthead-kicker">The</span>
                <h1>{publicationPackage.manifest.world.title}</h1>
                <span className="front-masthead-rule">A local written record</span>
              </header>

              <div className="front-page-box front-meta front-meta-3">
                <span>Published</span>
                <strong>{publishedChronicles.length}</strong>
                <span>Chapters</span>
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

              <a className="front-page-box front-ad-banner" href="/read/jackies-window/part-1">
                <span>Current written record</span>
                <strong>Read Book {book}, Part {part}</strong>
                <span>Open Part One →</span>
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
                    The current public record contains Book {book}, Part {part}, with{" "}
                    {publishedChronicles.length} published chapter
                    {publishedChronicles.length === 1 ? "" : "s"}. The front page draws
                    from that approved publication package and its source-traced map data.
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

              <aside className="front-page-box front-books" aria-label="Books">
                <p className="front-section-label">Books</p>
                <div className="front-book-list">
                  {books.map((bookNumber) =>
                    bookNumber === book ? (
                      <a href="/read/jackies-window/part-1" key={bookNumber}>
                        <span>Book</span>
                        <strong>{bookNumber}</strong>
                      </a>
                    ) : (
                      <span className="front-book-unavailable" key={bookNumber}>
                        <span>Book</span>
                        <strong>{bookNumber}</strong>
                      </span>
                    ),
                  )}
                </div>
              </aside>

              <section className="front-page-box front-anthologies" aria-label="Anthologies and shorts">
                <span>Anthologies</span>
                <span>&amp;</span>
                <span>Shorts</span>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
