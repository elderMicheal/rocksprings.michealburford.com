import {
  defaultReaderPath,
  firstPublishedWork,
  publicationPackage,
  publishedChronicles,
  publishedWorks,
} from "../../content/publication";

const navigation = [
  ["Front Page", "/"],
  ...publishedWorks.flatMap((work) =>
    work.sections.length > 0
      ? work.sections.map((section) => [section.navigationLabel, section.path])
      : [[work.title, work.path]],
  ),
] as Array<[string, string]>;

export function EditionHeader({ currentSection = "/" }: { currentSection?: string }) {
  const sealInitials = publicationPackage.manifest.world.title
    .split(/\s+/)
    .filter((word) => word.toLowerCase() !== "the")
    .map((word) => word[0])
    .join("");
  const firstSection = firstPublishedWork?.sections[0];
  const primaryLabel =
    firstSection?.navigationLabel ?? firstPublishedWork?.title ?? "Written record";

  return (
    <>
      <header className="edition-header">
        <a
          className="chronicle-seal"
          href="/"
          aria-label={publicationPackage.manifest.world.title + " home"}
        >
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
          <div>
            <dt>Work</dt>
            <dd>{firstPublishedWork?.title ?? "—"}</dd>
          </div>
          <div>
            <dt>Section</dt>
            <dd>{firstSection?.navigationLabel ?? "Standalone"}</dd>
          </div>
          <div>
            <dt>Published entries</dt>
            <dd>{publishedChronicles.length}</dd>
          </div>
          <div>
            <dt>Source revision</dt>
            <dd>{publicationPackage.manifest.sourceRevision.slice(0, 12)}</dd>
          </div>
        </dl>
      </header>
      <nav className="primary-navigation" aria-label="Chronicle sections">
        <div className="nav-links">
          {navigation.map(([label, href]) => (
            <a
              aria-current={href === currentSection ? "page" : undefined}
              href={href}
              key={href}
            >
              {label}
            </a>
          ))}
        </div>
        <a className="archive-search" href={defaultReaderPath()}>
          Read {primaryLabel} <span aria-hidden="true">→</span>
        </a>
      </nav>
    </>
  );
}
