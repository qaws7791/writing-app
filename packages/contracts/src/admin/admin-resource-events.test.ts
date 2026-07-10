import { describe, expect, it } from "vitest"

import {
  adminResourceEventSchema,
  adminResourceRealtimeClientMessageSchema,
  adminResourceRealtimeServerMessageSchema,
} from "@workspace/contracts/admin/admin-resource-events"

describe("자료실 실시간 이벤트 계약", () => {
  it("활성 문서와 마지막 확인 version을 구독 메시지로 검증한다", () => {
    expect(
      adminResourceRealtimeClientMessageSchema.parse({
        documentId: "document-1",
        knownStateVersion: 4,
        type: "resource-document-subscribe",
      })
    ).toEqual({
      documentId: "document-1",
      knownStateVersion: 4,
      type: "resource-document-subscribe",
    })
  })

  it("이전 활성 문서의 구독 해제 메시지를 구분한다", () => {
    expect(
      adminResourceRealtimeClientMessageSchema.parse({
        documentId: "document-1",
        type: "resource-document-unsubscribe",
      })
    ).toEqual({
      documentId: "document-1",
      type: "resource-document-unsubscribe",
    })
  })

  it("작업 공간 연결 heartbeat 시각을 검증한다", () => {
    expect(
      adminResourceRealtimeClientMessageSchema.parse({
        sentAt: "2026-07-11T05:33:00.000Z",
        type: "resource-realtime-heartbeat",
      })
    ).toEqual({
      sentAt: "2026-07-11T05:33:00.000Z",
      type: "resource-realtime-heartbeat",
    })
  })

  it("문서 구독 확인에서 서버의 현재 version을 검증한다", () => {
    expect(
      adminResourceRealtimeServerMessageSchema.parse({
        documentId: "document-1",
        stateVersion: 7,
        type: "resource-document-subscription-confirmed",
      })
    ).toEqual({
      documentId: "document-1",
      stateVersion: 7,
      type: "resource-document-subscription-confirmed",
    })
  })

  it("구독 문서의 본문 version 증가 사건을 검증한다", () => {
    expect(
      adminResourceRealtimeServerMessageSchema.parse({
        contentRevision: 9,
        documentId: "document-1",
        stateVersion: 7,
        type: "resource-document-version-advanced",
      })
    ).toEqual({
      contentRevision: 9,
      documentId: "document-1",
      stateVersion: 7,
      type: "resource-document-version-advanced",
    })
  })

  it("문서 구독 무효화 이유를 제한한다", () => {
    expect(
      adminResourceRealtimeServerMessageSchema.parse({
        documentId: "document-1",
        reason: "archived",
        type: "resource-document-invalidated",
      })
    ).toEqual({
      documentId: "document-1",
      reason: "archived",
      type: "resource-document-invalidated",
    })
    expect(() =>
      adminResourceRealtimeServerMessageSchema.parse({
        documentId: "document-1",
        reason: "unknown",
        type: "resource-document-invalidated",
      })
    ).toThrow()
  })

  it("트리 변경 revision과 영향받은 부모를 파싱한다", () => {
    expect(
      adminResourceEventSchema.parse({
        action: "trash",
        affectedParentIds: ["folder-1", null],
        nodeId: "document-1",
        revision: 7,
        type: "resource-tree-mutated",
      })
    ).toMatchObject({ action: "trash", revision: 7 })
  })

  it("문서 제목 확정 이벤트를 트리 이벤트와 구분한다", () => {
    expect(
      adminResourceEventSchema.parse({
        documentId: "document-1",
        name: "운영 안내",
        revision: 8,
        type: "resource-document-title-confirmed",
      })
    ).toMatchObject({ name: "운영 안내" })
  })
})
