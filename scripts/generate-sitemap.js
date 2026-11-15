import fs from "node:fs";
import path from "node:path";
import { parse } from "parse5";

const escapeXml = (value) =>
  value.replace(
    /[<>&"']/g,
    (character) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[character],
  );

export function generateSitemap({ outDir, routes, hostname }) {
  const entries = [...new Set(routes)]
    .filter((route) => route !== "/404")
    .sort()
    .map((route) => {
      const filename = route === "/" ? "index.html" : `${route.slice(1)}.html`;
      const document = parse(
        fs.readFileSync(path.join(outDir, filename), "utf8"),
      );
      const elements = [];
      const walk = (node) => {
        if (node.tagName) elements.push(node);
        node.childNodes?.forEach(walk);
      };
      walk(document);
      const attr = (node, name) =>
        node.attrs?.find((item) => item.name === name)?.value;
      if (
        elements.some(
          (node) =>
            node.tagName === "meta" &&
            attr(node, "name") === "robots" &&
            /\bnoindex\b/i.test(attr(node, "content")),
        )
      )
        return "";
      const canonical = elements.filter(
        (node) => node.tagName === "link" && attr(node, "rel") === "canonical",
      );
      const url = new URL(route, hostname).href;
      if (canonical.length !== 1 || attr(canonical[0], "href") !== url) {
        throw new Error(`Missing or inconsistent canonical for ${route}`);
      }
      return `  <url><loc>${escapeXml(url)}</loc></url>`;
    })
    .filter(Boolean);
  fs.writeFileSync(
    path.join(outDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`,
  );
}
