import type {
  ConnectResourceEventsInput,
  ResourceEventsConnector,
  ResourceEventsSubscription,
} from "@/features/resources/resource-events-client"
import type { AdminResourceDocumentRealtimeEvent } from "@/lib/api/admin-api"

type ActiveResourceDocument = {
  readonly documentId: string
  readonly knownStateVersion: number
}

export type ResourceWorkspaceRealtime = {
  readonly connectTree: ResourceEventsConnector
  readonly dispose: () => void
  readonly setActiveDocument: (document: ActiveResourceDocument | null) => void
  readonly start: () => void
  readonly subscribeDocumentEvents: (
    listener: (event: AdminResourceDocumentRealtimeEvent) => void
  ) => () => void
}

export function createResourceWorkspaceRealtime(input: {
  readonly connectEvents: ResourceEventsConnector
  readonly serverUrl: string
}): ResourceWorkspaceRealtime {
  const listeners = new Set<ConnectResourceEventsInput>()
  const documentListeners = new Set<
    (event: AdminResourceDocumentRealtimeEvent) => void
  >()
  let activeDocument: ActiveResourceDocument | null = null
  let connected = false
  let subscription: ResourceEventsSubscription | null = null

  function start(): void {
    if (subscription !== null) return

    subscription = input.connectEvents({
      onConnectionChange(nextConnected) {
        connected = nextConnected
        for (const listener of listeners) {
          listener.onConnectionChange(nextConnected)
        }
      },
      onError() {
        for (const listener of listeners) listener.onError()
      },
      onDocumentEvent(event) {
        for (const listener of documentListeners) listener(event)
        for (const listener of listeners) listener.onDocumentEvent?.(event)
      },
      onEvent(event) {
        for (const listener of listeners) listener.onEvent(event)
      },
      serverUrl: input.serverUrl,
    })

    if (activeDocument !== null) {
      subscription.subscribeDocument(activeDocument)
    }
  }

  return {
    connectTree(listener) {
      listeners.add(listener)
      listener.onConnectionChange(connected)

      return {
        disconnect() {
          listeners.delete(listener)
        },
        subscribeDocument(document) {
          subscription?.subscribeDocument(document)
        },
        unsubscribeDocument(documentId) {
          subscription?.unsubscribeDocument(documentId)
        },
      }
    },
    dispose() {
      if (subscription === null) return

      connected = false
      documentListeners.clear()
      listeners.clear()
      subscription?.disconnect()
      subscription = null
    },
    setActiveDocument(nextDocument) {
      if (
        activeDocument !== null &&
        activeDocument.documentId !== nextDocument?.documentId
      ) {
        subscription?.unsubscribeDocument(activeDocument.documentId)
      }

      activeDocument = nextDocument
      if (nextDocument !== null) {
        subscription?.subscribeDocument(nextDocument)
      }
    },
    start,
    subscribeDocumentEvents(listener) {
      documentListeners.add(listener)
      return () => documentListeners.delete(listener)
    },
  }
}
