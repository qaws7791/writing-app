import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

type ClientReferenceManifest = {
  readonly clientModules: Readonly<Record<string, unknown>>
  readonly entryJSFiles: Readonly<Record<string, readonly string[]>>
}

const nextDirectory = join(import.meta.dirname, "../apps/web/.next")
const manifestPath = join(
  nextDirectory,
  "server/app/page_client-reference-manifest.js"
)
const maximumInitialGzipBytes = 50_000

if (!existsSync(manifestPath)) {
  throw new Error(
    `web production build 산출물이 없습니다: ${manifestPath}. 먼저 web build를 실행하세요.`
  )
}

const source = readFileSync(manifestPath, "utf8")
const serializedManifest = source.match(/= (\{.*\});\s*$/s)?.[1]
if (serializedManifest === undefined) {
  throw new Error(
    `client reference manifest 형식을 읽을 수 없습니다: ${manifestPath}`
  )
}

const manifest = JSON.parse(serializedManifest) as ClientReferenceManifest
const landingClientModules = Object.keys(manifest.clientModules).filter(
  (moduleName) => moduleName.includes("/features/landing/")
)
const unexpectedModules = landingClientModules.filter(
  (moduleName) => !moduleName.includes("/landing-motion.tsx")
)
if (unexpectedModules.length > 0) {
  throw new Error(
    `랜딩 정적 section이 client 경계에 포함되었습니다: ${unexpectedModules.join(", ")}`
  )
}

const chunkPaths = [...new Set(Object.values(manifest.entryJSFiles).flat())]
const gzipBytes = chunkPaths.reduce(
  (total, chunkPath) =>
    total + gzipSync(readFileSync(join(nextDirectory, chunkPath))).byteLength,
  0
)
if (gzipBytes > maximumInitialGzipBytes) {
  throw new Error(
    `랜딩 초기 JS gzip 예산을 초과했습니다: ${gzipBytes} > ${maximumInitialGzipBytes}`
  )
}

console.log(
  `/: 초기 chunk ${chunkPaths.length}개, gzip ${gzipBytes} bytes, landing client module은 motion island만 포함`
)
