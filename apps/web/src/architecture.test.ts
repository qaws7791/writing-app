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

  it("generated OpenAPI 타입은 transport contract 파일에서만 import한다", () => {
    const violations = readSourceFiles(webSourceRoot)
      .filter((filePath) => !isWritingAppApiContractFile(filePath))
      .flatMap((filePath) => {
        return readImports(filePath)
          .filter(isGeneratedOpenApiImport)
          .map((source) => formatViolation(filePath, source))
      })

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
  return source === "@/lib/api/generated/writing-app-api"
}

function isWritingAppApiContractFile(filePath: string): boolean {
  return (
    relative(webSourceRoot, filePath).split(sep).join("/") ===
    "lib/api/writing-app-api-contract.ts"
  )
}

function isWorkspaceMatchPresentationImport(source: string): boolean {
  return (
    source === "@workspace/contracts/learning/learning-match-presentation" ||
    source === "@workspace/core/learning/learning-match-presentation"
  )
}

function formatViolation(filePath: string, source: string): string {
  return `${relative(webSourceRoot, filePath).split(sep).join("/")} -> ${source}`
}
