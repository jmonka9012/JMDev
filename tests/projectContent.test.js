import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  hasProjectText,
  projectGallery,
  projectThumbnail,
  projectChallenges,
  safeProjectUrl,
  sanitizeProjectHtml,
} from "../src/utils/projectContent.js";

test("featured thumbnail stays independent of Hero gallery ordering", () => {
  const post = {
    acf: { photo_1: "/files/old.png" },
    portfolio: { gallery: [{ image: { url: "/files/hero.png" } }] },
  };
  assert.equal(projectThumbnail(post).url, "/files/old.png");
  post.portfolio.featured_image = { url: "/files/featured.png" };
  assert.equal(projectThumbnail(post).url, "/files/featured.png");
  assert.equal(projectGallery(post)[0].image.url, "/files/hero.png");
});

test("rich text removes active content and unsafe URLs, preserves formatting", () => {
  const html = sanitizeProjectHtml(
    '<p onclick="evil()"><strong>OK</strong><script>evil()</script><iframe src="https://bad.test"></iframe><svg onload="evil()"></svg><a href="java&#x73;cript:evil()">bad</a><img src="/files/a.png" onerror="evil()"></p>',
  );
  assert.match(html, /<strong>OK<\/strong>/);
  assert.match(html, /src="\/files\/a.png"/);
  assert.doesNotMatch(html, /onclick|script|iframe|svg|onerror|javascript/);
  assert.equal(safeProjectUrl("//bad.test"), "");
  assert.equal(safeProjectUrl("/\\bad.test"), "");
  assert.equal(safeProjectUrl("https://good.test"), "https://good.test");
});

test("new gallery takes precedence and legacy photos remain a fallback", () => {
  const post = {
    acf: { photo_1: "/files/old.png", photo_3: "/files/third.png" },
    portfolio: {
      gallery: [
        {
          image: { url: "/files/new.png", alt: "Preview" },
          caption: "Caption",
        },
      ],
    },
  };
  assert.equal(projectGallery(post)[0].image.url, "/files/new.png");
  post.portfolio.gallery = [];
  assert.deepEqual(
    projectGallery(post).map((row) => row.image.url),
    ["/files/old.png", "/files/third.png"],
  );
});

test("empty optional content disappears and screenshot-only challenges survive", () => {
  assert.equal(hasProjectText("<p>&nbsp;<br></p>"), false);
  const rows = projectChallenges({
    portfolio: {
      challenges: [
        { solution: "<p>&nbsp;</p>" },
        { title: "  " },
        { screenshot: { url: "/files/a.png" } },
        { solution: "<p>Works</p>", effect: " Done " },
      ],
    },
  });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].screenshots[0].image.url, "/files/a.png");
  assert.equal(rows[1].effect, "Done");
});

test(
  "every cached old project still resolves its photos",
  {
    skip: !fs.existsSync(
      new URL("../public/data/post/all.json", import.meta.url),
    ),
  },
  () => {
    for (const file of ["post/all.json", "en/post/all.json"]) {
      const projects = JSON.parse(
        fs.readFileSync(new URL(`../public/data/${file}`, import.meta.url)),
      );
      for (const post of projects) {
        const expected = ["photo_1", "photo_2", "photo_3"].filter(
          (key) => post.acf?.[key],
        ).length;
        const legacy = {
          acf: Object.fromEntries(
            ["photo_1", "photo_2", "photo_3"].map((key) => [
              key,
              post.acf?.[key],
            ]),
          ),
        };
        assert.equal(projectGallery(legacy).length, expected, post.slug);
      }
    }
  },
);

test("challenge materials support screenshot and link together or separately", () => {
  const rows = projectChallenges({
    portfolio: {
      challenges: [
        {
          screenshot: { url: "/files/screen.png" },
          link_url: "https://example.com/demo",
          link_label: "Demo",
        },
        { link_url: "https://example.com/report" },
        { link_url: "javascript:alert(1)", link_label: "Unsafe" },
        { link_label: "No URL" },
      ],
    },
  });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].screenshots[0].image.url, "/files/screen.png");
  assert.equal(rows[0].link_url, "https://example.com/demo");
  assert.equal(rows[0].link_label, "Demo");
  assert.deepEqual(rows[1].screenshots, []);
});

test("screenshot collections preserve order, omit invalid images and allow clearing legacy", () => {
  const rows = projectChallenges({
    acf: {
      project_challenges: [
        {
          screenshots: [
            { image: { url: "/files/b.png" }, caption: "B" },
            { image: { url: "javascript:bad" } },
            { image: "/files/a.png" },
          ],
        },
        { screenshot: "/files/legacy.png", screenshots: [] },
      ],
    },
  });
  assert.equal(rows.length, 1);
  assert.deepEqual(
    rows[0].screenshots.map((shot) => shot.image.url),
    ["/files/b.png", "/files/a.png"],
  );
  assert.equal(rows[0].screenshots[0].caption, "B");
});
