import { lazy, Suspense } from "react";
import { ChronicleShell } from "./components/chronicle/ChronicleShell";

const PartOneReader = lazy(() =>
  import("./components/reading/PartOneReader").then((module) => ({
    default: module.PartOneReader,
  })),
);

const partOnePath = "/read/jackies-window/part-1";

export function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const isPartOneIndex =
    pathname === partOnePath || pathname === "/stories" || pathname === "/latest";
  const isPartOneChapter = pathname.startsWith(`${partOnePath}/`);

  if (isPartOneIndex || isPartOneChapter) {
    const chapterSlug = isPartOneChapter
      ? pathname.slice(partOnePath.length + 1)
      : undefined;

    return (
      <Suspense
        fallback={
          <div className="reader-loading" role="status">
            Opening the written record…
          </div>
        }
      >
        <PartOneReader chapterSlug={chapterSlug} />
      </Suspense>
    );
  }

  return <ChronicleShell />;
}
