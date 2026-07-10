import { describe, expect, it, vi } from "vitest"

import {
  createResourceCollaborationUpgradeHandler,
  type ResourceCollaborationUpgrade,
} from "@/collaboration/resource-collaboration-upgrade"
import { createTestAdminSessionResolver } from "@/routes/test-dependencies"
import {
  type ResourceCollaborationUseCase,
  toResourceDocumentId,
} from "@workspace/core/modules/resource-library/api"
import { createResourceDocumentSnapshot } from "@workspace/resource-document"

const adminOrigin = "http://admin.example.test"
const documentId = toResourceDocumentId("resource-document-1")

describe("자료 문서 공동 편집 WebSocket upgrade", () => {
  it("동일 Origin과 관리자 세션의 활성 문서에 인증 주체와 snapshot을 전달한다", async () => {
    const snapshot = createSnapshot("초기 문서")
    const collaborationService = createCollaborationService()
    const upgrade = vi.fn<ResourceCollaborationUpgrade>(() => true)

    vi.mocked(collaborationService.prepare).mockResolvedValue({
      kind: "ok",
      value: { snapshot, stateVersion: 8 },
    })

    const response = await createHandler(collaborationService)(
      createRequest(),
      upgrade
    )

    expect(response).toBeUndefined()
    expect(collaborationService.prepare).toHaveBeenCalledWith({ documentId })
    expect(upgrade).toHaveBeenCalledWith(expect.any(Request), {
      actorId: "admin-1",
      channel: "collaboration",
      initialSnapshot: snapshot,
      initialStateVersion: 8,
      roomId: documentId,
    })
  })

  it.each([
    {
      expectedStatus: 403,
      request: createRequest({ origin: "http://attacker.example.test" }),
      scenario: "다른 Origin",
    },
    {
      expectedStatus: 400,
      request: createRequest({ search: "?token=secret" }),
      scenario: "URL query",
    },
    {
      expectedStatus: 426,
      request: createRequest({ upgrade: false }),
      scenario: "일반 HTTP 요청",
    },
  ])(
    "$scenario 요청을 문서 조회 전에 거부한다",
    async ({ expectedStatus, request }) => {
      const collaborationService = createCollaborationService()
      const response = await createHandler(collaborationService)(
        request,
        () => true
      )

      expect(response?.status).toBe(expectedStatus)
      expect(collaborationService.prepare).not.toHaveBeenCalled()
    }
  )

  it("관리자 세션이 없으면 문서를 조회하지 않고 401을 반환한다", async () => {
    const collaborationService = createCollaborationService()
    const handler = createResourceCollaborationUpgradeHandler({
      adminOrigin,
      collaborationService,
      sessionResolver: createTestAdminSessionResolver({
        activeToken: "different-token",
      }),
    })

    const response = await handler(createRequest(), () => true)

    expect(response?.status).toBe(401)
    expect(collaborationService.prepare).not.toHaveBeenCalled()
  })

  it.each([
    { expectedStatus: 404, result: { kind: "not-found" } as const },
    { expectedStatus: 409, result: { kind: "inactive" } as const },
    { expectedStatus: 500, result: { kind: "invalid-state" } as const },
  ])(
    "준비 결과 $result.kind를 HTTP $expectedStatus로 변환한다",
    async ({ expectedStatus, result }) => {
      const collaborationService = createCollaborationService()

      vi.mocked(collaborationService.prepare).mockResolvedValue(result)

      const response = await createHandler(collaborationService)(
        createRequest(),
        () => true
      )

      expect(response?.status).toBe(expectedStatus)
    }
  )

  it("공동 편집 경로가 아니면 요청을 처리하지 않는다", async () => {
    const collaborationService = createCollaborationService()
    const response = await createHandler(collaborationService)(
      new Request(`${adminOrigin}/resources/tree`),
      () => true
    )

    expect(response).toBeNull()
    expect(collaborationService.prepare).not.toHaveBeenCalled()
  })
})

function createHandler(collaborationService: ResourceCollaborationUseCase) {
  return createResourceCollaborationUpgradeHandler({
    adminOrigin,
    collaborationService,
    sessionResolver: createTestAdminSessionResolver(),
  })
}

function createCollaborationService(): ResourceCollaborationUseCase {
  return {
    flush: vi.fn<ResourceCollaborationUseCase["flush"]>(),
    prepare: vi.fn<ResourceCollaborationUseCase["prepare"]>(),
  }
}

function createRequest(
  input: {
    readonly origin?: string
    readonly search?: string
    readonly upgrade?: boolean
  } = {}
): Request {
  const headers = new Headers({
    cookie: "admin_session_token=admin-token",
    origin: input.origin ?? adminOrigin,
  })

  if (input.upgrade !== false) headers.set("upgrade", "websocket")

  return new Request(
    `${adminOrigin}/resources/collaboration/${documentId}${input.search ?? ""}`,
    { headers }
  )
}

function createSnapshot(markdown: string): Uint8Array {
  const created = createResourceDocumentSnapshot(markdown)

  if (created.status === "invalid") {
    throw new Error("공동 편집 fixture snapshot 생성에 실패했습니다.")
  }

  return created.snapshot
}
