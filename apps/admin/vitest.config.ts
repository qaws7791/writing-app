import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const require = createRequire(import.meta.url)
const serverOnlyEmptyPath = path.join(
  path.dirname(require.resolve("server-only")),
  "empty.js"
)
// UI 패키지는 source로 테스트 번들에 들어오므로 React를 앱의 인스턴스로 고정한다.
// 이 alias와 dedupe를 제거하면 테스트 번들에 React가 중복되어 Invalid hook call이 발생할 수 있다.
const reactPath = path.resolve(__dirname, "node_modules/react")
const reactDomPath = path.resolve(__dirname, "node_modules/react-dom")
const resourceDocumentPath = path.resolve(
  __dirname,
  "../../packages/shared/resource-document/src"
)

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  plugins: [tsconfigPaths()],
  resolve: {
    alias: [
      { find: "server-only", replacement: serverOnlyEmptyPath },
      { find: "#resource-document", replacement: resourceDocumentPath },
      { find: /^react$/, replacement: reactPath },
      { find: /^react-dom$/, replacement: reactDomPath },
      { find: /^react\/(.*)/, replacement: `${reactPath}/$1` },
      { find: /^react-dom\/(.*)/, replacement: `${reactDomPath}/$1` },
    ],
    dedupe: ["react", "react-dom"],
  },
  ssr: {
    noExternal: ["@workspace/resource-document"],
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    maxWorkers: 2,
    setupFiles: ["./vitest.setup.ts"],
  },
})
