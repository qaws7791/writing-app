import { fileURLToPath } from "node:url"

import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url))

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  plugins: [tsconfigPaths({ ignoreConfigErrors: true })],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // UI 패키지는 아직 자체 테스트가 없어 워크스페이스 전체 테스트 실행만 예외적으로 통과시킨다.
    passWithNoTests: true,
    restoreMocks: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
})
