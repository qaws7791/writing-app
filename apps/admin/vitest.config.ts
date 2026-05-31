import path from "node:path"
import { fileURLToPath } from "node:url"

import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
// UI 패키지는 source로 테스트 번들에 들어오므로 React를 앱의 인스턴스로 고정한다.
// 이 alias와 dedupe를 제거하면 테스트 번들에 React가 중복되어 Invalid hook call이 발생할 수 있다.
const reactPath = path.resolve(__dirname, "node_modules/react")
const reactDomPath = path.resolve(__dirname, "node_modules/react-dom")

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: [
      { find: /^react$/, replacement: reactPath },
      { find: /^react-dom$/, replacement: reactDomPath },
      { find: /^react\/(.*)/, replacement: `${reactPath}/$1` },
      { find: /^react-dom\/(.*)/, replacement: `${reactDomPath}/$1` },
    ],
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
})
