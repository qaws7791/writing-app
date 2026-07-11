import { describe, expect, it } from "vitest"

import {
  adminReadResourceDocumentSyncQuerySchema,
  adminSaveResourceDocumentTransactionRequestSchema,
  adminSaveResourceDocumentTransactionResponseSchema,
  adminReadResourceDocumentSyncResponseSchema,
} from "@workspace/contracts/admin/admin-resource-sync"

describe("자료 문서 HTTP 동기화 계약", () => {
  it("마지막 확인 version과 멱등 키를 가진 Yjs transaction을 검증한다", () => {
    expect(
      adminSaveResourceDocumentTransactionRequestSchema.parse({
        knownStateVersion: 3,
        transactionId: "transaction-1",
        updateBase64: "AQID",
      })
    ).toEqual({
      knownStateVersion: 3,
      transactionId: "transaction-1",
      updateBase64: "AQID",
    })
  })

  it("최초 승인과 멱등 재승인 응답을 구분한다", () => {
    expect(
      adminSaveResourceDocumentTransactionResponseSchema.parse({
        contentRevision: 4,
        kind: "already-accepted",
        stateVersion: 7,
        transactionId: "transaction-1",
      })
    ).toMatchObject({ kind: "already-accepted", stateVersion: 7 })
  })

  it("누락 update와 snapshot fallback 응답을 판별한다", () => {
    expect(
      adminReadResourceDocumentSyncQuerySchema.parse({
        afterStateVersion: "0",
        mode: "snapshot",
      })
    ).toEqual({ afterStateVersion: 0, mode: "snapshot" })
    expect(
      adminReadResourceDocumentSyncResponseSchema.parse({
        fromStateVersion: 2,
        kind: "updates",
        stateVersion: 4,
        updatesBase64: ["AQID", "BAUG"],
      })
    ).toMatchObject({ kind: "updates", stateVersion: 4 })
    expect(
      adminReadResourceDocumentSyncResponseSchema.parse({
        kind: "snapshot",
        snapshotBase64: "AQID",
        stateVersion: 4,
      })
    ).toMatchObject({ kind: "snapshot", stateVersion: 4 })
  })
})
