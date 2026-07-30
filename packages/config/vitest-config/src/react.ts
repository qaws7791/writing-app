import path from "node:path"

import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export type ReactVitestConfigOptions = Readonly<{
  /** 설정 파일이 있는 package 디렉터리의 절대 경로. */
  packageDirectory: string
}>

/**
 * React를 소비하는 workspace의 공통 Vitest 설정이다. 공유 UI 패키지가 source로 테스트
 * 번들에 들어오므로 package 로컬 `node_modules/react`로 alias와 dedupe를 고정한다. 이
 * 고정을 제거하면 번들에 React가 중복되어 Invalid hook call이 발생한다.
 */
export function createReactVitestConfig(options: ReactVitestConfigOptions) {
  const reactPath = path.resolve(options.packageDirectory, "node_modules/react")
  const reactDomPath = path.resolve(
    options.packageDirectory,
    "node_modules/react-dom"
  )

  return defineConfig({
    esbuild: {
      jsx: "automatic",
      jsxImportSource: "react",
    },
    plugins: [tsconfigPaths()],
    // root 단일 실행에서 zod가 package 밖 사본으로 externalize되면 schema helper가
    // undefined가 된다. 모든 project가 같은 규칙을 쓰도록 factory가 고정한다.
    ssr: { noExternal: ["zod"] },
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
      clearMocks: true,
      include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      restoreMocks: true,
      setupFiles: ["./vitest.setup.ts"],
      unstubEnvs: true,
      unstubGlobals: true,
    },
  })
}
