import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const currentFile = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(currentFile);
const projectRoot = path.resolve(scriptsDir, "..");
const publicDir = path.join(projectRoot, "public");
const publicFilesDir = path.join(publicDir, "files");
const outputDir = path.join(publicFilesDir, "optimized");
const manifestPath = path.join(
  projectRoot,
  "src",
  "data",
  "project-images.json",
);

const projectDataFiles = [
  path.join(publicDir, "data", "post", "all.json"),
  path.join(publicDir, "data", "en", "post", "all.json"),
];

const targetWidths = [720, 1200, 1600];

const readProjects = async () => {
  const projects = [];

  for (const dataFile of projectDataFiles) {
    try {
      const data = JSON.parse(await fs.readFile(dataFile, "utf8"));
      projects.push(...data);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  return projects;
};

const collectImageUrls = (projects) => {
  const urls = new Set();

  for (const project of projects) {
    for (const key of ["photo_1", "photo_2", "photo_3"]) {
      const imageUrl = project.acf?.[key];
      if (/^\/files\/.+\.(png|jpe?g|webp)$/i.test(imageUrl || "")) {
        urls.add(imageUrl);
      }
    }
  }

  return [...urls].sort();
};

const isCurrent = async (sourcePath, outputPath) => {
  try {
    const [sourceStat, outputStat] = await Promise.all([
      fs.stat(sourcePath),
      fs.stat(outputPath),
    ]);
    return outputStat.mtimeMs >= sourceStat.mtimeMs;
  } catch {
    return false;
  }
};

const encodeVariant = async (sourcePath, outputPath, width, format) => {
  if (await isCurrent(sourcePath, outputPath)) return;

  let pipeline = sharp(sourcePath).autoOrient().resize({
    width,
    withoutEnlargement: true,
  });

  if (format === "avif") {
    pipeline = pipeline.avif({
      quality: 75,
      effort: 4,
      chromaSubsampling: "4:4:4",
    });
  } else {
    pipeline = pipeline.webp({
      quality: 82,
      effort: 4,
      smartSubsample: true,
    });
  }

  await pipeline.toFile(outputPath);
};

const optimizeImage = async (imageUrl) => {
  const relativePath = decodeURIComponent(imageUrl.replace(/^\/+/, ""));
  const sourcePath = path.resolve(publicDir, relativePath);
  const filesRoot = publicFilesDir + path.sep;

  if (!sourcePath.startsWith(filesRoot)) {
    throw new Error(`Image path escapes public/files: ${imageUrl}`);
  }

  const metadata = await sharp(sourcePath).metadata();
  const oriented = metadata.autoOrient || metadata;
  const sourceWidth = oriented.width;
  const sourceHeight = oriented.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error(`Cannot read image dimensions: ${imageUrl}`);
  }

  const extension = path.extname(sourcePath);
  const basename = path.basename(sourcePath, extension);
  const widths = [
    ...new Set(targetWidths.map((width) => Math.min(width, sourceWidth))),
  ];
  const variants = {
    avif: [],
    webp: [],
  };

  for (const width of widths) {
    for (const format of Object.keys(variants)) {
      const filename = `${basename}-${width}w.${format}`;
      const outputPath = path.join(outputDir, filename);
      await encodeVariant(sourcePath, outputPath, width, format);
      variants[format].push({
        src: `/files/optimized/${filename}`,
        width,
      });
    }
  }

  return {
    width: sourceWidth,
    height: sourceHeight,
    avifSrcset: variants.avif
      .map((variant) => `${variant.src} ${variant.width}w`)
      .join(", "),
    webpSrcset: variants.webp
      .map((variant) => `${variant.src} ${variant.width}w`)
      .join(", "),
  };
};

const directorySize = async (extension) => {
  const files = await fs.readdir(outputDir);
  let total = 0;

  for (const file of files.filter((name) => name.endsWith(extension))) {
    total += (await fs.stat(path.join(outputDir, file))).size;
  }

  return total;
};

const run = async () => {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });

  const projects = await readProjects();
  const imageUrls = collectImageUrls(projects);
  const manifest = {};

  for (const imageUrl of imageUrls) {
    manifest[imageUrl] = await optimizeImage(imageUrl);
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  const avifBytes = await directorySize(".avif");
  const webpBytes = await directorySize(".webp");

  console.log(
    `Optimized ${imageUrls.length} project images. AVIF: ${(
      avifBytes /
      1024 /
      1024
    ).toFixed(2)} MB, WebP: ${(webpBytes / 1024 / 1024).toFixed(2)} MB.`,
  );
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
