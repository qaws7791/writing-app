import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import {
  createRepositoryInventory,
  readModuleReferences,
} from "@workspace/repository-tooling"

const webSourceRoot = dirname(fileURLToPath(import.meta.url))
const webPackageJsonPath = resolve(webSourceRoot, "../package.json")

describe("apps/web architecture", () => {
  it("소스 루트는 명시된 아키텍처 계층만 사용한다", () => {
    const allowedRootEntries = new Set([
      "app",
      "architecture.test.ts",
      "entities",
      "features",
      "instrumentation.ts",
      "proxy.ts",
      "proxy.test.ts",
      "server",
      "shared",
    ])
    const violations = readSourceFiles(webSourceRoot)
      .map(toSourceRelativePath)
      .filter(
        (filePath) => !allowedRootEntries.has(filePath.split("/")[0] ?? "")
      )

    expect(violations).toEqual([])
  })

  it("앱 내부 import는 절대 경로를 사용한다", () => {
    const violations = readSourceFiles(webSourceRoot).flatMap((filePath) =>
      readImports(filePath)
        .filter((source) => source.startsWith("."))
        .map((source) => formatViolation(filePath, source))
    )

    expect(violations).toEqual([])
  })

  it("계층 의존성은 app에서 shared 방향으로만 흐른다", () => {
    const violations = readSourceFiles(webSourceRoot).flatMap((filePath) =>
      readImports(filePath)
        .filter((source) => isLayerDependencyViolation(filePath, source))
        .map((source) => formatViolation(filePath, source))
    )

    expect(violations).toEqual([])
  })

  it("feature는 다른 feature 내부를 import하지 않는다", () => {
    const violations = readSourceFiles(webSourceRoot).flatMap((filePath) =>
      readImports(filePath)
        .filter((source) => isCrossFeatureImport(filePath, source))
        .map((source) => formatViolation(filePath, source))
    )

    expect(violations).toEqual([])
  })

  it("feature model은 React와 I/O 계층을 알지 않는다", () => {
    const violations = readSourceFiles(webSourceRoot)
      .filter(isFeatureModelFile)
      .flatMap((filePath) =>
        readImports(filePath)
          .filter(isFeatureModelRuntimeDependency)
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("Client Component는 server 모듈을 import하지 않는다", () => {
    const violations = readSourceFiles(webSourceRoot)
      .filter(isClientComponentFile)
      .flatMap((filePath) =>
        readImports(filePath)
          .filter(isServerModuleImport)
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("feature UI는 DAL을 직접 import하지 않는다", () => {
    const violations = readSourceFiles(webSourceRoot)
      .filter(isFeatureUiFile)
      .flatMap((filePath) =>
        readImports(filePath)
          .filter((source) => source.includes("/server/"))
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("web app은 core package를 직접 import하지 않는다", () => {
    const violations = readSourceFiles(webSourceRoot).flatMap((filePath) => {
      return readImports(filePath)
        .filter(isWorkspaceCoreImport)
        .map((source) => formatViolation(filePath, source))
    })

    expect(violations).toEqual([])
  })

  it("web app은 제거된 lesson package를 import하지 않는다", () => {
    const violations = readSourceFiles(webSourceRoot).flatMap((filePath) => {
      return readImports(filePath)
        .filter(isWorkspaceLessonImport)
        .map((source) => formatViolation(filePath, source))
    })

    expect(violations).toEqual([])
  })

  it("web app은 openapi-fetch에 의존하지 않는다", () => {
    const packageDependencies = readPackageDependencies(webPackageJsonPath)
    const importViolations = readSourceFiles(webSourceRoot).flatMap(
      (filePath) => {
        return readImports(filePath)
          .filter(isOpenApiFetchImport)
          .map((source) => formatViolation(filePath, source))
      }
    )

    expect(packageDependencies).not.toContain("openapi-fetch")
    expect(importViolations).toEqual([])
  })

  it("generated OpenAPI 타입 경로를 다시 도입하지 않는다", () => {
    const sourceFiles = readSourceFiles(webSourceRoot)
    const packageDependencies = readPackageDependencies(webPackageJsonPath)
    const violations = sourceFiles.flatMap((filePath) => {
      return readImports(filePath)
        .filter(isGeneratedOpenApiImport)
        .map((source) => formatViolation(filePath, source))
    })
    const forbiddenFiles = sourceFiles.filter(isWritingAppApiContractFile)

    expect(packageDependencies).not.toContain("openapi-typescript")
    expect(forbiddenFiles).toEqual([])
    expect(violations).toEqual([])
  })

  it("learner feature는 내부 content 계약을 import하지 않는다", () => {
    const violations = readSourceFiles(webSourceRoot)
      .filter(isLearnerFeatureFile)
      .flatMap((filePath) =>
        readImports(filePath)
          .filter(isWorkspaceContentContractImport)
          .map((source) => formatViolation(filePath, source))
      )

    expect(violations).toEqual([])
  })

  it("매칭 스텝 presentation 모델은 web feature 내부에서만 import한다", () => {
    const violations = readSourceFiles(webSourceRoot).flatMap((filePath) => {
      return readImports(filePath)
        .filter(isWorkspaceMatchPresentationImport)
        .map((source) => formatViolation(filePath, source))
    })

    expect(violations).toEqual([])
  })
})

function readPackageDependencies(packageJsonPath: string): string[] {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    readonly dependencies?: PackageDependencyMap
    readonly devDependencies?: PackageDependencyMap
  }

  return [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ].sort()
}

type PackageDependencyMap = {
  readonly [dependencyName: string]: string
}

function readSourceFiles(rootPath: string): string[] {
  return createRepositoryInventory({ root: rootPath }).map((file) => file.path)
}

function readImports(filePath: string): string[] {
  return readModuleReferences(filePath).map((reference) => reference.source)
}

function isWorkspaceCoreImport(source: string): boolean {
  return source === "@workspace/core" || source.startsWith("@workspace/core/")
}

function isWorkspaceLessonImport(source: string): boolean {
  return (
    source === "@workspace/lesson" || source.startsWith("@workspace/lesson/")
  )
}

function isOpenApiFetchImport(source: string): boolean {
  return source === "openapi-fetch" || source.startsWith("openapi-fetch/")
}

function isGeneratedOpenApiImport(source: string): boolean {
  return (
    source.startsWith("@/lib/api/generated/") ||
    source === "@/lib/api/writing-app-api-contract"
  )
}

function isWritingAppApiContractFile(filePath: string): boolean {
  const path = relative(webSourceRoot, filePath).split(sep).join("/")

  return (
    path.startsWith("lib/api/generated/") ||
    path === "lib/api/writing-app-api-contract.ts"
  )
}

function isWorkspaceMatchPresentationImport(source: string): boolean {
  return (
    source === "@workspace/contracts/learning/learning-match-presentation" ||
    source === "@workspace/core/learning/learning-match-presentation"
  )
}

function isLearnerFeatureFile(filePath: string): boolean {
  return relative(webSourceRoot, filePath)
    .split(sep)
    .join("/")
    .startsWith("features/")
}

function isWorkspaceContentContractImport(source: string): boolean {
  return (
    source === "@workspace/contracts/content" ||
    source.startsWith("@workspace/contracts/content/")
  )
}

function formatViolation(filePath: string, source: string): string {
  return `${toSourceRelativePath(filePath)} -> ${source}`
}

function toSourceRelativePath(filePath: string): string {
  return relative(webSourceRoot, filePath).split(sep).join("/")
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
