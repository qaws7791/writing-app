import { describe, expect, it, vi } from "vitest"

import { createResourceCollaborationFlushHandler } from "@/collaboration/resource-collaboration-flush"
import type { ResourceCollaborationUseCase } from "@workspace/core/modules/resource-library/api"

const now = new Date("2026-07-10T00:00:00.000Z")

describe("자료 문서 공동 편집 flush 계측", () => {
  it("본문 저장 commit 뒤 새 version을 실시간 Hub에 알린다", async () => {
    const service = createService()
    const onCommitted = vi.fn()
    vi.mocked(service.flush).mockResolvedValue({
      kind: "ok",
      value: { contentRevision: 6, stateVersion: 4 },
    })

    await expect(
      createResourceCollaborationFlushHandler({
        collaborationService: service,
        now: () => now,
        onCommitted,
        onFailure: vi.fn(),
      })(createFlushInput())
    ).resolves.toEqual({ kind: "ok", stateVersion: 4 })
    expect(onCommitted).toHaveBeenCalledWith({
      contentRevision: 6,
      documentId: "document-1",
      stateVersion: 4,
    })
  })

  it("Markdown projection 실패를 기록하고 room 오류로 반환한다", async () => {
    const service = createService()
    const onFailure = vi.fn()

    vi.mocked(service.flush).mockResolvedValue({
      issues: [{ code: "unsupported-lexical-node", nodeType: "unknown" }],
      kind: "invalid-state",
    })

    await expect(
      createResourceCollaborationFlushHandler({
        collaborationService: service,
        now: () => now,
        onCommitted: vi.fn(),
        onFailure,
      })(createFlushInput())
    ).resolves.toEqual({ kind: "error" })
    expect(onFailure).toHaveBeenCalledWith({
      failure: "invalid-state",
      issues: [{ code: "unsupported-lexical-node", nodeType: "unknown" }],
      reason: "debounce",
      roomId: "document-1",
    })
  })

  it("SQLite busy 예외를 별도 실패 원인으로 기록하고 격리한다", async () => {
    const service = createService()
    const onFailure = vi.fn()
    const busyError = Object.assign(new Error("database is locked"), {
      code: "SQLITE_BUSY",
      name: "SQLiteError",
    })

    vi.mocked(service.flush).mockRejectedValue(busyError)

    await expect(
      createResourceCollaborationFlushHandler({
        collaborationService: service,
        now: () => now,
        onCommitted: vi.fn(),
        onFailure,
      })(createFlushInput())
    ).resolves.toEqual({ kind: "error" })
    expect(onFailure).toHaveBeenCalledWith({
      failure: "database-busy",
      message: "database is locked",
      reason: "debounce",
      roomId: "document-1",
    })
  })
})

function createService(): ResourceCollaborationUseCase {
  return {
    flush: vi.fn<ResourceCollaborationUseCase["flush"]>(),
    prepare: vi.fn<ResourceCollaborationUseCase["prepare"]>(),
  }
}

function createFlushInput() {
  return {
    actorId: "admin-1",
    expectedStateVersion: 2,
    reason: "debounce" as const,
    roomId: "document-1",
    snapshot: new Uint8Array([1, 2, 3]),
  }
}
