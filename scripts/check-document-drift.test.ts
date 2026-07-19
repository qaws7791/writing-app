import { describe, expect, test } from "bun:test"
import path from "node:path"
import { pathToFileURL } from "node:url"

const documentDriftModuleUrl = pathToFileURL(
  path.join(import.meta.dir, "check-document-drift.ts")
).href

describe("문서 route drift fixture", () => {
  const healthRoute = { method: "GET", path: "/health" } as const
  const sessionRoute = { method: "GET", path: "/session" } as const

  test("실제 route가 추가되면 누락으로 실패한다", async () => {
    const { findRouteDrift } = await import(documentDriftModuleUrl)

    expect(findRouteDrift([healthRoute, sessionRoute], [healthRoute])).toEqual({
      missing: ["GET /session"],
      stale: [],
    })
  })

  test("실제 route가 삭제되면 오래된 문서로 실패한다", async () => {
    const { findRouteDrift } = await import(documentDriftModuleUrl)

    expect(findRouteDrift([healthRoute], [healthRoute, sessionRoute])).toEqual({
      missing: [],
      stale: ["GET /session"],
    })
  })
})

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
    expect(
      isHistoricalOrAnalysisDocumentPath(
        "docs/engineering/package-interface-and-import-rules.md"
      )
    ).toBe(false)
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

  test("현재 계약과 명시적 비범위 문구는 허용한다", async () => {
    const { findStaleResourceLibraryStatements } = await import(
      documentDriftModuleUrl
    )

    expect(
      findStaleResourceLibraryStatements(
        "docs/product/requirements/admin/req-adm-7-resource-library.md",
        [
          "폴더 중첩은 최대 3단계다.",
          "저장은 강한 ETag를 If-Match로 전송한다.",
          "실시간 공동 편집, 작업 공간 WebSocket과 구형 Yjs 상태는 비범위다.",
        ].join("\n")
      )
    ).toEqual([])
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
    expect(
      findStaleResourceLibraryStatements(
        "docs/work/2026-07-20-resource-library-sync/audit.md",
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
    expect(isValidTaskDocumentDirectoryName("2026-07-20-API-unification")).toBe(
      false
    )
  })
})

describe("capability 소유권 대표 탐색 경로 fixture", () => {
  const completeNavigation = [
    "## capability 소유권·대표 탐색 경로",
    "| 학습 단계 완료 |",
    "[공개 계약](../../packages/contracts/src/learning/learner-api.ts)",
    "[순수 policy](../../packages/core/src/modules/learning/domain/complete-step-effect-plan.ts)",
    "[app-owned adapter](../../apps/api/src/adapters/learning/learner-transition-drizzle.repository.ts)",
    "[composition](../../apps/api/src/learner-api-core.ts)",
    "[route](../../apps/api/src/modules/learning/learner-transition.routes.ts)",
    "| 관리자 content 발행 |",
    "[공개 계약](../../packages/contracts/src/admin/content-data.ts)",
    "[순수 use case](../../packages/core/src/modules/content/application/use-cases/admin-course.use-case.ts)",
    "[app-owned adapter](../../apps/api/src/adapters/content/admin-course-drizzle.repository.ts)",
    "[composition](../../apps/api/src/modules/admin-content/admin-content.composition.ts)",
    "[route](../../apps/api/src/modules/admin-content/curriculum-editor.routes.ts)",
    "| 자료실 문서 조회 |",
    "[공개 계약](../../packages/contracts/src/admin/resource-library-data.ts)",
    "[문서 wire 계약](../../packages/contracts/src/admin/admin-resource-documents.ts)",
    "[순수 use case](../../packages/core/src/modules/resource-library/application/use-cases/resource-document.use-case.ts)",
    "[app-owned adapter](../../apps/api/src/adapters/resource-library/resource-document-drizzle.repository.ts)",
    "[composition](../../apps/api/src/modules/admin-resource-library/admin-resource-library.composition.ts)",
    "[route](../../apps/api/src/modules/admin-resource-library/resource-documents.routes.ts)",
    "product backend executable은 `apps/api` 하나이며 학습자 경로와 `/api/admin/*` 관리자 경로를 함께 소유한다.",
    "관리자 foundation과 여섯 capability는 별도 subprocess 없이 계약 suite로 검증한다.",
  ].join("\n")

  test("세 시나리오의 source link가 순서대로 있으면 통과한다", async () => {
    const { findCapabilityOwnershipNavigationDrift } = await import(
      documentDriftModuleUrl
    )

    expect(findCapabilityOwnershipNavigationDrift(completeNavigation)).toEqual(
      []
    )
  })

  test("대표 source link 또는 target-only 계약 표기가 삭제되면 실패한다", async () => {
    const { findCapabilityOwnershipNavigationDrift } = await import(
      documentDriftModuleUrl
    )
    const withoutResourceRoute = completeNavigation.replace(
      "[route](../../apps/api/src/modules/admin-resource-library/resource-documents.routes.ts)\n",
      ""
    )
    const withoutTargetContract = withoutResourceRoute.replace(
      "관리자 foundation과 여섯 capability는 별도 subprocess 없이 계약 suite로 검증한다.",
      ""
    )

    expect(
      findCapabilityOwnershipNavigationDrift(withoutTargetContract)
    ).toEqual([
      "target-only 계약 상태 marker",
      "자료실 문서 조회 [route](../../apps/api/src/modules/admin-resource-library/resource-documents.routes.ts) source link",
    ])
  })

  test("세 대표 시나리오 중 하나가 삭제되면 실패한다", async () => {
    const { findCapabilityOwnershipNavigationDrift } = await import(
      documentDriftModuleUrl
    )

    expect(
      findCapabilityOwnershipNavigationDrift(
        completeNavigation.replace("| 학습 단계 완료 |\n", "")
      )
    ).toEqual(["학습 단계 완료 scenario"])
    expect(
      findCapabilityOwnershipNavigationDrift(
        completeNavigation.replace("| 관리자 content 발행 |\n", "")
      )
    ).toEqual(["관리자 content 발행 scenario"])
    expect(
      findCapabilityOwnershipNavigationDrift(
        completeNavigation.replace("| 자료실 문서 조회 |\n", "")
      )
    ).toEqual(["자료실 문서 조회 scenario"])
  })
})
