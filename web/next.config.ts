import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  basePath,
  assetPrefix: basePath || undefined,
  output: process.env.BUILD_STATIC === "1" ? "export" : undefined,
  trailingSlash: process.env.BUILD_STATIC === "1",
  images: {
    unoptimized: process.env.BUILD_STATIC === "1",
  },
  // Parent lockfile at ~/package-lock.json confuses Turbopack; pin this app.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
