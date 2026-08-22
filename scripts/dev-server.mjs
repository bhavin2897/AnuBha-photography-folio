import { spawn } from "node:child_process";
import { createReadStream, existsSync, watch } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const port = Number(process.env.PORT || 4173);
let building = false;
let queued = false;

function build() {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  const child = spawn(process.execPath, [path.join(root, "scripts", "build-gallery.mjs")], { stdio: "inherit" });
  child.on("exit", () => {
    building = false;
    if (queued) {
      queued = false;
      build();
    }
  });
}

const contentTypes = {
  ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon", ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".avif": "image/avif",
};

build();
watch(path.join(root, "photos"), { persistent: true }, () => {
  clearTimeout(globalThis.galleryTimer);
  globalThis.galleryTimer = setTimeout(build, 250);
});

http.createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  let filePath = path.join(root, pathname === "/" ? "index.html" : pathname);
  if (!filePath.startsWith(root)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  if (existsSync(filePath) && (await stat(filePath)).isDirectory()) filePath = path.join(filePath, "index.html");
  if (!existsSync(filePath)) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream" });
  createReadStream(filePath).pipe(response);
}).listen(port, () => console.log(`AnuBha Photography is running at http://localhost:${port}`));
