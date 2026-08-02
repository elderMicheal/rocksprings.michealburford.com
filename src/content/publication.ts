import publicationPackageJson from "./generated/publication-package.json";
import { validatePublicationPackage } from "./schema";
import type { PublicationPackage } from "./types";

validatePublicationPackage(publicationPackageJson);

export const publicationPackage = publicationPackageJson as PublicationPackage;
export const publishedChronicles = publicationPackage.collections.chronicles;
export const firstReadableChronicle = publishedChronicles.find(
  (chronicle) => chronicle.body.paragraphs.length > 0,
);
