import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

type ClientReferenceManifest = {
  readonly entryJSFiles: Readonly<Record<string, readonly string[]>>
}

const nextDirectory = join(import.meta.dirname, "../apps/admin/.next")
const rechartsPattern = /recharts|Recharts|ResponsiveContainer/
const routes = [
  {
    manifestPath: "server/app/(admin)/page_client-reference-manifest.js",
    maximumGzipBytes: 60_000,
    name: "/",
  },
  {
    manifestPath:
      "server/app/(admin)/analytics/page_client-reference-manifest.js",
    maximumGzipBytes: 75_000,
    name: "/analytics",
  },
] as const

for (const route of routes) {
  const manifest = readClientReferenceManifest(route.manifestPath)
  const chunkPaths = [...new Set(Object.values(manifest.entryJSFiles).flat())]
  const chunks = chunkPaths.map((chunkPath) => ({
    content: readFileSync(join(nextDirectory, chunkPath)),
    path: chunkPath,
  }))
  const gzipBytes = chunks.reduce(
    (total, chunk) => total + gzipSync(chunk.content).byteLength,
    0
  )
  const rechartsChunks = chunks
    .filter((chunk) => rechartsPattern.test(chunk.content.toString()))
    .map((chunk) => chunk.path)

  if (rechartsChunks.length > 0) {
    throw new Error(
      `${route.name} 초기 chunk에 Recharts가 포함되었습니다: ${rechartsChunks.join(", ")}`
    )
  }

  if (gzipBytes > route.maximumGzipBytes) {
    throw new Error(
      `${route.name} 초기 JS gzip 예산을 초과했습니다: ${gzipBytes} > ${route.maximumGzipBytes}`
    )
  }

  console.log(
    `${route.name}: 초기 chunk ${chunkPaths.length}개, gzip ${gzipBytes} bytes, Recharts 없음`
  )
}

function readClientReferenceManifest(
  relativePath: string
): ClientReferenceManifest {
  const manifestPath = join(nextDirectory, relativePath)
  if (!existsSync(manifestPath)) {
    throw new Error(
      `admin production build 산출물이 없습니다: ${manifestPath}. 먼저 admin build를 실행하세요.`
    )
  }

  const source = readFileSync(manifestPath, "utf8")
  const serializedManifest = source.match(/= (\{.*\});\s*$/s)?.[1]
  if (serializedManifest === undefined) {
    throw new Error(
      `client reference manifest 형식을 읽을 수 없습니다: ${manifestPath}`
    )
  }

  return JSON.parse(serializedManifest) as ClientReferenceManifest
}
