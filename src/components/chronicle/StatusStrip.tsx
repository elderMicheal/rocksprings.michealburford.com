import { publishedChronicles } from "../../content/publication";

export function StatusStrip() {
  const readableCount = publishedChronicles.filter(
    (chapter) => chapter.body.paragraphs.length > 0,
  ).length;
  const statusItems = [
    ["▤", "Published chapters", String(publishedChronicles.length), "Read Part One", "/read/jackies-window/part-1"],
    ["◫", "Readable chapters", String(readableCount), "Begin reading", "/read/jackies-window/part-1/chapter-01"],
  ] as const;

  return (
    <section className="status-strip" aria-label="Published content summary">
      {statusItems.map(([icon, label, value, action, href]) => (
        <article className="status-item" key={label}>
          <span className="status-icon" aria-hidden="true">{icon}</span>
          <div><h2>{label}</h2><p>{value}</p></div>
          <a href={href}>{action} →</a>
        </article>
      ))}
    </section>
  );
}
