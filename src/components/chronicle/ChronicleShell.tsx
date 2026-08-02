import { ChronicleFooter } from "./ChronicleFooter";
import { EditionHeader } from "./EditionHeader";
import { PartOneChapters } from "./EditorialModules";
import { ExhibitScene } from "./ExhibitScene";
import { LeadStory } from "./LeadStory";
import { StatusStrip } from "./StatusStrip";
import { TownMapPanel } from "./TownMapPanel";

export function ChronicleShell() {
  return (
    <div className="chronicle-frame">
      <EditionHeader />
      <main id="main-content">
        <section className="front-page-primary" aria-label="Current Rock Springs exhibit">
          <ExhibitScene />
          <LeadStory />
          <TownMapPanel />
        </section>
        <StatusStrip />
        <div className="front-page-secondary">
          <PartOneChapters />
        </div>
      </main>
      <ChronicleFooter />
    </div>
  );
}
