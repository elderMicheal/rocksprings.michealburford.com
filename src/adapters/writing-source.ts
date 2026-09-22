import publicationPackageJson from "../content/generated/publication-package.json";
import { validatePublicationPackage } from "../content/schema";
import type { PublicationPackage } from "../content/types";

/**
 * Transitional writing-data boundary for the Rock Springs consumer.
 *
 * During the Draftworks migration this is the only application module allowed
 * to import the locally generated publication package directly. Consumers
 * should depend on this boundary instead of the package implementation.
 *
 * Draftworks API v1 will eventually replace the implementation behind this
 * module without requiring the rest of the Rock Springs application to know
 * where writing data comes from.
 */
validatePublicationPackage(publicationPackageJson);

export const writingSnapshot =
  publicationPackageJson as PublicationPackage;
