import type { ReactNode } from "react";
import {
  entriesForSection,
  entriesForWork,
  publicationPackage,
  readerPathForEntry,
  resolveReaderPath,
  sectionForEntry,
} from "../../content/publication";
import type {
  ChronicleEntry,
  PublishedWork,
  PublishedWorkSection,
} from "../../content/types";
import { ChronicleFooter } from "../chronicle/ChronicleFooter";
import { EditionHeader } from "../chronicle/EditionHeader";

function renderInlineMarkdown(markdown: string): ReactNode[] {
  const tokens = markdown.split(/(\*\*[^*]+\*\*|_[^_\n]+_|\*[^*\n]+\*)/g);

  return tokens.filter(Boolean).map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={index + "-" + token}>{token.slice(2, -2)}</strong>;
    }
    if (
      (token.startsWith("_") && token.endsWith("_")) ||
      (token.startsWith("*") && token.endsWith("*"))
    ) {
      return <em key={index + "-" + token}>{token.slice(1, -1)}</em>;
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

function readableEntries(entries: ChronicleEntry[]) {
  return entries.filter((entry) => entry.body.paragraphs.length > 0);
}

function EntryList({
  entries,
}: {
  entries: ChronicleEntry[];
}) {
  return (
    <ol className="chapter-list">
      {entries.map((entry) => {
        const hasProse = entry.body.paragraphs.length > 0;
        const path = readerPathForEntry(entry.id);
        return (
          <li key={entry.id}>
            <a className="chapter-card" href={path}>
              <span className="chapter-number">
                {String(entry.sequence.order).padStart(2, "0")}
              </span>
              <span className="chapter-card-copy">
                <strong>{entry.title}</strong>
                <span className="chapter-excerpt">
                  {hasProse ? entry.presentation.excerpt : "Text not yet available."}
                </span>
                <span className="chapter-card-meta">
                  {hasProse
                    ? entry.presentation.wordCount.toLocaleString("en-US") +
                      " words · " +
                      entry.presentation.estimatedReadingMinutes +
                      " min read"
                    : "Awaiting prose"}
                </span>
              </span>
              <span className="chapter-card-arrow" aria-hidden="true">→</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

function SectionIndex({
  work,
  section,
}: {
  work: PublishedWork;
  section: PublishedWorkSection;
}) {
  const entries = entriesForSection(work, section);
  const readable = readableEntries(entries);
  const allChapters = work.entries
    .filter((descriptor) => section.entryIds.includes(descriptor.id))
    .every((descriptor) => descriptor.kind === "chapter");
  const noun = allChapters ? "chapters" : "entries";

  return (
    <>
      <header className="reader-hero">
        <p className="reader-kicker">
          {entries[0]?.sequence.series ?? publicationPackage.manifest.world.title}
        </p>
        <h2>{work.title}</h2>
        <p className="reader-part-title">{section.title}</p>
        <p className="reader-introduction">
          Read the current {section.navigationLabel} manuscript in source order.{" "}
          {readable.length} of {entries.length} {noun} currently contain prose;
          unfinished entries remain visible so the sequence stays intact.
        </p>
        {readable[0] ? (
          <a className="reader-primary-link" href={readerPathForEntry(readable[0].id)}>
            Begin {readable[0].title} <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </header>

      <section className="chapter-directory" aria-labelledby="reader-contents">
        <div className="reader-section-heading">
          <div>
            <p className="reader-kicker">The written record</p>
            <h3 id="reader-contents">{section.navigationLabel} contents</h3>
          </div>
          <p>{entries.length} {noun}</p>
        </div>
        <EntryList entries={entries} />
        <SourceNote />
      </section>
    </>
  );
}

function WorkIndex({ work }: { work: PublishedWork }) {
  if (work.sections.length === 1) {
    return <SectionIndex work={work} section={work.sections[0]} />;
  }

  if (work.sections.length > 1) {
    return (
      <>
        <header className="reader-hero">
          <p className="reader-kicker">{publicationPackage.manifest.world.title}</p>
          <h2>{work.title}</h2>
          <p className="reader-introduction">
            Select a published section of this work.
          </p>
        </header>
        <section className="chapter-directory" aria-labelledby="work-contents">
          <div className="reader-section-heading">
            <div>
              <p className="reader-kicker">The written record</p>
              <h3 id="work-contents">Contents</h3>
            </div>
            <p>{work.sections.length} sections</p>
          </div>
          <ol className="chapter-list">
            {work.sections.map((section) => (
              <li key={section.id}>
                <a className="chapter-card" href={section.path}>
                  <span className="chapter-number">
                    {String(section.order).padStart(2, "0")}
                  </span>
                  <span className="chapter-card-copy">
                    <strong>{section.navigationLabel}</strong>
                    <span className="chapter-excerpt">{section.title}</span>
                    <span className="chapter-card-meta">
                      {section.entryIds.length} published entries
                    </span>
                  </span>
                  <span className="chapter-card-arrow" aria-hidden="true">→</span>
                </a>
              </li>
            ))}
          </ol>
          <SourceNote />
        </section>
      </>
    );
  }

  const entries = entriesForWork(work);
  const readable = readableEntries(entries);
  return (
    <>
      <header className="reader-hero">
        <p className="reader-kicker">{publicationPackage.manifest.world.title}</p>
        <h2>{work.title}</h2>
        <p className="reader-introduction">
          Read the currently approved entries in source order.
        </p>
        {readable[0] ? (
          <a className="reader-primary-link" href={readerPathForEntry(readable[0].id)}>
            Begin {readable[0].title} <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </header>
      <section className="chapter-directory" aria-labelledby="work-entry-contents">
        <div className="reader-section-heading">
          <div>
            <p className="reader-kicker">The written record</p>
            <h3 id="work-entry-contents">Contents</h3>
          </div>
          <p>{entries.length} entries</p>
        </div>
        <EntryList entries={entries} />
        <SourceNote />
      </section>
    </>
  );
}

function EntryReader({
  work,
  entry,
}: {
  work: PublishedWork;
  entry: ChronicleEntry;
}) {
  const section = sectionForEntry(work, entry.id);
  const entries = section ? entriesForSection(work, section) : entriesForWork(work);
  const entryIndex = entries.findIndex((candidate) => candidate.id === entry.id);
  const previousEntry = entries[entryIndex - 1];
  const nextEntry = entries[entryIndex + 1];
  const hasProse = entry.body.paragraphs.length > 0;
  const contentsPath = section?.path ?? work.path;
  const contentsLabel = section?.navigationLabel ?? work.title;

  return (
    <article className="chapter-reader">
      <a className="reader-back-link" href={contentsPath}>
        <span aria-hidden="true">←</span> {contentsLabel} contents
      </a>
      <header className="chapter-header">
        <p className="reader-kicker">
          {work.title}{section ? " · " + section.title : ""}
        </p>
        <h2>{entry.title}</h2>
        <p className="chapter-reading-meta">
          Working draft
          {hasProse
            ? " · " +
              entry.presentation.wordCount.toLocaleString("en-US") +
              " words · " +
              entry.presentation.estimatedReadingMinutes +
              " min read"
            : " · text not yet available"}
        </p>
      </header>

      {hasProse ? (
        <div className="chapter-prose">
          {entry.body.paragraphs.map((paragraph, index) => (
            <p key={entry.id + "-" + index}>{renderInlineMarkdown(paragraph)}</p>
          ))}
        </div>
      ) : (
        <div className="chapter-empty-state">
          <p className="reader-kicker">The record continues</p>
          <h3>{entry.title} does not contain prose yet.</h3>
          <p>
            This place is reserved in the published sequence. No text has been
            invented or carried over from another entry.
          </p>
        </div>
      )}

      <nav className="chapter-navigation" aria-label="Entry navigation">
        {previousEntry ? (
          <a href={readerPathForEntry(previousEntry.id)}>
            <span aria-hidden="true">←</span>
            <span><small>Previous</small>{previousEntry.title}</span>
          </a>
        ) : (
          <span />
        )}
        <a className="chapter-toc-link" href={contentsPath}>Contents</a>
        {nextEntry ? (
          <a className="chapter-next-link" href={readerPathForEntry(nextEntry.id)}>
            <span><small>Next</small>{nextEntry.title}</span>
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

function MissingReader() {
  return (
    <section className="reader-hero reader-missing">
      <p className="reader-kicker">Record not found</p>
      <h2>That written record is not part of the current public package.</h2>
      <p className="reader-introduction">
        Only explicitly approved works and entries are available here.
      </p>
      <a className="reader-primary-link" href="/">Return to the front page</a>
    </section>
  );
}

export function PublicationReader({ pathname }: { pathname: string }) {
  const target = resolveReaderPath(pathname);
  const currentSection =
    target?.kind === "entry"
      ? sectionForEntry(target.work, target.entry.id)?.path ?? target.work.path
      : target?.kind === "section"
        ? target.section.path
        : target?.kind === "work"
          ? target.work.path
          : "/";

  return (
    <div
      className="chronicle-frame reader-frame"
      data-writing-revision={publicationPackage.manifest.sourceRevision}
      data-content-digest={publicationPackage.manifest.contentDigest}
    >
      <EditionHeader currentSection={currentSection} />
      <main id="main-content" className="reader-main">
        {!target ? (
          <MissingReader />
        ) : target.kind === "entry" ? (
          <EntryReader work={target.work} entry={target.entry} />
        ) : target.kind === "section" ? (
          <SectionIndex work={target.work} section={target.section} />
        ) : (
          <WorkIndex work={target.work} />
        )}
      </main>
      <ChronicleFooter />
    </div>
  );
}
