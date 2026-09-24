const DEFAULT_BASE_URL = "https://www.michealburford.com/api/v1";

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

async function getJson(fetchImpl, baseUrl, relativePath) {
  const response = await fetchImpl(
    `${baseUrl}/${String(relativePath).replace(/^\/+/, "")}`,
    { headers: { accept: "application/json" } },
  );
  if (!response.ok) {
    throw new Error(
      `Draftworks analysis source failed: ${response.status} ${relativePath}`,
    );
  }
  return response.json();
}

export async function loadRockSpringsWriting({
  fetchImpl = fetch,
  baseUrl = process.env.DRAFTWORKS_API_BASE_URL || DEFAULT_BASE_URL,
} = {}) {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const manifest = await getJson(fetchImpl, normalizedBase, "works.json");
  if (
    manifest?.schemaVersion !== 1 ||
    !/^[0-9a-f]{40}$/i.test(String(manifest?.sourceRevision || ""))
  ) {
    throw new Error("Draftworks works manifest is invalid.");
  }

  const works = (manifest.works || []).filter(
    (work) => work?.series === "The Rock Springs Chronicles",
  );
  const documents = [];

  for (const work of works) {
    for (const descriptor of work.documents || []) {
      const document = await getJson(
        fetchImpl,
        normalizedBase,
        descriptor.href,
      );
      if (
        document?.schemaVersion !== 1 ||
        document?.visibility !== "public" ||
        document?.publication?.state !== "published" ||
        document?.sourceRevision !== manifest.sourceRevision
      ) {
        throw new Error(
          `Draftworks analysis document is invalid: ${descriptor.id}`,
        );
      }

      documents.push({
        id: document.id,
        workId: work.id,
        workTitle: work.title,
        series: document.series || work.series,
        kind: document.kind,
        title: document.title,
        order: document.order,
        sourceRevision: document.sourceRevision,
        markdown: document.content?.markdown || "",
      });
    }
  }

  return {
    schemaVersion: 1,
    sourceRevision: manifest.sourceRevision,
    works: works.map((work) => ({
      id: work.id,
      title: work.title,
      series: work.series,
      documentIds: [...(work.documentIds || [])],
    })),
    documents,
  };
}
