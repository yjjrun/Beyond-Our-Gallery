import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(siteRoot, "..");
const outputRoot = resolve(siteRoot, "out");
const destinationRoot = resolve(repositoryRoot, "mockup");

await rm(destinationRoot, { recursive: true, force: true });
await mkdir(destinationRoot, { recursive: true });

await Promise.all([
  cp(resolve(outputRoot, "index.html"), resolve(destinationRoot, "index.html")),
  cp(resolve(outputRoot, "404.html"), resolve(destinationRoot, "404.html")),
]);

for (const directory of ["_next", "media"]) {
  await cp(resolve(outputRoot, directory), resolve(destinationRoot, directory), { recursive: true });
}

console.log("Exported the Next.js build to /mockup.");
