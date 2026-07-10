import { describe, expect, it, vi } from "vitest"

import type { ResourceCollaborationRepository } from "@workspace/core/modules/resource-library/application/ports/resource-collaboration.repository"
import { createResourceCollaborationUseCase } from "@workspace/core/modules/resource-library/application/use-cases/resource-collaboration.use-case"
import { toResourceDocumentId } from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import { createResourceDocumentSnapshot } from "@workspace/resource-document"

const documentId = toResourceDocumentId("document-1")

describe("자료 공동 편집 use case", () => {
  it("snapshot이 없으면 저장 Markdown으로 Yjs 상태를 초기화한다", async () => {
    const repository = createRepository()
    vi.mocked(repository.load).mockResolvedValue({
      kind: "ok",
      value: {
        contentMarkdown: "## 시작\n\n본문",
        snapshot: null,
        stateVersion: 0,
      },
    })
    const useCase = createResourceCollaborationUseCase(repository)
    const result = await useCase.prepare({ documentId })

    expect(result).toMatchObject({
      kind: "ok",
      value: { stateVersion: 0 },
    })
    if (result.kind !== "ok") {
      throw new Error("공동 편집 준비에 실패했습니다.")
    }
    expect(result.value.snapshot.byteLength).toBeGreaterThan(0)
  })

  it("persisted snapshot과 Markdown이 다르면 손상 상태로 거부한다", async () => {
    const repository = createRepository()
    const snapshot = expectSnapshot("다른 본문")
    vi.mocked(repository.load).mockResolvedValue({
      kind: "ok",
      value: {
        contentMarkdown: "저장 본문",
        snapshot,
        stateVersion: 3,
      },
    })

    await expect(
      createResourceCollaborationUseCase(repository).prepare({ documentId })
    ).resolves.toEqual({ kind: "invalid-state" })
  })

  it("Yjs snapshot을 Markdown과 FTS 본문으로 투영해 flush한다", async () => {
    const repository = createRepository()
    vi.mocked(repository.flush).mockResolvedValue({
      kind: "ok",
      value: { contentRevision: 4, stateVersion: 2 },
    })
    const snapshot = expectSnapshot("## 운영\n\n실시간 **공동 편집**")
    const now = new Date("2026-07-10T01:00:00.000Z")

    await expect(
      createResourceCollaborationUseCase(repository).flush({
        actorId: "admin-1",
        documentId,
        expectedStateVersion: 1,
        now,
        snapshot,
      })
    ).resolves.toEqual({
      kind: "ok",
      value: { contentRevision: 4, stateVersion: 2 },
    })
    expect(repository.flush).toHaveBeenCalledWith({
      actorId: "admin-1",
      bodyText: "운영 실시간 공동 편집",
      documentId,
      expectedStateVersion: 1,
      markdown: "## 운영\n\n실시간 **공동 편집**",
      now,
      snapshot,
    })
  })

  it("손상된 Yjs update는 기존 문서 저장 전에 거부한다", async () => {
    const repository = createRepository()

    await expect(
      createResourceCollaborationUseCase(repository).flush({
        actorId: "admin-1",
        documentId,
        expectedStateVersion: 0,
        now: new Date(),
        snapshot: Uint8Array.of(255, 255),
      })
    ).resolves.toEqual({ kind: "invalid-state" })
    expect(repository.flush).not.toHaveBeenCalled()
  })
})

function createRepository(): ResourceCollaborationRepository {
  return {
    flush: vi.fn<ResourceCollaborationRepository["flush"]>(),
    load: vi.fn<ResourceCollaborationRepository["load"]>(),
  }
}

function expectSnapshot(markdown: string): Uint8Array {
  const result = createResourceDocumentSnapshot(markdown)

  if (result.status === "invalid") {
    throw new Error("공동 편집 snapshot fixture를 만들지 못했습니다.")
  }

  return result.snapshot
}
