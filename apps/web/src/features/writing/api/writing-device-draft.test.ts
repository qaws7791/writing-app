import { describe, expect, it } from "vitest"

import { readWritingDeviceDraftDecision } from "@/features/writing/api/writing-device-draft"

const localDraft = {
  baseVersion: 1,
  body: "기기 본문",
  checksum: "checksum",
  learnerId: "learner-1",
  savedAt: 1,
  writingId: "writing-1",
} as const

describe("readWritingDeviceDraftDecision", () => {
  it("기기 초안이 없으면 서버 본문을 쓴다", () => {
    expect(
      readWritingDeviceDraftDecision({
        local: null,
        serverBody: "서버 본문",
        serverVersion: 1,
      })
    ).toEqual({ kind: "server" })
  })

  it("본문이 같으면 서버 본문을 쓴다", () => {
    expect(
      readWritingDeviceDraftDecision({
        local: { ...localDraft, body: "서버 본문" },
        serverBody: "서버 본문",
        serverVersion: 1,
      })
    ).toEqual({ kind: "server" })
  })

  it("같은 baseVersion의 다른 본문은 복구한다", () => {
    expect(
      readWritingDeviceDraftDecision({
        local: localDraft,
        serverBody: "서버 본문",
        serverVersion: 1,
      })
    ).toEqual({ kind: "recover", draft: localDraft })
  })

  it("서버 version이 앞서면 충돌로 둔다", () => {
    expect(
      readWritingDeviceDraftDecision({
        local: localDraft,
        serverBody: "다른 화면의 본문",
        serverVersion: 2,
      })
    ).toEqual({ kind: "conflict", draft: localDraft })
  })

  it("checksum이 불량이면 기기 초안을 버린다", () => {
    expect(
      readWritingDeviceDraftDecision({
        local: "corrupt",
        serverBody: "서버 본문",
        serverVersion: 1,
      })
    ).toEqual({ kind: "discard-corrupt" })
  })
})
