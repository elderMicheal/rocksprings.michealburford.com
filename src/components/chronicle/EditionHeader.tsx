import {
  defaultReaderPath,
  publicationPackage,
  publishedWorks,
} from "../../content/publication";

export function EditionHeader({
  currentSection = "/",
}: {
  currentSection?: string;
}) {
  return (
    <header className="series-header">
      <a
        className="series-brand"
        href="/"
        aria-label={publicationPackage.manifest.world.title + " home"}
      >
        <span aria-hidden="true">RSC</span>
        <div>
          The Rock Springs
          <br />
          <strong>Chronicles</strong>
        </div>
      </a>
      <nav aria-label="Chronicle sections">
        <a href="/" aria-current={currentSection === "/" ? "page" : undefined}>
          Home
        </a>
        <a href="/#library">The books</a>
        <a href="/map">Explore the town</a>
        <a
          className="series-read"
          href={
            publishedWorks.length
              ? defaultReaderPath()
              : "https://www.michealburford.com/#writing-monitor"
          }
        >
          {publishedWorks.length ? "Start reading →" : "Follow the writing ↗"}
        </a>
      </nav>
    </header>
  );
}
