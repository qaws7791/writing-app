import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

type ClientReferenceManifest = {
  readonly entryJSFiles: Readonly<Record<string, readonly string[]>>
}

const nextDirectory = join(import.meta.dirname, "../apps/admin/.next")
const lexicalOrYjsPattern = /@lexical|LexicalEditor|\byjs\b|Y\.Doc/
const emptyResourceRoutes = [
  {
    manifestPath:
      "server/app/(admin)/resources/page_client-reference-manifest.js",
    name: "/resources",
  },
  {
    manifestPath:
      "server/app/(admin)/resources/trash/page_client-reference-manifest.js",
    name: "/resources/trash",
  },
] as const
const maximumInitialGzipBytes = 275_000

for (const route of emptyResourceRoutes) {
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
  const heavyChunks = chunks
    .filter((chunk) => lexicalOrYjsPattern.test(chunk.content.toString()))
    .map((chunk) => chunk.path)

  if (heavyChunks.length > 0) {
    throw new Error(
      `${route.name} 초기 chunk에 Lexical/Yjs가 포함되었습니다: ${heavyChunks.join(", ")}`
    )
  }

  if (gzipBytes > maximumInitialGzipBytes) {
    throw new Error(
      `${route.name} 초기 JS gzip 예산을 초과했습니다: ${gzipBytes} > ${maximumInitialGzipBytes}`
    )
  }

  console.log(
    `${route.name}: 초기 chunk ${chunkPaths.length}개, gzip ${gzipBytes} bytes, Lexical/Yjs 없음`
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
