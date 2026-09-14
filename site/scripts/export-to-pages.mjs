import { cp, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(siteRoot, "..");
const outputRoot = resolve(siteRoot, "out");

await Promise.all([
  cp(resolve(outputRoot, "index.html"), resolve(repositoryRoot, "index.html")),
  cp(resolve(outputRoot, "404.html"), resolve(repositoryRoot, "404.html")),
]);

for (const directory of ["_next", "media"]) {
  const destination = resolve(repositoryRoot, directory);
  await rm(destination, { recursive: true, force: true });
  await cp(resolve(outputRoot, directory), destination, { recursive: true });
}

console.log("Exported the Next.js build to the GitHub Pages root.");
