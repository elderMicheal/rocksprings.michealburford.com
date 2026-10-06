import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/app.css";
import "./styles/front-page.css";
import "./styles/town-scene-page.css";
import { initializeWritingSnapshot } from "./adapters/writing-source";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

async function bootstrap() {
  try {
    await initializeWritingSnapshot();
    const { App } = await import("./App");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (error) {
    console.error(error);
    root.render(
      <main className="reader-loading" role="alert">
        The written record is temporarily unavailable.
      </main>,
    );
  }
}

void bootstrap();
