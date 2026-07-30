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
      // DOM이 필요한 `.test.tsx`만 파일 상단 `@vitest-environment jsdom`으로 jsdom을 지불한다.
      environment: "node",
      maxWorkers: 2,
    },
  })
)
