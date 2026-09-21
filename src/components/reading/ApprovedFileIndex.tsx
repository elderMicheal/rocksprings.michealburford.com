import { publicationPackage, publishedChronicles } from "../../content/publication";
import "../../styles/file-index.css";

export function ApprovedFileIndex() {
  return (
    <main id="main-content" className="file-index">
      <h1>{publicationPackage.manifest.world.title}</h1>
      <h2>Approved files</h2>
      <ul>
        {publishedChronicles.map((chapter) => (
          <li key={chapter.slug}>
            <a href={`/read/jackies-window/part-${chapter.sequence.part}/${chapter.slug}`}>
              {chapter.sequence.bookTitle} — Part {chapter.sequence.part} — {chapter.title}
            </a>
            {chapter.body.paragraphs.length === 0 && " (text not yet available)"}
          </li>
        ))}
      </ul>
    </main>
  );
}
