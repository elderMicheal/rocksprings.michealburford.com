import { spawnSync } from "node:child_process";

if (process.env.RSC_SKIP_NATIVE_BUILD_DEPS === "1") {
  process.exit(0);
}

if (process.platform !== "linux" || process.arch !== "x64") {
  process.exit(0);
}

const report = process.report?.getReport?.();
const usesGlibc = Boolean(report?.header?.glibcVersionRuntime);
const nativePackages = usesGlibc
  ? [
      "@rolldown/binding-linux-x64-gnu@1.1.5",
      "lightningcss-linux-x64-gnu@1.32.0",
    ]
  : [
      "@rolldown/binding-linux-x64-musl@1.1.5",
      "lightningcss-linux-x64-musl@1.32.0",
    ];

console.log(`Ensuring Linux native build packages: ${nativePackages.join(", ")}`);

const result = spawnSync(
  "npm",
  ["install", "--no-save", "--package-lock=false", ...nativePackages],
  { stdio: "inherit" },
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  throw new Error(`Native build dependency installation failed with exit code ${result.status}`);
}
