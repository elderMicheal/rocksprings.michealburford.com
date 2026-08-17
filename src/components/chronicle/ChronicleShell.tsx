import { publicationPackage, publishedChronicles } from "../../content/publication";
import { EditionHeader } from "./EditionHeader";
import { LeadStory } from "./LeadStory";
import { TownMapPanel } from "./TownMapPanel";

const books = [1, 2, 3, 4, 5, 6] as const;

export function ChronicleShell() {
  return (
    <main className="newsletter-page" id="main-content">
      <div className="newsletter-paper">
        <div className="newsletter-grid">
          <EditionHeader />

          <section className="newsletter-box newsletter-top-story" aria-label="Top story">
            <LeadStory />
          </section>

          <section className="newsletter-box newsletter-map-exhibit" aria-label="Map exhibit">
            <TownMapPanel />
          </section>

          <a className="newsletter-box newsletter-ad-banner" href="/read/jackies-window/part-1">
            <span className="newsletter-ad-kicker">Keep your own copy.</span>
            <strong>Read the current Rock Springs record</strong>
            <span>Part One is available now →</span>
          </a>

          <section className="newsletter-box newsletter-introduction" aria-labelledby="newsletter-introduction-title">
            <p className="newsletter-section-kicker">About this publication</p>
            <h2 id="newsletter-introduction-title">The Rock Springs Chronicles</h2>
            <div className="newsletter-intro-columns">
              <p>
                A serialized record of Rock Springs, its people, its places, and the events surrounding them.
                The front page changes as the written record grows.
              </p>
              <p>
                Book {publishedChronicles[0]?.sequence.book ?? 1}, Part {publishedChronicles[0]?.sequence.part ?? 1}
                currently contains {publishedChronicles.length} published chapter{publishedChronicles.length === 1 ? "" : "s"}.
                The writing repository remains the source of truth for the published material.
              </p>
            </div>
            <p className="newsletter-source-line">
              Source revision: {publicationPackage.manifest.sourceRevision.slice(0, 12)}
            </p>
          </section>

          <nav className="newsletter-box newsletter-archive-menu" aria-label="Archive">
            <p className="newsletter-section-kicker">Archive</p>
            <a href="/archive">Archive</a>
            <a href="/world#characters">Characters</a>
            <a href="/world#events">Events</a>
            <a href="/world#locations">Locations</a>
          </nav>

          <section className="newsletter-box newsletter-books-sidebar" aria-labelledby="newsletter-books-title">
            <p className="newsletter-section-kicker" id="newsletter-books-title">The Books</p>
            <div className="newsletter-book-list">
              {books.map((book) => (
                <a
                  className={book === 1 ? "is-current" : undefined}
                  href={book === 1 ? "/read/jackies-window/part-1" : "#"}
                  key={book}
                  aria-disabled={book === 1 ? undefined : true}
                >
                  <span>Book</span>
                  <strong>{book}</strong>
                </a>
              ))}
            </div>
          </section>

          <a className="newsletter-box newsletter-anthologies" href="/archive#anthologies">
            <span>Anthologies</span>
            <span>&amp;</span>
            <span>Shorts</span>
          </a>
        </div>
      </div>
    </main>
  );
}
