import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { generateSitemap } from "../scripts/generate-sitemap.js";

const hostname = "https://example.test";
const fixture = (t) => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-sitemap-"));
  t.after(() => fs.rmSync(outDir, { recursive: true, force: true }));
  const page = (
    route,
    head = `<link rel="canonical" href="${hostname}${route}">`,
  ) => {
    const file = path.join(
      outDir,
      route === "/" ? "index.html" : `${route.slice(1)}.html`,
    );
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      `<!doctype html><html><head>${head}</head><body></body></html>`,
    );
  };
  const build = (routes) => {
    generateSitemap({ outDir, hostname, routes });
    return fs.readFileSync(path.join(outDir, "sitemap.xml"), "utf8");
  };
  return { outDir, page, build };
};

test("sitemap tracks the current route manifest, deduplicates and excludes stale files", (t) => {
  const { page, build } = fixture(t);
  page("/");
  page("/projekt/example");
  page("/en/project/example");
  assert.equal(
    (
      build([
        "/",
        "/projekt/example",
        "/projekt/example",
        "/en/project/example",
      ]).match(/<loc>/g) || []
    ).length,
    3,
  );
  const removed = build(["/"]);
  assert(!removed.includes("example</loc>"));
  assert(!removed.includes("lastmod"));
  assert(!removed.includes("priority"));
  assert(!removed.includes("changefreq"));
});

test("sitemap excludes noindex pages and 404 without overwriting robots.txt", (t) => {
  const { page, build, outDir } = fixture(t);
  page("/");
  page(
    "/design-lab/project",
    '<meta name="robots" content="noindex, nofollow">',
  );
  fs.writeFileSync(
    path.join(outDir, "robots.txt"),
    "User-agent: *\nAllow: /\n",
  );
  const sitemap = build(["/", "/404", "/design-lab/project"]);
  assert.equal((sitemap.match(/<loc>/g) || []).length, 1);
  assert.equal(
    fs.readFileSync(path.join(outDir, "robots.txt"), "utf8"),
    "User-agent: *\nAllow: /\n",
  );
});

test("sitemap fails on missing pages and canonicals inconsistent with the exported route", (t) => {
  const { page, build } = fixture(t);
  assert.throws(() => build(["/missing"]), /ENOENT/);
  page("/project", '<link rel="canonical" href="https://example.test/other">');
  assert.throws(() => build(["/project"]), /inconsistent canonical/);
});
