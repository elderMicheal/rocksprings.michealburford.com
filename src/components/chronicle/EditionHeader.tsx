import { publicationPackage, publishedChronicles } from "../../content/publication";

const navigation = [
  ["Front Page", "/"],
  ["Part One", "/read/jackies-window/part-1"],
] as const;

export function EditionHeader({ currentSection = "/" }: { currentSection?: string }) {
  const firstChronicle = publishedChronicles[0];
  const sealInitials = publicationPackage.manifest.world.title
    .split(/\s+/)
    .filter((word) => word.toLowerCase() !== "the")
    .map((word) => word[0])
    .join("");

  return (
    <>
      <header className="edition-header">
        <a className="chronicle-seal" href="/" aria-label={`${publicationPackage.manifest.world.title} home`}>
          <span>The written</span>
          <strong>{sealInitials}</strong>
          <span>Record</span>
        </a>
        <p className="publication-promise">
          <em>Reader.</em>
          <em>Exhibit.</em>
          <em>Source-traced.</em>
        </p>
        <div className="masthead">
          <h1>{publicationPackage.manifest.world.title}</h1>
          <p>Reader and interpretive exhibit</p>
        </div>
        <dl className="edition-details">
          <div><dt>Book</dt><dd>{firstChronicle.sequence.book}</dd></div>
          <div><dt>Part</dt><dd>{firstChronicle.sequence.part}</dd></div>
          <div><dt>Published chapters</dt><dd>{publishedChronicles.length}</dd></div>
          <div><dt>Source revision</dt><dd>{publicationPackage.manifest.sourceRevision.slice(0, 12)}</dd></div>
        </dl>
      </header>
      <nav className="primary-navigation" aria-label="Chronicle sections">
        <div className="nav-links">
          {navigation.map(([label, href]) => (
            <a
              aria-current={href === currentSection ? "page" : undefined}
              href={href}
              key={label}
            >
              {label}
            </a>
          ))}
        </div>
        <a className="archive-search" href="/read/jackies-window/part-1">
          Read Part One <span aria-hidden="true">→</span>
        </a>
      </nav>
    </>
  );
}
