import { readFileSync } from "node:fs"
import { dirname, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import {
  createRepositoryInventory,
  readModuleReferences,
} from "@workspace/repository-tooling"

const adminSourceRoot = dirname(fileURLToPath(import.meta.url))

describe("apps/admin architecture", () => {
  it("소스 루트는 명시된 아키텍처 계층만 사용한다", () => {
    const allowedRootEntries = new Set([
      "app",
      "architecture.test.ts",
      "entities",
      "features",
      "proxy.ts",
      "server",
      "shared",
    ])
    const violations = readSourceFiles(adminSourceRoot)
      .map(toSourceRelativePath)
      .filter(
        (filePath) => !allowedRootEntries.has(filePath.split("/")[0] ?? "")
      )

    expect(violations).toEqual([])
  })

  it("앱 내부 import는 절대 경로를 사용한다", () => {
    const violations = readSourceFiles(adminSourceRoot).flatMap((filePath) =>
      readImports(filePath)
        .filter((source) => source.startsWith("."))
        .map((source) => formatViolation(filePath, source))
    )

    expect(violations).toEqual([])
  })

  it("계층 의존성은 app에서 shared 방향으로만 흐른다", () => {
    const violations = readSourceFiles(adminSourceRoot).flatMap((filePath) =>
      readImports(filePath)
        .filter((source) => isLayerDependencyViolation(filePath, source))
        .map((source) => formatViolation(filePath, source))
    )

    expect(violations).toEqual([])
  })

  it("feature는 다른 feature 내부를 import하지 않는다", () => {
    const violations = readSourceFiles(adminSourceRoot).flatMap((filePath) =>
      readImports(filePath)
        .filter((source) => isCrossFeatureImport(filePath, source))
        .map((source) => formatViolation(filePath, source))
    )

    expect(violations).toEqual([])
  })

  it("feature model은 React와 I/O 계층을 알지 않는다", () => {
    const violations = readSourceFiles(adminSourceRoot)
      .filter(isFeatureModelFile)
      .flatMap((filePath) =>
        readImports(filePath)
          .filter(isFeatureModelRuntimeDependency)
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("Client Component는 server 모듈을 import하지 않는다", () => {
    const violations = readSourceFiles(adminSourceRoot)
      .filter(isClientComponentFile)
      .flatMap((filePath) =>
        readImports(filePath)
          .filter(isServerModuleImport)
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("Client Component는 runtime config parser를 번들에 포함하지 않는다", () => {
    const violations = readSourceFiles(adminSourceRoot)
      .filter(isClientComponentFile)
      .flatMap((filePath) =>
        readImports(filePath)
          .filter((source) => source === "@/shared/config/admin-runtime-config")
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("feature UI는 DAL을 직접 import하지 않는다", () => {
    const violations = readSourceFiles(adminSourceRoot)
      .filter(isFeatureUiFile)
      .flatMap((filePath) =>
        readImports(filePath)
          .filter((source) => source.includes("/server/"))
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("admin wire DTO는 API, server와 canonical model 경계에서만 import한다", () => {
    const violations = readSourceFiles(adminSourceRoot)
      .filter((filePath) => !isAdminContractBoundaryFile(filePath))
      .flatMap((filePath) =>
        readImports(filePath)
          .filter((source) => source === "@workspace/contracts/admin")
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("admin app은 core와 제거된 lesson package를 직접 import하지 않는다", () => {
    const violations = readSourceFiles(adminSourceRoot).flatMap((filePath) =>
      readImports(filePath)
        .filter(
          (source) =>
            isWorkspacePackage(source, "core") ||
            isWorkspacePackage(source, "lesson")
        )
        .map((source) => formatViolation(filePath, source))
    )

    expect(violations).toEqual([])
  })

  it("삭제된 중앙 관리자 API와 구 아키텍처 경로를 재도입하지 않는다", () => {
    const legacyPrefixes = [
      "@/components/",
      "@/features/auth/",
      "@/features/chat/",
      "@/features/courses/",
      "@/features/resources/",
      "@/features/settings/",
      "@/features/shared/",
      "@/features/users/",
      "@/lib/",
    ]
    const legacyExactImports = ["@/runtime-config", "@/runtime-config-server"]
    const removedCentralApi = [
      "@/lib/api/admin-api",
      "@/lib/api/http-admin-api",
      "@/lib/api/get-server-admin-api",
    ]
    const importViolations = readSourceFiles(adminSourceRoot).flatMap(
      (filePath) =>
        readImports(filePath)
          .filter(
            (source) =>
              removedCentralApi.includes(source) ||
              legacyExactImports.includes(source) ||
              legacyPrefixes.some(
                (prefix) => source === prefix || source.startsWith(prefix)
              )
          )
          .map((source) => formatViolation(filePath, source))
    )

    expect(importViolations).toEqual([])
  })
})

function readSourceFiles(rootPath: string): string[] {
  return createRepositoryInventory({ root: rootPath }).map((file) => file.path)
}

function readImports(filePath: string): string[] {
  return readModuleReferences(filePath).map((reference) => reference.source)
}

function formatViolation(filePath: string, source: string): string {
  return `${toSourceRelativePath(filePath)} -> ${source}`
}

function toSourceRelativePath(filePath: string): string {
  return relative(adminSourceRoot, filePath).split(sep).join("/")
}

function isLayerDependencyViolation(filePath: string, source: string): boolean {
  if (!source.startsWith("@/")) return false

  const sourceLayer = toSourceRelativePath(filePath).split("/")[0]
  const targetLayer = source.slice(2).split("/")[0]
  const allowedTargetsBySource: Readonly<Record<string, readonly string[]>> = {
    app: ["app", "entities", "features", "server", "shared"],
    entities: ["entities", "shared"],
    features: ["entities", "features", "server", "shared"],
    server: ["entities", "server", "shared"],
    shared: ["shared"],
  }
  const allowedTargets = allowedTargetsBySource[sourceLayer ?? ""]

  return (
    allowedTargets !== undefined && !allowedTargets.includes(targetLayer ?? "")
  )
}

function isCrossFeatureImport(filePath: string, source: string): boolean {
  const sourcePathParts = toSourceRelativePath(filePath).split("/")
  const importedFeature = source.match(/^@\/features\/([^/]+)/u)?.[1]

  return (
    sourcePathParts[0] === "features" &&
    importedFeature !== undefined &&
    importedFeature !== sourcePathParts[1]
  )
}

function isFeatureModelFile(filePath: string): boolean {
  return /^features\/[^/]+\/model\//u.test(toSourceRelativePath(filePath))
}

function isFeatureModelRuntimeDependency(source: string): boolean {
  return (
    source === "react" ||
    source.startsWith("react/") ||
    source === "next" ||
    source.startsWith("next/") ||
    source.startsWith("@workspace/http-client") ||
    (source.startsWith("@workspace/ui") &&
      source !== "@workspace/ui/lib/safe-navigation-path") ||
    /^@\/features\/[^/]+\/(?:api|hooks|server|ui)\//u.test(source) ||
    source.startsWith("@/server/")
  )
}

function isClientComponentFile(filePath: string): boolean {
  return /^\s*["']use client["']/u.test(readFileSync(filePath, "utf8"))
}

function isServerModuleImport(source: string): boolean {
  return source.startsWith("@/server/") || source.includes("/server/")
}

function isFeatureUiFile(filePath: string): boolean {
  return /^features\/[^/]+\/ui\//u.test(toSourceRelativePath(filePath))
}

function isAdminContractBoundaryFile(filePath: string): boolean {
  const path = toSourceRelativePath(filePath)

  return (
    /^entities\/[^/]+\/model\//u.test(path) ||
    /^features\/[^/]+\/(?:api|model|server)\//u.test(path)
  )
}

function isWorkspacePackage(source: string, packageName: string): boolean {
  return (
    source === `@workspace/${packageName}` ||
    source.startsWith(`@workspace/${packageName}/`)
  )
}
