import {
  firstReadableChronicle,
  readerPathForEntry,
  sectionForEntry,
  workForEntry,
} from "../../content/publication";

export function LeadStory() {
  if (!firstReadableChronicle) {
    return (
      <article className="lead-story">
        <div className="lead-intro">
          <p className="section-label">Written record</p>
          <h2>No readable entry is currently available.</h2>
          <p className="lead-dek">
            The exhibit will remain available while the written record is prepared.
          </p>
        </div>
      </article>
    );
  }

  const entry = firstReadableChronicle;
  const work = workForEntry(entry.id);
  const section = work ? sectionForEntry(work, entry.id) : undefined;
  const path = readerPathForEntry(entry.id) ?? "/";

  return (
    <article className="lead-story">
      <div className="lead-intro">
        <p className="section-label">
          {work?.title ?? entry.sequence.bookTitle}
          {section ? " · " + section.navigationLabel : ""}
        </p>
        <h2>{entry.title}</h2>
        <p className="lead-dek">{entry.presentation.excerpt}</p>
        <p className="story-meta">
          Working draft · {entry.presentation.wordCount.toLocaleString("en-US")} words ·{" "}
          {entry.presentation.estimatedReadingMinutes} min read
        </p>
        <a className="module-link" href={path}>
          Read {entry.title} →
        </a>
      </div>
      <p className="lead-summary">
        Published from the approved source package. No newspaper issue, byline,
        date, or event status is implied.
      </p>
    </article>
  );
}
