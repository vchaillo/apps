import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const projects = JSON.parse(readFileSync(new URL("../projects.json", import.meta.url), "utf8"));
assert(Array.isArray(projects), "The catalog must be an array");
assert.equal(new Set(projects.map(project => project.id)).size, projects.length, "IDs must be unique");
for (const project of projects) {
  for (const key of ["id", "name", "description", "category", "url", "repository"]) {
    assert(typeof project[key] === "string" && project[key].trim(), `Missing field: ${key}`);
  }
  assert.equal(new URL(project.url).protocol, "https:");
  assert.equal(new URL(project.repository).hostname, "github.com");
  assert.equal(new URL(project.repository).protocol, "https:");
}
console.log(`Validated ${projects.length} projects.`);
