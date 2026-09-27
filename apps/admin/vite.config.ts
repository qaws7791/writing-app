import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import vinext from "vinext"
import { cloudflare } from "@cloudflare/vite-plugin"
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer"

export default defineConfig({
  resolve: {
    alias: {
      "@/server/http/api-fetch": fileURLToPath(
        new URL("./src/server/http/worker-api-fetch.ts", import.meta.url)
      ),
    },
  },
  plugins: [
    vinext({ images: { optimizer: { adapter: imagesOptimizer().adapter } } }),
    cloudflare({
      configPath: process.env["CLOUDFLARE_CONFIG"] ?? "wrangler.jsonc",
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],
})
