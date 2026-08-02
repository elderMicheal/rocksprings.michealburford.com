const gateways = [
  {
    title: "Stories",
    text: "Read episodes, excerpts, and serialized features.",
    href: "/stories",
  },
  {
    title: "People & Places",
    text: "Explore characters, locations, families, and factions.",
    href: "/world",
  },
  {
    title: "Artifacts",
    text: "Browse clippings, research files, maps, and adjacent materials.",
    href: "/archive",
  },
];

export function WorldGateway() {
  return (
    <section className="gateway-grid" aria-label="Rock Springs sections">
      {gateways.map((gateway) => (
        <a className="gateway-card" href={gateway.href} key={gateway.title}>
          <span className="gateway-title">{gateway.title}</span>
          <span className="gateway-text">{gateway.text}</span>
          <span className="gateway-action">Open →</span>
        </a>
      ))}
    </section>
  );
}
