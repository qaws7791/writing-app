import { fileURLToPath } from "node:url"

import { createReactVitestConfig } from "@workspace/vitest-config/react"
import { defineConfig, mergeConfig } from "vitest/config"

const workspaceRoot = fileURLToPath(new URL("../../..", import.meta.url))

export default mergeConfig(
  createReactVitestConfig({
    packageDirectory: fileURLToPath(new URL(".", import.meta.url)),
  }),
  defineConfig({
    // 공유 UI는 workspace 밖 경로를 열지 않고 monorepo 루트까지만 허용한다.
    server: { fs: { allow: [workspaceRoot] } },
    test: { environment: "jsdom" },
  })
)
