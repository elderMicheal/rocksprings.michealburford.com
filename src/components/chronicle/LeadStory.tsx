import { firstReadableChronicle } from "../../content/publication";

export function LeadStory() {
  if (!firstReadableChronicle) {
    return (
      <article className="lead-story">
        <div className="lead-intro">
          <p className="section-label">Written record</p>
          <h2>No readable chapter is currently available.</h2>
          <p className="lead-dek">The exhibit will remain available while the written record is prepared.</p>
        </div>
      </article>
    );
  }

  const chapter = firstReadableChronicle;

  return (
    <article className="lead-story">
      <div className="lead-intro">
        <p className="section-label">
          {chapter.sequence.bookTitle} · Part {chapter.sequence.part}
        </p>
        <h2>{chapter.title}</h2>
        <p className="lead-dek">{chapter.presentation.excerpt}</p>
        <p className="story-meta">
          Working draft · {chapter.presentation.wordCount.toLocaleString("en-US")} words ·{" "}
          {chapter.presentation.estimatedReadingMinutes} min read
        </p>
        <a
          className="module-link"
          href={`/read/jackies-window/part-1/${chapter.slug}`}
        >
          Read {chapter.title} →
        </a>
      </div>
      <p className="lead-summary">
        Published from the approved Part One source package. No newspaper issue,
        byline, date, or event status is implied.
      </p>
    </article>
  );
}
