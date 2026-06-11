import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Pin the workspace root to this project so Next doesn't pick up a stray
// lockfile higher up in the home directory.
const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  // Hide the dev "compiling…" / route indicator overlay.
  devIndicators: false,
};

export default nextConfig;
