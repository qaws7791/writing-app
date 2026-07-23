import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

type ClientReferenceManifest = {
  readonly clientModules: Readonly<Record<string, unknown>>
  readonly entryJSFiles: Readonly<Record<string, readonly string[]>>
}

type RouteBundleCheck = {
  readonly app: "admin" | "web"
  readonly clientModuleBoundary?: {
    readonly allowed: RegExp
    readonly error: string
    readonly selected: RegExp
  }
  readonly forbiddenChunkContent?: {
    readonly error: string
    readonly pattern: RegExp
  }
  readonly manifestPath: string
  readonly maximumGzipBytes: number
  readonly name: string
  readonly success: string
}

const routeBundleChecks = [
  {
    app: "admin",
    forbiddenChunkContent: {
      error: "초기 chunk에 Recharts가 포함되었습니다",
      pattern: /recharts|Recharts|ResponsiveContainer/,
    },
    manifestPath: "server/app/(admin)/page_client-reference-manifest.js",
    maximumGzipBytes: 60_000,
    name: "/",
    success: "Recharts 없음",
  },
  {
    app: "admin",
    forbiddenChunkContent: {
      error: "초기 chunk에 Recharts가 포함되었습니다",
      pattern: /recharts|Recharts|ResponsiveContainer/,
    },
    manifestPath:
      "server/app/(admin)/analytics/page_client-reference-manifest.js",
    maximumGzipBytes: 75_000,
    name: "/analytics",
    success: "Recharts 없음",
  },
  {
    app: "web",
    clientModuleBoundary: {
      allowed: /\/landing-motion\.tsx/,
      error: "랜딩 정적 section이 client 경계에 포함되었습니다",
      selected: /\/features\/landing\//,
    },
    manifestPath: "server/app/page_client-reference-manifest.js",
    maximumGzipBytes: 50_000,
    name: "/",
    success: "landing client module은 motion island만 포함",
  },
  {
    app: "admin",
    forbiddenChunkContent: {
      error: "초기 chunk에 Lexical/Yjs가 포함되었습니다",
      pattern: /@lexical|LexicalEditor|\byjs\b|Y\.Doc/,
    },
    manifestPath:
      "server/app/(admin)/resources/page_client-reference-manifest.js",
    maximumGzipBytes: 275_000,
    name: "/resources",
    success: "Lexical/Yjs 없음",
  },
  {
    app: "admin",
    forbiddenChunkContent: {
      error: "초기 chunk에 Lexical/Yjs가 포함되었습니다",
      pattern: /@lexical|LexicalEditor|\byjs\b|Y\.Doc/,
    },
    manifestPath:
      "server/app/(admin)/resources/trash/page_client-reference-manifest.js",
    maximumGzipBytes: 275_000,
    name: "/resources/trash",
    success: "Lexical/Yjs 없음",
  },
] as const satisfies readonly RouteBundleCheck[]

for (const check of routeBundleChecks) {
  verifyRouteBundle(check)
}

function verifyRouteBundle(check: RouteBundleCheck) {
  const nextDirectory = join(import.meta.dirname, `../apps/${check.app}/.next`)
  const manifest = readClientReferenceManifest(
    nextDirectory,
    check.manifestPath
  )

  if (check.clientModuleBoundary !== undefined) {
    const unexpectedModules = Object.keys(manifest.clientModules).filter(
      (moduleName) =>
        check.clientModuleBoundary?.selected.test(moduleName) === true &&
        check.clientModuleBoundary.allowed.test(moduleName) === false
    )

    if (unexpectedModules.length > 0) {
      throw new Error(
        `${check.clientModuleBoundary.error}: ${unexpectedModules.join(", ")}`
      )
    }
  }

  const chunkPaths = [...new Set(Object.values(manifest.entryJSFiles).flat())]
  const chunks = chunkPaths.map((chunkPath) => ({
    content: readFileSync(join(nextDirectory, chunkPath)),
    path: chunkPath,
  }))
  const gzipBytes = chunks.reduce(
    (total, chunk) => total + gzipSync(chunk.content).byteLength,
    0
  )

  if (check.forbiddenChunkContent !== undefined) {
    const forbiddenChunks = chunks
      .filter((chunk) =>
        check.forbiddenChunkContent?.pattern.test(chunk.content.toString())
      )
      .map((chunk) => chunk.path)

    if (forbiddenChunks.length > 0) {
      throw new Error(
        `${check.name} ${check.forbiddenChunkContent.error}: ${forbiddenChunks.join(", ")}`
      )
    }
  }

  if (gzipBytes > check.maximumGzipBytes) {
    throw new Error(
      `${check.name} 초기 JS gzip 예산을 초과했습니다: ${gzipBytes} > ${check.maximumGzipBytes}`
    )
  }

  console.log(
    `${check.name}: 초기 chunk ${chunkPaths.length}개, gzip ${gzipBytes} bytes, ${check.success}`
  )
}

function readClientReferenceManifest(
  nextDirectory: string,
  relativePath: string
): ClientReferenceManifest {
  const manifestPath = join(nextDirectory, relativePath)
  if (!existsSync(manifestPath)) {
    throw new Error(
      `${nextDirectory} production build 산출물이 없습니다: ${manifestPath}. 먼저 ${nextDirectory} build를 실행하세요.`
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
