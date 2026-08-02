import type { ReactNode } from "react";
import publicationPackage from "../../content/generated/publication-package.json";
import { ChronicleFooter } from "../chronicle/ChronicleFooter";
import { EditionHeader } from "../chronicle/EditionHeader";

type Chapter = (typeof publicationPackage.collections.chronicles)[number];

const partOnePath = "/read/jackies-window/part-1";
const chapters = publicationPackage.collections.chronicles;
const book = chapters[0].sequence;
const partLabel = `Part ${book.part}`;

function chapterPath(chapter: Chapter) {
  return `${partOnePath}/${chapter.slug}`;
}

function renderInlineMarkdown(markdown: string): ReactNode[] {
  const tokens = markdown.split(/(\*\*[^*]+\*\*|_[^_\n]+_|\*[^*\n]+\*)/g);

  return tokens.filter(Boolean).map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={`${index}-${token}`}>{token.slice(2, -2)}</strong>;
    }
    if (
      (token.startsWith("_") && token.endsWith("_")) ||
      (token.startsWith("*") && token.endsWith("*"))
    ) {
      return <em key={`${index}-${token}`}>{token.slice(1, -1)}</em>;
    }
    return token;
  });
}

function SourceNote() {
  return (
    <p className="reader-source-note">
      Working-draft text · source revision{" "}
      <code>{publicationPackage.manifest.sourceRevision.slice(0, 12)}</code> · content{" "}
      <code>{publicationPackage.manifest.contentDigest.slice(0, 12)}</code>
    </p>
  );
}

function PartOneIndex() {
  const readableChapters = chapters.filter(
    (chapter) => chapter.body.paragraphs.length > 0,
  );

  return (
    <>
      <header className="reader-hero">
        <p className="reader-kicker">
          {book.series} · Book {book.book}
        </p>
        <h2>{book.bookTitle}</h2>
        <p className="reader-part-title">{partLabel}</p>
        <p className="reader-introduction">
          Read the current Part One manuscript in chapter order.{" "}
          {readableChapters.length} of {chapters.length} chapters currently
          contain prose; unfinished chapters remain visible so the sequence stays intact.
        </p>
        <a className="reader-primary-link" href={chapterPath(readableChapters[0])}>
          Begin Chapter 1 <span aria-hidden="true">→</span>
        </a>
      </header>

      <section className="chapter-directory" aria-labelledby="part-one-contents">
        <div className="reader-section-heading">
          <div>
            <p className="reader-kicker">The written record</p>
          <h3 id="part-one-contents">{partLabel} contents</h3>
          </div>
          <p>{chapters.length} chapters</p>
        </div>
        <ol className="chapter-list">
          {chapters.map((chapter) => {
            const hasProse = chapter.body.paragraphs.length > 0;
            return (
              <li key={chapter.slug}>
                <a className="chapter-card" href={chapterPath(chapter)}>
                  <span className="chapter-number">
                    {String(chapter.sequence.chapter).padStart(2, "0")}
                  </span>
                  <span className="chapter-card-copy">
                    <strong>{chapter.title}</strong>
                    <span className="chapter-excerpt">
                      {hasProse ? chapter.presentation.excerpt : "Text not yet available."}
                    </span>
                    <span className="chapter-card-meta">
                      {hasProse
                        ? `${chapter.presentation.wordCount.toLocaleString("en-US")} words · ${chapter.presentation.estimatedReadingMinutes} min read`
                        : "Awaiting prose"}
                    </span>
                  </span>
                  <span className="chapter-card-arrow" aria-hidden="true">→</span>
                </a>
              </li>
            );
          })}
        </ol>
        <SourceNote />
      </section>
    </>
  );
}

function ChapterReader({ chapter }: { chapter: Chapter }) {
  const chapterIndex = chapters.findIndex(
    (candidate) => candidate.slug === chapter.slug,
  );
  const previousChapter = chapters[chapterIndex - 1];
  const nextChapter = chapters[chapterIndex + 1];
  const hasProse = chapter.body.paragraphs.length > 0;

  return (
    <article className="chapter-reader">
      <a className="reader-back-link" href={partOnePath}>
        <span aria-hidden="true">←</span> Part One contents
      </a>
      <header className="chapter-header">
        <p className="reader-kicker">
          {book.bookTitle} · {partLabel}
        </p>
        <h2>{chapter.title}</h2>
        <p className="chapter-reading-meta">
          Working draft
          {hasProse
            ? ` · ${chapter.presentation.wordCount.toLocaleString("en-US")} words · ${chapter.presentation.estimatedReadingMinutes} min read`
            : " · text not yet available"}
        </p>
      </header>

      {hasProse ? (
        <div className="chapter-prose">
          {chapter.body.paragraphs.map((paragraph, index) => (
            <p key={`${chapter.slug}-${index}`}>{renderInlineMarkdown(paragraph)}</p>
          ))}
        </div>
      ) : (
        <div className="chapter-empty-state">
          <p className="reader-kicker">The record continues</p>
          <h3>{chapter.title} does not contain prose yet.</h3>
          <p>
            This place is reserved in the {partLabel} sequence. No text has been invented
            or carried over from another chapter.
          </p>
        </div>
      )}

      <nav className="chapter-navigation" aria-label="Chapter navigation">
        {previousChapter ? (
          <a href={chapterPath(previousChapter)}>
            <span aria-hidden="true">←</span>
            <span><small>Previous</small>{previousChapter.title}</span>
          </a>
        ) : (
          <span />
        )}
        <a className="chapter-toc-link" href={partOnePath}>Contents</a>
        {nextChapter ? (
          <a className="chapter-next-link" href={chapterPath(nextChapter)}>
            <span><small>Next</small>{nextChapter.title}</span>
            <span aria-hidden="true">→</span>
          </a>
        ) : (
          <span />
        )}
      </nav>
      <SourceNote />
    </article>
  );
}

function MissingChapter() {
  return (
    <section className="reader-hero reader-missing">
      <p className="reader-kicker">Record not found</p>
      <h2>That chapter is not part of the current record.</h2>
      <p className="reader-introduction">
        {partLabel} currently contains Chapters 1 through 8.
      </p>
      <a className="reader-primary-link" href={partOnePath}>View Part One contents</a>
    </section>
  );
}

export function PartOneReader({ chapterSlug }: { chapterSlug?: string }) {
  const chapter = chapterSlug
    ? chapters.find((candidate) => candidate.slug === chapterSlug)
    : undefined;

  return (
    <div
      className="chronicle-frame reader-frame"
      data-writing-revision={publicationPackage.manifest.sourceRevision}
      data-content-digest={publicationPackage.manifest.contentDigest}
    >
      <EditionHeader currentSection={partOnePath} />
      <main id="main-content" className="reader-main">
        {chapterSlug ? (
          chapter ? <ChapterReader chapter={chapter} /> : <MissingChapter />
        ) : (
          <PartOneIndex />
        )}
      </main>
      <ChronicleFooter />
    </div>
  );
}
