import {
  defaultReaderPath,
  firstPublishedWork,
  publicationPackage,
} from "../../content/publication";

export function ChronicleFooter() {
  const firstSection = firstPublishedWork?.sections[0];
  const recordLabel = firstSection
    ? firstPublishedWork?.title + " · " + firstSection.navigationLabel
    : firstPublishedWork?.title ?? "Written record";

  return (
    <footer className="chronicle-footer">
      <div className="footer-office">
        <span className="typewriter" aria-hidden="true">
          {publicationPackage.manifest.world.title
            .split(/\s+/)
            .filter((word) => word.toLowerCase() !== "the")
            .map((word) => word[0])
            .join("")}
        </span>
        <p>
          <strong>{publicationPackage.manifest.world.title}</strong>
          Reader and interpretive exhibit
        </p>
      </div>
      <p className="footer-statement">
        Manuscript text is published from an approved, revision-traced package.
        Interpretive media is labelled separately from the written record.
      </p>
      <p className="record-stamp">
        Published work<br />
        <strong>{firstPublishedWork?.title ?? "—"}</strong>
      </p>
      <div className="footer-links">
        <strong>Read the record</strong>
        <a href={defaultReaderPath()}>{recordLabel}</a>
        <a href="https://www.michealburford.com">MichealBurford.com</a>
      </div>
    </footer>
  );
}
