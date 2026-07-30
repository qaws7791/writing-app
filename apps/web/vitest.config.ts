import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { createReactVitestConfig } from "@workspace/vitest-config/react"
import { defineConfig, mergeConfig } from "vitest/config"

const require = createRequire(import.meta.url)
const serverOnlyEmptyPath = path.join(
  path.dirname(require.resolve("server-only")),
  "empty.js"
)

export default mergeConfig(
  createReactVitestConfig({
    packageDirectory: fileURLToPath(new URL(".", import.meta.url)),
  }),
  defineConfig({
    resolve: {
      alias: [{ find: "server-only", replacement: serverOnlyEmptyPath }],
    },
    test: {
      environment: "jsdom",
    },
  })
)
