import { lazy, Suspense } from "react";
import { ChronicleShell } from "./components/chronicle/ChronicleShell";

const PublicationReader = lazy(() =>
  import("./components/reading/PublicationReader").then((module) => ({
    default: module.PublicationReader,
  })),
);

const TownScenePage = lazy(() =>
  import("./components/scene/TownScenePage").then((module) => ({
    default: module.TownScenePage,
  })),
);

export function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const isReaderPath =
    pathname.startsWith("/read/") ||
    pathname === "/stories" ||
    pathname === "/latest";

  if (pathname === "/map") {
    return (
      <Suspense
        fallback={
          <div className="reader-loading" role="status">
            Opening the Rock Springs map…
          </div>
        }
      >
        <TownScenePage />
      </Suspense>
    );
  }

  if (isReaderPath) {
    return (
      <Suspense
        fallback={
          <div className="reader-loading" role="status">
            Opening the written record…
          </div>
        }
      >
        <PublicationReader pathname={pathname} />
      </Suspense>
    );
  }

  return <ChronicleShell />;
}
