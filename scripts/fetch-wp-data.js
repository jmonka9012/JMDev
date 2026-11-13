import axios from "axios";
import fs from "fs";
import path from "path";
import https from "https";
import crypto from "node:crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const finalDataDir = path.resolve(
  process.env.PORTFOLIO_DATA_OUTPUT ||
    path.resolve(__dirname, "../public/data/"),
);
const publicDataDir = `${finalDataDir}.staging-${process.pid}`;
const snapshotDir = process.env.PORTFOLIO_API_SNAPSHOT;
const uploadsDir = path.resolve(
  __dirname,
  "../../backend/wordpress/wp-content/uploads",
);
const publicFilesDir = path.resolve(
  process.env.PORTFOLIO_FILES_OUTPUT ||
    path.resolve(__dirname, "../public/files/"),
);
const API_URL =
  process.env.PORTFOLIO_API_URL || "https://backend.ddev.site/wp-json/wp/v2";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

if (!fs.existsSync(publicFilesDir))
  fs.mkdirSync(publicFilesDir, { recursive: true });

const saveNestedJson = (relPath, data) => {
  const fullPublicPath = path.join(publicDataDir, relPath);
  const publicDirPath = path.dirname(fullPublicPath);

  if (!fs.existsSync(publicDirPath))
    fs.mkdirSync(publicDirPath, { recursive: true });
  fs.writeFileSync(fullPublicPath, JSON.stringify(data));
};

const downloadImage = async (url) => {
  if (!url) return null;
  const sourcePath = new URL(url).pathname;
  const suffix = crypto
    .createHash("sha256")
    .update(sourcePath)
    .digest("hex")
    .slice(0, 12);
  const originalName = path.basename(sourcePath);
  const extension = path.extname(originalName);
  const filename = `${path.basename(originalName, extension)}-${suffix}${extension}`;
  const filepath = path.join(publicFilesDir, filename);

  if (fs.existsSync(filepath)) return `/files/${filename}`;

  console.log(`Pobieranie pliku: ${filename}...`);
  try {
    if (snapshotDir) {
      const marker = "/wp-content/uploads/";
      if (!sourcePath.includes(marker))
        throw new Error("Snapshot asset is outside WordPress uploads.");
      const localPath = path.resolve(
        uploadsDir,
        decodeURIComponent(sourcePath.split(marker)[1]),
      );
      if (!localPath.startsWith(`${uploadsDir}${path.sep}`))
        throw new Error("Unsafe media path.");
      fs.copyFileSync(localPath, filepath);
    } else {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        httpsAgent,
      });
      fs.writeFileSync(filepath, Buffer.from(response.data));
    }
    return `/files/${filename}`;
  } catch (error) {
    console.error(`Błąd pobierania pliku: ${url}`);
    throw error;
  }
};

const processAllImages = async (obj) => {
  if (
    typeof obj === "string" &&
    obj.includes("wp-content/uploads") &&
    /\.(jpe?g|gif|png|webp|svg)/i.test(obj)
  ) {
    return await downloadImage(obj);
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = await processAllImages(obj[i]);
    }
    return obj;
  }

  if (obj !== null && typeof obj === "object") {
    for (const key in obj) {
      obj[key] = await processAllImages(obj[key]);
    }
    return obj;
  }

  return obj;
};

const fetchAllPages = async (url) => {
  if (snapshotDir) {
    const type = new URL(url).pathname.split("/").pop();
    const results = [];
    let page = 1;
    let total = 1;
    do {
      const response = JSON.parse(
        fs.readFileSync(
          path.join(snapshotDir, "rest", `${type}-${page}.json`),
          "utf8",
        ),
      );
      if (response.status !== 200 || !Array.isArray(response.body))
        throw new Error(`Invalid REST snapshot: ${type}/${page}`);
      results.push(...response.body);
      total = Number(response.headers["X-WP-TotalPages"] || 1);
      page++;
    } while (page <= total);
    return results;
  }
  const perPage = 100;
  const separator = url.includes("?") ? "&" : "?";

  const firstUrl = `${url}${separator}per_page=${perPage}&page=1`;
  const firstResponse = await axios.get(firstUrl, { httpsAgent });
  const totalPages = parseInt(
    firstResponse.headers["x-wp-totalpages"] || "1",
    10,
  );

  let results = [...firstResponse.data];

  for (let page = 2; page <= totalPages; page++) {
    const { data } = await axios.get(
      `${url}${separator}per_page=${perPage}&page=${page}`,
      { httpsAgent },
    );
    results = results.concat(data);
  }

  return results;
};

async function run() {
  console.log("Pobieranie danych z WordPressa...");
  const generatedRoutes = [];

  // === 1. PAGES ===
  const pages = await fetchAllPages(
    `${API_URL}/pages?_embed&acf_format=standard`,
  );

  for (const page of pages) {
    if (page._embedded && page._embedded["wp:featuredmedia"]) {
      const media = page._embedded["wp:featuredmedia"][0];
      if (media && media.source_url) {
        media.source_url = await downloadImage(media.source_url);
      }
    }

    if (page.acf) {
      page.acf = await processAllImages(page.acf);
    }

    const lang = page.acf?.lang || page.meta?.lang || "pl";
    const template =
      page.acf?.template ||
      page.meta?.template ||
      (page.slug === "home" ? "home" : "default");

    let routePath = "";
    let jsonPath = "";

    if (template === "home") {
      routePath = lang === "pl" ? "/" : `/${lang}`;
      jsonPath = lang === "pl" ? "index.json" : `${lang}/index.json`;
    } else {
      const cleanSlug = page.slug.replace(/-\d+$/, "");
      routePath = lang === "pl" ? `/${cleanSlug}` : `/${lang}/${cleanSlug}`;
      jsonPath =
        lang === "pl" ? `${cleanSlug}.json` : `${lang}/${cleanSlug}.json`;
    }

    saveNestedJson(jsonPath, page);
    if (routePath !== "/") generatedRoutes.push(routePath);
  }

  // === 2. POSTS === (Projects)
  const posts = await fetchAllPages(
    `${API_URL}/posts?_embed&acf_format=standard`,
  );
  const aggregatedPosts = {};
  const projectRoutes = new Set(generatedRoutes);

  for (const post of posts) {
    if (post._embedded && post._embedded["wp:featuredmedia"]) {
      const media = post._embedded["wp:featuredmedia"][0];
      if (media && media.source_url) {
        media.source_url = await downloadImage(media.source_url);
      }
    }

    if (post.acf) {
      post.acf = await processAllImages(post.acf);
    }

    if (post.portfolio) {
      post.portfolio = await processAllImages(post.portfolio);
    }

    const lang = post.acf?.lang || post.meta?.lang || "pl";
    // Remove only the trailing "-2" used by the translated copies.
    const slug = post.portfolio?.public_slug || post.slug.replace(/-2$/, "");

    const compactPost = {
      id: post.id,
      title: post.title?.rendered || "",
      acf: post.acf || "",
      portfolio: post.portfolio,
      slug,
      excerpt: post.excerpt?.rendered || "",
      content: post.content?.rendered || "",
      date: post.date,
      featured_media:
        post._embedded && post._embedded["wp:featuredmedia"]
          ? post._embedded["wp:featuredmedia"][0].source_url
          : post.featured_media,
      order: post.acf?.order ?? post.meta?.order ?? 0,
    };

    if (!aggregatedPosts[lang]) aggregatedPosts[lang] = [];
    aggregatedPosts[lang].push(compactPost);

    const routePath =
      lang === "pl" ? `/projekt/${slug}` : `/${lang}/project/${slug}`;
    const jsonPath =
      lang === "pl" ? `projekt/${slug}.json` : `${lang}/project/${slug}.json`;

    if (projectRoutes.has(routePath)) {
      throw new Error(
        `Repeated project address ${routePath} (post ID: ${post.id}).`,
      );
    }
    projectRoutes.add(routePath);

    saveNestedJson(jsonPath, { ...post, slug });
    generatedRoutes.push(routePath);
  }

  for (const [lang, postsArray] of Object.entries(aggregatedPosts)) {
    postsArray.sort((a, b) => a.order - b.order);

    const allJsonPath =
      lang === "pl" ? `post/all.json` : `${lang}/post/all.json`;
    saveNestedJson(allJsonPath, postsArray);
  }

  // === 3. TECHNOLOGIES (CPT) ===
  const technologies = await fetchAllPages(
    `${API_URL}/technology?_embed&acf_format=standard`,
  );
  const aggregatedTechs = {};

  for (const tech of technologies) {
    if (tech._embedded && tech._embedded["wp:featuredmedia"]) {
      const media = tech._embedded["wp:featuredmedia"][0];
      if (media && media.source_url) {
        media.source_url = await downloadImage(media.source_url);
      }
    }

    if (tech.acf) {
      tech.acf = await processAllImages(tech.acf);
    }

    const lang = tech.acf?.lang || tech.meta?.lang || "pl";

    const compactTech = {
      id: tech.id,
      title: tech.title?.rendered || "",
      category: tech.portfolio_category ?? null,
      slug: tech.slug,
      excerpt: tech.excerpt?.rendered || "",
      content: tech.content?.rendered || "",
      date: tech.date,
      featured_media:
        tech._embedded && tech._embedded["wp:featuredmedia"]
          ? tech._embedded["wp:featuredmedia"][0].source_url
          : tech.featured_media,
      order: tech.acf?.order ?? tech.meta?.order ?? 0,
    };

    if (!aggregatedTechs[lang]) aggregatedTechs[lang] = [];
    aggregatedTechs[lang].push(compactTech);

    const jsonPath =
      lang === "pl"
        ? `technology/${tech.id}.json`
        : `${lang}/technology/${tech.id}.json`;

    saveNestedJson(jsonPath, tech);
  }

  for (const [lang, techsArray] of Object.entries(aggregatedTechs)) {
    techsArray.sort((a, b) => a.order - b.order);

    const allJsonPath =
      lang === "pl" ? `technology/all.json` : `${lang}/technology/all.json`;
    saveNestedJson(allJsonPath, techsArray);
  }

  const languageDefinitions =
    snapshotDir && fs.existsSync(path.join(snapshotDir, "languages.json"))
      ? JSON.parse(
          fs.readFileSync(path.join(snapshotDir, "languages.json"), "utf8"),
        )
      : snapshotDir
        ? Object.fromEntries(
            Object.keys(aggregatedPosts).map((key) => [key, key]),
          )
        : (
            await axios.get(
              new URL("/wp-json/portfolio/v1/languages", API_URL).href,
              { httpsAgent },
            )
          ).data;
  saveNestedJson("languages.json", languageDefinitions);
  const routesFilePath = path.join(publicDataDir, "routes.json");
  fs.writeFileSync(routesFilePath, JSON.stringify(generatedRoutes));
  const previous = `${finalDataDir}.previous-${process.pid}`;
  if (fs.existsSync(finalDataDir)) fs.renameSync(finalDataDir, previous);
  try {
    fs.renameSync(publicDataDir, finalDataDir);
  } catch (error) {
    if (fs.existsSync(previous)) fs.renameSync(previous, finalDataDir);
    throw error;
  }
  if (fs.existsSync(previous)) fs.rmSync(previous, { recursive: true });
  console.log(
    `Zakończono pobieranie. Wygenerowano ${generatedRoutes.length} ścieżek.`,
  );
}

run().catch((error) => {
  if (fs.existsSync(publicDataDir))
    fs.rmSync(publicDataDir, { recursive: true });
  console.error(error.message);
  process.exitCode = 1;
});
