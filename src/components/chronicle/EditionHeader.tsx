import { publicationPackage, publishedChronicles } from "../../content/publication";

export function EditionHeader() {
  const firstChronicle = publishedChronicles[0];
  const book = firstChronicle?.sequence.book ?? 1;
  const part = firstChronicle?.sequence.part ?? 1;

  return (
    <>
      <div className="newsletter-box newsletter-tbd newsletter-tbd-1">
        <span>Independent</span>
        <strong>Record</strong>
      </div>

      <div className="newsletter-box newsletter-tbd newsletter-tbd-2">
        <span>Book {book}</span>
        <strong>Part {part}</strong>
      </div>

      <header className="newsletter-box newsletter-header-main">
        <p>The</p>
        <h1>{publicationPackage.manifest.world.title}</h1>
        <span>Rock Springs, Illinois</span>
      </header>

      <div className="newsletter-box newsletter-tbd newsletter-tbd-3">
        <span>Published</span>
        <strong>{publishedChronicles.length}</strong>
        <span>Chapters</span>
      </div>

      <div className="newsletter-box newsletter-tbd newsletter-tbd-4">
        <span>Source</span>
        <strong>{publicationPackage.manifest.sourceRevision.slice(0, 6)}</strong>
      </div>
    </>
  );
}
