import { readdirSync, readFileSync } from "node:fs"
import { relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, test } from "vitest"

const apiSrcRootPath = fileURLToPath(new URL("../", import.meta.url))
const guardTestRelativePath = "http/openapi-app-guard.test.ts"

function collectTypeScriptFiles(directoryPath: string): string[] {
  return readdirSync(directoryPath, { withFileTypes: true }).flatMap(
    (entry) => {
      const entryPath = `${directoryPath}/${entry.name}`

      if (entry.isDirectory()) {
        return collectTypeScriptFiles(entryPath)
      }

      if (!entry.isFile() || !entry.name.endsWith(".ts")) {
        return []
      }

      return [entryPath]
    }
  )
}

function findFilesContaining(sourceText: string): string[] {
  return collectTypeScriptFiles(apiSrcRootPath)
    .filter((filePath) => readFileSync(filePath, "utf8").includes(sourceText))
    .map((filePath) => relative(apiSrcRootPath, filePath).replaceAll("\\", "/"))
    .filter((relativePath) => relativePath !== guardTestRelativePath)
    .sort()
}

describe("OpenAPIHono 구조 가드", () => {
  test("OpenAPIHono 직접 생성은 중앙 팩토리에서만 허용한다", () => {
    expect(findFilesContaining("new OpenAPIHono")).toEqual([
      "http/create-openapi-app.ts",
    ])
  })

  test("defaultHook 설정은 중앙 팩토리에서만 허용한다", () => {
    expect(findFilesContaining("defaultHook:")).toEqual([
      "http/create-openapi-app.ts",
    ])
  })

  test("검증 실패 ValidationError 변환 메시지는 공통 훅에서만 정의한다", () => {
    expect(
      findFilesContaining(
        'throw new ValidationError("유효하지 않은 요청입니다."'
      )
    ).toEqual(["http/default-hook.ts"])
  })
})
