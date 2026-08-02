export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="The Rock Springs Chronicle home">
        <span className="brand-mark">RSC</span>
        <span>
          <span className="brand-title">The Rock Springs Chronicle</span>
          <span className="brand-subtitle">Daily &amp; Weekend Editions</span>
        </span>
      </a>

      <nav className="site-nav" aria-label="Primary navigation">
        <a href="/">Front Page</a>
        <a href="/stories">Stories</a>
        <a href="/world">World</a>
        <a href="/archive">Archive</a>
      </nav>
    </header>
  );
}
