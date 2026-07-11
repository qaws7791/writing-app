import type { LexicalEditor } from "lexical"
import type { Provider, UserState } from "@lexical/yjs"
import { applyUpdate, Doc } from "yjs"

import {
  createResourceDocumentTransactionQueue,
  type ResourceDocumentTransactionQueue,
} from "@/features/resources/editor/resource-document-transaction-queue"
import type { ResourceWorkspaceRealtime } from "@/features/resources/resource-workspace-realtime"
import type {
  AdminApi,
  AdminResourceDocumentRealtimeEvent,
} from "@/lib/api/admin-api"
import {
  connectResourceDocumentCollaboration,
  type ResourceDocumentCollaboration,
} from "@workspace/resource-document/resource-collaboration"

export type ResourceWorkspaceDocumentSyncState =
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "invalid"; readonly message: string }
  | { readonly kind: "loading"; readonly message: string }
  | { readonly kind: "pending-offline"; readonly message: string }
  | { readonly kind: "readonly"; readonly message: string }
  | { readonly kind: "saving"; readonly message: string }
  | { readonly kind: "synchronized"; readonly message: string }

export type ResourceDocumentSyncLease = {
  readonly release: () => void
  readonly retry: () => Promise<void>
  readonly subscribe: (
    listener: (state: ResourceWorkspaceDocumentSyncState) => void
  ) => () => void
}

export type ResourceWorkspaceSync = {
  readonly attachDocument: (input: {
    readonly documentId: string
    readonly editor: LexicalEditor
  }) => ResourceDocumentSyncLease
  readonly checkActiveDocument: () => void
  readonly dispose: () => void
  readonly start: () => void
}

type ResourceWorkspaceSyncApi = Pick<
  AdminApi,
  | "getResourceDocumentSnapshot"
  | "getResourceDocumentSync"
  | "saveResourceDocumentTransaction"
>

type ResourceWorkspaceSyncRealtime = Pick<
  ResourceWorkspaceRealtime,
  "setActiveDocument" | "subscribeDocumentEvents"
>

type CachedResourceDocument = ReturnType<typeof createCachedResourceDocument>

export function createResourceWorkspaceSync(input: {
  readonly api: ResourceWorkspaceSyncApi
  readonly realtime: ResourceWorkspaceSyncRealtime
}): ResourceWorkspaceSync {
  const documents = new Map<string, CachedResourceDocument>()
  let activeLease: {
    readonly document: CachedResourceDocument
    readonly documentId: string
  } | null = null
  let unsubscribeDocumentEvents: (() => void) | null = null

  function start(): void {
    if (unsubscribeDocumentEvents !== null) return
    unsubscribeDocumentEvents = input.realtime.subscribeDocumentEvents(
      (event) => documents.get(event.documentId)?.receiveEvent(event)
    )
  }

  return {
    attachDocument({ documentId, editor }) {
      start()

      let document = documents.get(documentId)
      if (document === undefined) {
        document = createCachedResourceDocument({
          api: input.api,
          documentId,
        })
      } else {
        documents.delete(documentId)
      }
      documents.set(documentId, document)

      const releaseEditor = document.attach(editor)
      const lease = { document, documentId }
      activeLease = lease
      input.realtime.setActiveDocument({
        documentId,
        knownStateVersion: document.readStateVersion(),
      })
      let released = false

      return {
        release() {
          if (released) return
          released = true
          releaseEditor()
          if (activeLease !== lease) return
          activeLease = null
          input.realtime.setActiveDocument(null)
          pruneDocumentCache(documents)
        },
        retry: document.retry,
        subscribe: document.subscribe,
      }
    },
    checkActiveDocument() {
      if (activeLease === null) return
      input.realtime.setActiveDocument({
        documentId: activeLease.documentId,
        knownStateVersion: activeLease.document.readStateVersion(),
      })
    },
    dispose() {
      unsubscribeDocumentEvents?.()
      unsubscribeDocumentEvents = null
      activeLease = null
      input.realtime.setActiveDocument(null)
      for (const document of documents.values()) document.destroy()
      documents.clear()
    },
    start,
  }
}

function createCachedResourceDocument(input: {
  readonly api: ResourceWorkspaceSyncApi
  readonly documentId: string
}) {
  const listeners = new Set<
    (state: ResourceWorkspaceDocumentSyncState) => void
  >()
  let applyingRemote = false
  let binding: ResourceDocumentCollaboration | null = null
  let destroyed = false
  let document: Doc | null = null
  let editor: LexicalEditor | null = null
  let initialized = false
  let initializing: Promise<void> | null = null
  let knownStateVersion = 0
  let pulling: Promise<void> | null = null
  let queue: ResourceDocumentTransactionQueue | null = null
  let state: ResourceWorkspaceDocumentSyncState = {
    kind: "loading",
    message: "자료 문서 불러오는 중",
  }
  let targetStateVersion = 0

  function setState(nextState: ResourceWorkspaceDocumentSyncState): void {
    state = nextState
    for (const listener of listeners) listener(nextState)
  }

  function bindEditor(): void {
    if (document === null || editor === null) return

    binding?.disconnect()
    const currentEditor = editor
    binding = connectResourceDocumentCollaboration({
      document,
      editor: currentEditor,
      id: `resource-document-${input.documentId}`,
      onRemoteValidationChange(validation) {
        if (validation.status === "valid") return
        currentEditor.setEditable(false)
        setState({
          kind: "invalid",
          message: "지원하지 않는 원격 문서 상태가 차단됨",
        })
      },
      provider: createCursorlessProvider(),
    })
    currentEditor.setEditable(
      state.kind !== "invalid" && state.kind !== "readonly"
    )
  }

  function createQueue(stateVersion: number): ResourceDocumentTransactionQueue {
    return createResourceDocumentTransactionQueue({
      documentId: input.documentId,
      knownStateVersion: stateVersion,
      onAccepted(result) {
        knownStateVersion = Math.max(knownStateVersion, result.stateVersion)
        if (!queue?.hasPending() && targetStateVersion <= knownStateVersion) {
          setState(synchronizedState())
        }
      },
      onError() {
        setState({
          kind: "pending-offline",
          message: "변경 사항을 보관하고 다시 저장을 기다리는 중",
        })
      },
      onPending() {
        setState({ kind: "saving", message: "변경 사항 저장 중" })
      },
      save: input.api.saveResourceDocumentTransaction,
    })
  }

  const onDocumentUpdate = (update: Uint8Array) => {
    if (!applyingRemote) queue?.enqueue(update)
  }

  async function initialize(): Promise<void> {
    if (destroyed || initialized) return
    if (initializing !== null) return initializing

    initializing = (async () => {
      const result = await input.api.getResourceDocumentSnapshot(
        input.documentId
      )
      if (destroyed) return
      if (result.status === "error" || result.value.kind !== "snapshot") {
        editor?.setEditable(false)
        setState({
          kind: "error",
          message: "자료 문서 snapshot을 불러오지 못했습니다.",
        })
        return
      }

      document = new Doc()
      applyUpdate(document, result.value.snapshot)
      knownStateVersion = result.value.stateVersion
      targetStateVersion = Math.max(targetStateVersion, knownStateVersion)
      queue = createQueue(knownStateVersion)
      document.on("update", onDocumentUpdate)
      initialized = true
      setState(synchronizedState())
      bindEditor()
      requestPull(targetStateVersion)
    })().finally(() => {
      initializing = null
    })

    return initializing
  }

  async function pullToTarget(): Promise<void> {
    while (
      !destroyed &&
      initialized &&
      targetStateVersion > knownStateVersion
    ) {
      const result = await input.api.getResourceDocumentSync(
        input.documentId,
        knownStateVersion
      )
      if (result.status === "error") {
        setState({
          kind: "pending-offline",
          message: "원격 변경을 다시 불러오기를 기다리는 중",
        })
        return
      }

      try {
        applyingRemote = true
        if (result.value.kind === "updates") {
          for (const update of result.value.updates) {
            if (document !== null) applyUpdate(document, update)
          }
        } else if (result.value.kind === "snapshot" && document !== null) {
          applyUpdate(document, result.value.snapshot)
        }
      } catch {
        editor?.setEditable(false)
        setState({
          kind: "invalid",
          message: "지원하지 않는 원격 문서 상태가 차단됨",
        })
        return
      } finally {
        applyingRemote = false
      }

      knownStateVersion = Math.max(knownStateVersion, result.value.stateVersion)
      queue?.advanceKnownStateVersion(knownStateVersion)
      if (result.value.kind === "up-to-date") {
        targetStateVersion = knownStateVersion
      }
    }

    if (!queue?.hasPending() && state.kind !== "readonly") {
      setState(synchronizedState())
    }
  }

  function requestPull(stateVersion: number): void {
    targetStateVersion = Math.max(targetStateVersion, stateVersion)
    if (!initialized || targetStateVersion <= knownStateVersion) return
    if (pulling !== null) return

    pulling = pullToTarget().finally(() => {
      pulling = null
      if (targetStateVersion > knownStateVersion)
        requestPull(targetStateVersion)
    })
  }

  void initialize()

  return {
    attach(nextEditor: LexicalEditor): () => void {
      binding?.disconnect()
      binding = null
      editor = nextEditor
      nextEditor.setEditable(false)
      if (initialized) bindEditor()
      else void initialize()

      return () => {
        if (editor !== nextEditor) return
        binding?.disconnect()
        binding = null
        editor = null
      }
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      if (document !== null) document.off("update", onDocumentUpdate)
      binding?.disconnect()
      queue?.dispose()
      listeners.clear()
      document?.destroy()
    },
    hasPending() {
      return !initialized || (queue?.hasPending() ?? false)
    },
    readStateVersion: () => knownStateVersion,
    receiveEvent(event: AdminResourceDocumentRealtimeEvent) {
      if (event.type === "resource-document-invalidated") {
        editor?.setEditable(false)
        setState({
          kind: "readonly",
          message: "휴지통으로 이동되어 읽기 전용으로 전환됨",
        })
        return
      }
      requestPull(event.stateVersion)
    },
    async retry() {
      if (!initialized) {
        setState({ kind: "loading", message: "자료 문서 다시 불러오는 중" })
        await initialize()
        return
      }
      setState({ kind: "saving", message: "변경 사항 다시 저장 중" })
      await queue?.retry()
      requestPull(targetStateVersion)
    },
    subscribe(listener: (state: ResourceWorkspaceDocumentSyncState) => void) {
      listeners.add(listener)
      listener(state)
      return () => listeners.delete(listener)
    },
  }
}

function pruneDocumentCache(
  documents: Map<string, CachedResourceDocument>
): void {
  const cleanDocuments = [...documents].filter(
    ([, document]) => !document.hasPending()
  )
  for (const [documentId, document] of cleanDocuments.slice(0, -3)) {
    document.destroy()
    documents.delete(documentId)
  }
}

function synchronizedState(): ResourceWorkspaceDocumentSyncState {
  return { kind: "synchronized", message: "모든 변경 사항이 동기화됨" }
}

function createCursorlessProvider(): Provider {
  const states = new Map<number, UserState>()

  return {
    awareness: {
      getLocalState: () => null,
      getStates: () => states,
      off: () => undefined,
      on: () => undefined,
      setLocalState: () => undefined,
      setLocalStateField: () => undefined,
    },
    connect: () => undefined,
    disconnect: () => undefined,
    off: () => undefined,
    on: () => undefined,
  }
}
