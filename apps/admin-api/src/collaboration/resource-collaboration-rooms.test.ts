import { describe, expect, it, vi } from "vitest"

import {
  createResourceCollaborationRooms,
  type ResourceCollaborationRoomLock,
} from "@/collaboration/resource-collaboration-rooms"
import type { YWebSocketBunAdapter } from "@/collaboration/y-websocket-bun-adapter"
import { toResourceDocumentId } from "@workspace/core/modules/resource-library/api"

const documentA = toResourceDocumentId("document-a")
const documentB = toResourceDocumentId("document-b")

describe("자료 문서 공동 편집 room 조정", () => {
  it("하위 문서 room의 활성 편집 연결 수를 합산한다", () => {
    const adapter = createAdapter()

    vi.mocked(adapter.getRoomConnectionCount)
      .mockReturnValueOnce(2)
      .mockReturnValueOnce(1)

    expect(
      createResourceCollaborationRooms(adapter).countActiveEditors([
        documentA,
        documentB,
      ])
    ).toBe(3)
  })

  it("열리지 않은 room의 문서 내보내기를 성공으로 처리한다", async () => {
    const adapter = createAdapter()

    vi.mocked(adapter.flushRoom).mockResolvedValue("not-open")

    await expect(
      createResourceCollaborationRooms(adapter).flushDocument(documentA)
    ).resolves.toBe("ok")
  })

  it("열린 하위 문서만 잠그고 성공 시 해당 room을 모두 닫는다", async () => {
    const adapter = createAdapter()

    vi.mocked(adapter.lockRoom)
      .mockResolvedValueOnce("ok")
      .mockResolvedValueOnce("not-open")
    vi.mocked(adapter.closeRoom).mockReturnValue(2)
    const rooms = createResourceCollaborationRooms(adapter)
    const result = await rooms.lockDocuments([documentA, documentB])

    expect(result).toEqual({
      kind: "ok",
      lock: { documentIds: [documentA] },
    })

    if (result.kind !== "ok") {
      throw new Error("공동 편집 room 잠금 fixture가 실패했습니다.")
    }

    expect(rooms.close(result.lock)).toBe(1)
    expect(adapter.closeRoom).toHaveBeenCalledWith(
      documentA,
      1008,
      "자료 문서가 휴지통으로 이동했습니다."
    )
  })

  it("하위 room flush가 실패하면 먼저 잠근 room을 해제한다", async () => {
    const adapter = createAdapter()

    vi.mocked(adapter.lockRoom)
      .mockResolvedValueOnce("ok")
      .mockResolvedValueOnce("error")

    await expect(
      createResourceCollaborationRooms(adapter).lockDocuments([
        documentA,
        documentB,
      ])
    ).resolves.toEqual({ kind: "error" })
    expect(adapter.unlockRoom).toHaveBeenCalledWith(documentA)
    expect(adapter.closeRoom).not.toHaveBeenCalled()
  })

  it("구조 명령 실패 시 잠근 room을 다시 편집 가능하게 해제한다", () => {
    const adapter = createAdapter()
    const lock: ResourceCollaborationRoomLock = {
      documentIds: [documentA, documentB],
    }

    createResourceCollaborationRooms(adapter).release(lock)

    expect(adapter.unlockRoom).toHaveBeenCalledTimes(2)
  })
})

function createAdapter(): YWebSocketBunAdapter {
  return {
    closeRoom: vi.fn<YWebSocketBunAdapter["closeRoom"]>(),
    dispose: vi.fn<YWebSocketBunAdapter["dispose"]>(),
    flushRoom: vi.fn<YWebSocketBunAdapter["flushRoom"]>(),
    getRoomConnectionCount:
      vi.fn<YWebSocketBunAdapter["getRoomConnectionCount"]>(),
    hasRoom: vi.fn<YWebSocketBunAdapter["hasRoom"]>(),
    lockRoom: vi.fn<YWebSocketBunAdapter["lockRoom"]>(),
    unlockRoom: vi.fn<YWebSocketBunAdapter["unlockRoom"]>(),
    websocket: {
      message() {},
    },
  }
}
