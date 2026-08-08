// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

const [githubOwner, githubRepository] = process.env.GITHUB_REPOSITORY?.split("/") ?? [];

export default defineConfig({
  site:
    process.env.SITE_URL ??
    (githubOwner ? `https://${githubOwner}.github.io` : "http://localhost:4321"),
  base: process.env.BASE_PATH ?? (githubRepository ? `/${githubRepository}` : "/"),
  output: "static",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    build: { chunkSizeWarningLimit: 1_000 },
  },
});
