import { publishedChronicles } from "../../content/publication";

export function PartOneChapters() {
  return (
    <section className="news-module developing" aria-labelledby="developing-title">
      <h2 id="developing-title">Part One</h2>
      <ol>
        {publishedChronicles.map((chapter) => (
          <li key={chapter.id}>
            <time>{String(chapter.sequence.chapter).padStart(2, "0")}</time>
            <a href={`/read/jackies-window/part-1/${chapter.slug}`}>
              {chapter.title}
            </a>
            <span aria-hidden="true">→</span>
          </li>
        ))}
      </ol>
      <a className="module-link" href="/read/jackies-window/part-1">
        View all chapters →
      </a>
    </section>
  );
}
