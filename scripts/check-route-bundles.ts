import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

type ClientReferenceManifest = {
  readonly clientModules: Readonly<Record<string, unknown>>
  readonly entryJSFiles: Readonly<Record<string, readonly string[]>>
}

export type RouteBundleCheck = {
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

export type RouteChunkGzipSize = {
  readonly gzipBytes: number
  readonly path: string
}

export const routeBundleChecks = [
  {
    app: "admin",
    forbiddenChunkContent: {
      error: "초기 chunk에 Recharts가 포함되었습니다",
      pattern: /recharts|Recharts|ResponsiveContainer/,
    },
    manifestPath: "server/app/(admin)/page_client-reference-manifest.js",
    maximumGzipBytes: 75_000,
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
    maximumGzipBytes: 90_000,
    name: "/analytics",
    success: "Recharts 없음",
  },
  {
    app: "web",
    clientModuleBoundary: {
      allowed: /$^/,
      error: "랜딩 feature가 client 경계에 포함되었습니다",
      selected: /\/features\/landing\//,
    },
    manifestPath: "server/app/page_client-reference-manifest.js",
    maximumGzipBytes: 65_000,
    name: "/",
    success: "landing client module 0개",
  },
  {
    app: "web",
    manifestPath: "server/app/(learner)/app/page_client-reference-manifest.js",
    maximumGzipBytes: 220_000,
    name: "/app",
    success: "learner home 예산 이내",
  },
  {
    app: "web",
    manifestPath:
      "server/app/(lesson)/app/lesson/page_client-reference-manifest.js",
    maximumGzipBytes: 235_000,
    name: "/app/lesson",
    success: "lesson shell 예산 이내",
  },
] as const satisfies readonly RouteBundleCheck[]

if (import.meta.main) {
  for (const check of routeBundleChecks) {
    verifyRouteBundle(check)
  }
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
  const chunks = chunkPaths.map((chunkPath) => {
    const content = readFileSync(join(nextDirectory, chunkPath))
    return {
      content,
      gzipBytes: gzipSync(content).byteLength,
      path: chunkPath,
    }
  })
  const gzipBytes = chunks.reduce((total, chunk) => total + chunk.gzipBytes, 0)

  if (check.forbiddenChunkContent !== undefined) {
    const forbiddenChunks = chunks
      .filter((chunk) =>
        check.forbiddenChunkContent?.pattern.test(chunk.content.toString())
      )
      .map((chunk) => chunk.path)

    if (forbiddenChunks.length > 0) {
      throw new Error(
        `${check.name} ${check.forbiddenChunkContent.error}: ${forbiddenChunks.join(", ")}\n${formatRouteChunkBreakdown(chunks)}`
      )
    }
  }

  assertRouteBundleBudget(check, gzipBytes, chunks)

  console.log(
    `${check.name}: 초기 chunk ${chunkPaths.length}개, gzip ${gzipBytes} bytes, ${check.success}`
  )
}

export function formatRouteChunkBreakdown(
  chunks: readonly RouteChunkGzipSize[]
): string {
  const lines = [...chunks]
    .sort(
      (left, right) =>
        right.gzipBytes - left.gzipBytes || left.path.localeCompare(right.path)
    )
    .map((chunk) => `- ${chunk.path}: ${chunk.gzipBytes} bytes`)

  return `초기 chunk gzip 원인:\n${lines.join("\n")}`
}

export function assertRouteBundleBudget(
  check: Pick<RouteBundleCheck, "maximumGzipBytes" | "name">,
  gzipBytes: number,
  chunks: readonly RouteChunkGzipSize[]
): void {
  if (gzipBytes <= check.maximumGzipBytes) return

  throw new Error(
    `${check.name} 초기 JS gzip 예산을 초과했습니다: ${gzipBytes} > ${check.maximumGzipBytes}\n${formatRouteChunkBreakdown(chunks)}`
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
