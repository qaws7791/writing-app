import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { applyUpdate, Doc, mergeUpdates } from "yjs"

import { createResourceWorkspaceSync } from "@/features/resources/resource-workspace-sync"
import type {
  AdminResourceDocumentRealtimeEvent,
  AdminResourceDocumentSync,
} from "@/lib/api/admin-api"
import type { AdminApiResult } from "@/lib/api/api-result"
import {
  applyResourceDocumentUpdate,
  createHeadlessResourceDocumentCollaboration,
  createResourceDocumentSnapshot,
  readResourceDocumentMarkdown,
  replaceResourceDocumentMarkdown,
} from "@workspace/resource-document"
import { createResourceDocumentEditor } from "@workspace/resource-document/resource-markdown"

describe("자료실 작업 공간 HTTP 동기화", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("서버 snapshot 전에는 편집을 잠그고 문서 이동 뒤에도 cache를 재사용한다", async () => {
    const snapshot = expectSnapshot("초기 본문")
    const initialResponse =
      deferred<AdminApiResult<AdminResourceDocumentSync>>()
    const getResourceDocumentSnapshot = vi.fn(() => initialResponse.promise)
    const saveResourceDocumentTransaction = vi.fn(async () => ({
      status: "ok" as const,
      value: {
        contentRevision: 1,
        kind: "accepted" as const,
        stateVersion: 1,
        transactionId: "transaction-1",
      },
    }))
    const realtime = createRealtimeFake()
    const sync = createResourceWorkspaceSync({
      api: {
        getResourceDocumentSnapshot,
        getResourceDocumentSync: vi.fn(),
        saveResourceDocumentTransaction,
      },
      realtime,
    })
    const firstEditor = createResourceDocumentEditor()
    const firstLease = sync.attachDocument({
      documentId: "document-1",
      editor: firstEditor,
    })
    const states: string[] = []
    firstLease.subscribe((state) => states.push(state.kind))

    expect(firstEditor.isEditable()).toBe(false)
    expect(states).toEqual(["loading"])
    initialResponse.resolve({
      status: "ok",
      value: { kind: "snapshot", snapshot, stateVersion: 0 },
    })
    await vi.waitFor(() => expect(firstEditor.isEditable()).toBe(true))
    expect(readResourceDocumentMarkdown(firstEditor)).toMatchObject({
      markdown: "초기 본문",
    })

    expect(
      replaceResourceDocumentMarkdown(firstEditor, "로컬 변경")
    ).toMatchObject({ status: "valid" })
    await vi.advanceTimersByTimeAsync(500)
    expect(saveResourceDocumentTransaction).toHaveBeenCalledTimes(1)
    expect(states).toContain("saving")
    expect(states.at(-1)).toBe("synchronized")

    firstLease.release()
    const secondEditor = createResourceDocumentEditor()
    const secondLease = sync.attachDocument({
      documentId: "document-1",
      editor: secondEditor,
    })
    await vi.waitFor(() => {
      expect(readResourceDocumentMarkdown(secondEditor)).toMatchObject({
        markdown: "로컬 변경",
      })
    })
    expect(getResourceDocumentSnapshot).toHaveBeenCalledTimes(1)

    secondLease.release()
    sync.dispose()
  })

  it("version 알림을 누락 update로 pull하고 무효화된 문서를 잠근다", async () => {
    const snapshot = expectSnapshot("초기 본문")
    const remoteUpdate = createUpdate(snapshot, "원격 본문")
    expect(applyResourceDocumentUpdate(snapshot, remoteUpdate)).toMatchObject({
      markdown: "원격 본문",
      status: "valid",
    })
    const getResourceDocumentSync = vi.fn(async () => ({
      status: "ok" as const,
      value: {
        fromStateVersion: 0,
        kind: "updates" as const,
        stateVersion: 1,
        updates: [remoteUpdate],
      },
    }))
    const realtime = createRealtimeFake()
    const sync = createResourceWorkspaceSync({
      api: {
        getResourceDocumentSnapshot: vi.fn(async () => ({
          status: "ok" as const,
          value: { kind: "snapshot" as const, snapshot, stateVersion: 0 },
        })),
        getResourceDocumentSync,
        saveResourceDocumentTransaction: vi.fn(),
      },
      realtime,
    })
    const editor = createResourceDocumentEditor()
    const lease = sync.attachDocument({
      documentId: "document-1",
      editor,
    })
    await vi.waitFor(() => expect(editor.isEditable()).toBe(true))

    realtime.publish({
      contentRevision: 1,
      documentId: "document-1",
      stateVersion: 1,
      type: "resource-document-version-advanced",
    })
    await vi.waitFor(() => {
      expect(readResourceDocumentMarkdown(editor)).toMatchObject({
        markdown: "원격 본문",
      })
    })
    expect(getResourceDocumentSync).toHaveBeenCalledWith("document-1", 0)

    realtime.publish({
      documentId: "document-1",
      reason: "archived",
      type: "resource-document-invalidated",
    })
    expect(editor.isEditable()).toBe(false)

    lease.release()
    sync.dispose()
  })

  it("깨끗한 문서는 3개만 보존해도 승인 대기 문서는 cache에서 제거하지 않는다", async () => {
    const snapshot = expectSnapshot("초기 본문")
    const pendingSave = deferred<
      AdminApiResult<{
        readonly contentRevision: number
        readonly kind: "accepted"
        readonly stateVersion: number
        readonly transactionId: string
      }>
    >()
    const getResourceDocumentSnapshot = vi.fn(async () => ({
      status: "ok" as const,
      value: { kind: "snapshot" as const, snapshot, stateVersion: 0 },
    }))
    const realtime = createRealtimeFake()
    const sync = createResourceWorkspaceSync({
      api: {
        getResourceDocumentSnapshot,
        getResourceDocumentSync: vi.fn(),
        saveResourceDocumentTransaction: vi.fn(() => pendingSave.promise),
      },
      realtime,
    })
    const pendingEditor = createResourceDocumentEditor()
    const pendingLease = sync.attachDocument({
      documentId: "document-1",
      editor: pendingEditor,
    })
    await vi.waitFor(() => expect(pendingEditor.isEditable()).toBe(true))
    replaceResourceDocumentMarkdown(pendingEditor, "승인 대기 본문")
    await vi.advanceTimersByTimeAsync(500)
    pendingLease.release()

    for (let index = 2; index <= 5; index += 1) {
      const editor = createResourceDocumentEditor()
      const lease = sync.attachDocument({
        documentId: `document-${index}`,
        editor,
      })
      await vi.waitFor(() => expect(editor.isEditable()).toBe(true))
      lease.release()
    }

    const restoredEditor = createResourceDocumentEditor()
    const restoredLease = sync.attachDocument({
      documentId: "document-1",
      editor: restoredEditor,
    })
    await vi.waitFor(() => {
      expect(readResourceDocumentMarkdown(restoredEditor)).toMatchObject({
        markdown: "승인 대기 본문",
      })
    })
    expect(getResourceDocumentSnapshot).toHaveBeenCalledTimes(5)

    pendingSave.resolve({
      status: "ok",
      value: {
        contentRevision: 1,
        kind: "accepted",
        stateVersion: 1,
        transactionId: "transaction-1",
      },
    })
    await vi.advanceTimersByTimeAsync(0)
    restoredLease.release()
    sync.dispose()
  })
})

function expectSnapshot(markdown: string): Uint8Array {
  const result = createResourceDocumentSnapshot(markdown)
  if (result.status !== "valid") throw new Error("snapshot fixture 생성 실패")
  return result.snapshot
}

function createUpdate(snapshot: Uint8Array, markdown: string): Uint8Array {
  const document = new Doc()
  const collaboration = createHeadlessResourceDocumentCollaboration({
    document,
    id: "resource-workspace-sync-test",
  })
  applyUpdate(document, snapshot)
  readResourceDocumentMarkdown(collaboration.editor)
  const updates: Uint8Array[] = []
  document.on("update", (update) => updates.push(update))
  const replaced = replaceResourceDocumentMarkdown(
    collaboration.editor,
    markdown
  )
  if (replaced.status !== "valid") throw new Error("update fixture 생성 실패")
  collaboration.disconnect()
  document.destroy()
  return mergeUpdates(updates)
}

function createRealtimeFake() {
  const listeners = new Set<
    (event: AdminResourceDocumentRealtimeEvent) => void
  >()

  return {
    publish(event: AdminResourceDocumentRealtimeEvent) {
      for (const listener of listeners) listener(event)
    },
    setActiveDocument: vi.fn(),
    subscribeDocumentEvents(
      listener: (event: AdminResourceDocumentRealtimeEvent) => void
    ) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

function deferred<TValue>() {
  let resolve: (value: TValue) => void = () => undefined
  const promise = new Promise<TValue>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}
