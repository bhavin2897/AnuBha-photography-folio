import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const sourceDirectory = path.join(root, "photos");
const outputDirectory = path.join(root, "dist", "gallery");
const manifestPath = path.join(root, "dist", "gallery-data.js");
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);
const widths = [480, 900, 1600, 2400];
const expectedOutputs = new Set();

function readableTitle(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/^\d+[\s_-]*/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(?:dsc|img)\s*0*(\d+)\b/gi, "Photograph $1")
    .replace(/\s+/g, " ")
    .trim();
}

async function buildPhoto(filename) {
  const sourcePath = path.join(sourceDirectory, filename);
  const source = await readFile(sourcePath);
  const hash = createHash("sha1").update(source).digest("hex").slice(0, 10);
  const slug = path.basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const image = sharp(source, { failOn: "warning" }).rotate();
  const metadata = await image.metadata();
  const availableWidths = widths.filter((width) => width < metadata.width);
  const outputWidths = [...availableWidths, Math.min(widths.at(-1), metadata.width)];
  const uniqueWidths = [...new Set(outputWidths)].sort((a, b) => a - b);
  const variants = { avif: [], webp: [], jpeg: [] };

  for (const width of uniqueWidths) {
    const base = `${slug}-${hash}-${width}`;
    const jobs = [
      ["avif", 58],
      ["webp", 76],
      ["jpeg", 80],
    ];

    for (const [format, quality] of jobs) {
      const extension = format === "jpeg" ? "jpg" : format;
      const outputName = `${base}.${extension}`;
      const outputPath = path.join(outputDirectory, outputName);
      expectedOutputs.add(outputName);
      const exists = await access(outputPath).then(() => true).catch(() => false);
      if (!exists) {
        await image.clone()
          .resize({ width, withoutEnlargement: true })
          .toFormat(format, { quality, progressive: true })
          .toFile(outputPath);
      }
      variants[format].push({ width, src: `dist/gallery/${outputName}` });
    }
  }

  const displayWidth = uniqueWidths[0];
  const displayHeight = Math.round((metadata.height / metadata.width) * displayWidth);
  const title = readableTitle(filename) || "Portfolio photograph";
  return { filename, title, alt: `${title} — AnuBha Photography`, width: displayWidth, height: displayHeight, variants };
}

async function main() {
  await mkdir(sourceDirectory, { recursive: true });
  await mkdir(outputDirectory, { recursive: true });

  const filenames = (await readdir(sourceDirectory))
    .filter((filename) => supportedExtensions.has(path.extname(filename).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const photos = [];
  for (const filename of filenames) {
    photos.push(await buildPhoto(filename));
  }

  const oldOutputs = await readdir(outputDirectory);
  await Promise.all(oldOutputs
    .filter((filename) => !expectedOutputs.has(filename))
    .map((filename) => rm(path.join(outputDirectory, filename), { force: true })));

  const manifest = `window.ANUBHA_PHOTOS = ${JSON.stringify(photos, null, 2)};\n`;
  if (process.argv.includes("--check")) {
    const current = await readFile(manifestPath, "utf8").catch(() => "");
    if (current !== manifest) throw new Error("Gallery output is out of date. Run npm run build.");
  } else {
    await writeFile(manifestPath, manifest);
  }

  const totalBytes = await Promise.all(
    (await readdir(outputDirectory)).map(async (filename) => (await stat(path.join(outputDirectory, filename))).size),
  );
  const megabytes = (totalBytes.reduce((sum, size) => sum + size, 0) / 1024 / 1024).toFixed(1);
  console.log(`Gallery ready: ${photos.length} photos, ${megabytes} MB of responsive images.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
