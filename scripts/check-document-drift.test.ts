import { describe, expect, test } from "bun:test"
import path from "node:path"
import { pathToFileURL } from "node:url"

const documentDriftModuleUrl = pathToFileURL(
  path.join(import.meta.dir, "check-document-drift.ts")
).href

describe("문서 검사 범위 fixture", () => {
  test("product 문서는 현재 문서 범위로 검사한다", async () => {
    const { isDocumentDriftMarkdownPath } = await import(documentDriftModuleUrl)

    expect(
      isDocumentDriftMarkdownPath("docs/product/admin-operations.md")
    ).toBe(true)
  })

  test("ADR와 work/archive 문서는 현재 사실 검사에서 제외한다", async () => {
    const { isHistoricalOrAnalysisDocumentPath } = await import(
      documentDriftModuleUrl
    )

    expect(
      isHistoricalOrAnalysisDocumentPath(
        "docs/engineering/adr/ADR-0015-platform-runtime-package-ownership.md"
      )
    ).toBe(true)
    expect(
      isHistoricalOrAnalysisDocumentPath(
        "docs/work/2026-07-20-api-unification/plan.md"
      )
    ).toBe(true)
    expect(
      isHistoricalOrAnalysisDocumentPath(
        "docs/archive/2026-07-20-api-unification/audit.md"
      )
    ).toBe(true)
  })
})

describe("자료실 현재 문서 stale sentinel fixture", () => {
  test("현재 product 문서의 깊이 제한 없는 공동 편집 설명을 찾는다", async () => {
    const { findStaleResourceLibraryStatements } = await import(
      documentDriftModuleUrl
    )

    expect(
      findStaleResourceLibraryStatements(
        "docs/product/admin-operations.md",
        [
          "자료실 폴더는 깊이 제한 없이 중첩한다.",
          "같은 문서를 저장 버튼 없이 공동 편집한다.",
        ].join("\n")
      )
    ).toEqual([
      { line: 1, marker: "깊이 제한 없는 트리" },
      { line: 2, marker: "자동 공동 편집" },
    ])
  })

  test("ADR와 단계별 실행 계획은 역사·분석 범위로 보존한다", async () => {
    const { findStaleResourceLibraryStatements } = await import(
      documentDriftModuleUrl
    )
    const historicalStatement =
      "ResourceWorkspaceSync는 깊이 제한 없이 Yjs snapshot 투영을 제공한다."

    expect(
      findStaleResourceLibraryStatements(
        "docs/engineering/adr/ADR-0004-resource-library-collaboration-boundary.md",
        historicalStatement
      )
    ).toEqual([])
  })
})

describe("작업 문서 디렉터리 이름 fixture", () => {
  test("유효한 날짜와 kebab-case 작업 이름만 허용한다", async () => {
    const { isValidTaskDocumentDirectoryName } = await import(
      documentDriftModuleUrl
    )

    expect(isValidTaskDocumentDirectoryName("2026-07-20-api-unification")).toBe(
      true
    )
    expect(isValidTaskDocumentDirectoryName("2026-02-30-api-unification")).toBe(
      false
    )
    expect(isValidTaskDocumentDirectoryName("api-unification")).toBe(false)
  })
})
