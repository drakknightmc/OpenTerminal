import { join } from "path";
import { readFileSync, existsSync } from "fs";
import db from "./db";

const port = parseInt(process.env.PORT || "4100", 10);

// When compiled, import.meta.dir points to the executable location
// Try multiple possible paths for the dist directory
function findDistDir(): string {
  const candidates = [
    join(import.meta.dir, "../web/dist"),
    join(import.meta.dir, "../../web/dist"),
    "./web/dist",
    "./dist",
    join(process.cwd(), "web/dist"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback to the first candidate (it won't be used in dev mode anyway)
  return candidates[0];
}

const distDir = findDistDir();

// Auto-detect production mode: if we can find web/dist, we're in production
const isProduction = existsSync(distDir);

// Serve static files from dist in production
async function serveStatic(path: string): Promise<Response | null> {
  if (!isProduction) return null;

  const filePath = join(distDir, path);
  if (!existsSync(filePath)) return null;

  try {
    const content = readFileSync(filePath);
    const ext = filePath.split(".").pop() || "bin";

    const mimeTypes: Record<string, string> = {
      html: "text/html; charset=utf-8",
      css: "text/css",
      js: "application/javascript",
      json: "application/json",
      svg: "image/svg+xml",
      png: "image/png",
      jpg: "image/jpeg",
      gif: "image/gif",
      ico: "image/x-icon",
      woff: "font/woff",
      woff2: "font/woff2",
    };

    return new Response(content, {
      headers: { "Content-Type": mimeTypes[ext] || "application/octet-stream" },
    });
  } catch (e) {
    return null;
  }
}

export default Bun.serve({
  port,
  async fetch(req: Request) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // API routes
    if (pathname === "/api/status") {
      return new Response(
        JSON.stringify({
          ok: true,
          time: new Date().toISOString(),
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Check DB connection
    if (pathname === "/api/health") {
      try {
        const result = db.query("SELECT 1").get();
        return new Response(
          JSON.stringify({ ok: true, db: "connected" }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (e) {
        return new Response(
          JSON.stringify({ ok: false, error: "Database connection failed" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Serve static files in production, fallback to index.html for SPA routing
    if (isProduction) {
      const staticResponse = await serveStatic(pathname);
      if (staticResponse) return staticResponse;

      // Fallback to index.html for client-side routing
      const indexResponse = await serveStatic("index.html");
      if (indexResponse) return indexResponse;

      return new Response("Not found", { status: 404 });
    }

    // In dev mode, only serve API routes; Vite handles the frontend
    return new Response("Not found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${port}`);
console.log(`Mode: ${isProduction ? "production (serving static)" : "development (Vite handles frontend)"}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`CWD: ${process.cwd()}`);
console.log(`Dist dir: ${distDir}`);
