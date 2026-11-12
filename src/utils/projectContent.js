import { parseFragment, serialize } from "parse5";

const allowedTags = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "a",
  "pre",
  "code",
  "figure",
  "figcaption",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "hr",
  "span",
  "div",
]);
const discardTags = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "template",
]);

export const safeProjectUrl = (value) => {
  const url = typeof value === "string" ? value.trim() : "";
  return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(url) &&
    !/[\u0000-\u0020\u007f\\]/.test(url)
    ? url
    : "";
};

// One HTML parser in SSR and the browser prevents hydration differences.
// Only a small rich-text vocabulary and explicitly allowed attributes survive.
export const sanitizeProjectHtml = (html) => {
  const fragment = parseFragment(typeof html === "string" ? html : "");
  const clean = (parent) => {
    parent.childNodes = (parent.childNodes ?? []).flatMap((node) => {
      if (node.nodeName === "#text") return [node];
      if (!node.tagName || discardTags.has(node.tagName)) return [];
      clean(node);
      if (!allowedTags.has(node.tagName)) return node.childNodes;
      node.attrs = (node.attrs ?? []).filter(({ name, value }) => {
        if (name === "href" && node.tagName === "a")
          return Boolean(safeProjectUrl(value));
        if (name === "src" && node.tagName === "img")
          return (
            Boolean(safeProjectUrl(value)) && !/^(mailto:|tel:|#)/i.test(value)
          );
        if (name === "alt" && node.tagName === "img") return true;
        return (
          ["colspan", "rowspan"].includes(name) &&
          ["td", "th"].includes(node.tagName) &&
          /^\d{1,2}$/.test(value)
        );
      });
      if (node.tagName === "img") {
        if (!node.attrs.some(({ name }) => name === "src")) return [];
        node.attrs.push({ name: "loading", value: "lazy" });
      }
      return [node];
    });
  };
  clean(fragment);
  return serialize(fragment);
};

export const hasProjectText = (html) => {
  const fragment = parseFragment(sanitizeProjectHtml(html));
  const text = (node) =>
    node.nodeName === "#text"
      ? node.value
      : (node.childNodes ?? []).map(text).join("");
  return Boolean(text(fragment).trim()) || /<img\b/.test(serialize(fragment));
};

export const projectImage = (value) => {
  const url = safeProjectUrl(typeof value === "string" ? value : value?.url);
  if (!url || /^(mailto:|tel:|#)/i.test(url)) return null;
  return {
    ...(typeof value === "object" ? value : {}),
    url,
    alt: value?.alt || "",
  };
};

export const projectGallery = (post) => {
  const rows = post.portfolio?.gallery ?? post.acf?.project_gallery;
  const gallery = (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      image: projectImage(row.image),
      caption: row.caption || "",
    }))
    .filter((row) => row.image);
  if (gallery.length) return gallery;
  return ["photo_1", "photo_2", "photo_3"]
    .map((key) => ({ image: projectImage(post.acf?.[key]), caption: "" }))
    .filter((row) => row.image);
};

export const projectThumbnail = (post) =>
  projectImage(post.portfolio?.featured_image) ||
  projectImage(post.featured_media) ||
  projectImage(post.acf?.photo_1) ||
  projectGallery(post)[0]?.image ||
  null;

export const projectChallenges = (post) => {
  const rows = post.portfolio?.challenges ?? post.acf?.project_challenges;
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      title: typeof row.title === "string" ? row.title.trim() : "",
      challenge: typeof row.challenge === "string" ? row.challenge.trim() : "",
      solution: hasProjectText(row.solution)
        ? sanitizeProjectHtml(row.solution)
        : "",
      effect: typeof row.effect === "string" ? row.effect.trim() : "",
      screenshots: (Array.isArray(row.screenshots)
        ? row.screenshots
        : row.screenshot
          ? [{ image: row.screenshot }]
          : []
      )
        .map((shot) => ({
          image: projectImage(shot.image),
          caption: shot.caption || "",
        }))
        .filter((shot) => shot.image),
      link_url: /^https?:\/\//i.test(safeProjectUrl(row.link_url))
        ? safeProjectUrl(row.link_url)
        : "",
      link_label:
        typeof row.link_label === "string" ? row.link_label.trim() : "",
    }))
    .filter(
      (row) =>
        row.title ||
        row.challenge ||
        row.solution ||
        row.effect ||
        row.screenshots.length ||
        row.link_url,
    );
};
