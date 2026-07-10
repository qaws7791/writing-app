import type { LexicalEditor } from "lexical"
import type { Provider, UserState } from "@lexical/yjs"
import { WebsocketProvider } from "y-websocket"
import { Doc } from "yjs"

import { connectResourceDocumentCollaboration } from "@workspace/resource-document"

export type ResourceDocumentSyncState =
  | { readonly kind: "connecting"; readonly message: string }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "invalid"; readonly message: string }
  | { readonly kind: "readonly"; readonly message: string }
  | { readonly kind: "reconnecting"; readonly message: string }
  | { readonly kind: "saved"; readonly message: string }
  | { readonly kind: "syncing"; readonly message: string }

export type ResourceDocumentCollaborationClient = {
  readonly disconnect: () => void
}

export type ConnectResourceDocumentCollaborationClientInput = {
  readonly documentId: string
  readonly editor: LexicalEditor
  readonly onSyncStateChange: (state: ResourceDocumentSyncState) => void
  readonly serverUrl: string
}

export type ResourceDocumentCollaborationConnector = (
  input: ConnectResourceDocumentCollaborationClientInput
) => ResourceDocumentCollaborationClient

declare module "y-websocket" {
  interface WebsocketProvider {
    destroy(): void
  }
}

export const connectBrowserResourceDocumentCollaboration: ResourceDocumentCollaborationConnector =
  (input) => {
    const document = new Doc()
    const provider = new WebsocketProvider(
      input.serverUrl,
      input.documentId,
      document,
      { connect: false, disableBc: true }
    )
    let terminalState = false
    let disconnected = false

    provider.awareness.setLocalState(null)
    const collaboration = connectResourceDocumentCollaboration({
      document,
      editor: input.editor,
      id: `resource-document-${input.documentId}`,
      onRemoteValidationChange(validation) {
        if (validation.status === "invalid") {
          enterTerminalState({
            kind: "invalid",
            message: "지원하지 않는 원격 서식이 차단되었습니다.",
          })
        }
      },
      provider: createCursorlessLexicalProvider(),
    })
    const onStatus = ({
      status,
    }: {
      readonly status: "connected" | "connecting" | "disconnected"
    }) => {
      if (terminalState) return

      switch (status) {
        case "connected":
          input.onSyncStateChange({
            kind: "syncing",
            message: "공동 편집 변경 사항 동기화 중",
          })
          break
        case "connecting":
          input.onSyncStateChange({
            kind: "connecting",
            message: "공동 편집 서버에 연결 중",
          })
          break
        case "disconnected":
          input.onSyncStateChange({
            kind: "reconnecting",
            message: "연결이 끊겨 다시 연결하는 중",
          })
      }
    }
    const onSync = (synced: boolean) => {
      if (terminalState || !synced) return

      input.onSyncStateChange({
        kind: "saved",
        message: "모든 변경 사항이 동기화됨",
      })
    }
    const onConnectionError = () => {
      if (terminalState) return

      input.onSyncStateChange({
        kind: "reconnecting",
        message: "공동 편집 서버에 다시 연결하는 중",
      })
    }
    const onConnectionClose = (event: CloseEvent | null) => {
      if (terminalState || event === null) return

      if (event.code === 1008) {
        enterTerminalState({
          kind: "readonly",
          message: "휴지통으로 이동되어 읽기 전용으로 전환됨",
        })
        return
      }

      if (event.code === 1011 || event.code === 1013) {
        enterTerminalState({
          kind: "error",
          message: event.reason || "공동 편집을 계속할 수 없습니다.",
        })
      }
    }

    function enterTerminalState(state: ResourceDocumentSyncState): void {
      terminalState = true
      input.editor.setEditable(false)
      input.onSyncStateChange(state)
      provider.disconnect()
    }

    input.editor.setEditable(true)
    input.onSyncStateChange({
      kind: "connecting",
      message: "공동 편집 서버에 연결 중",
    })
    provider.on("connection-close", onConnectionClose)
    provider.on("connection-error", onConnectionError)
    provider.on("status", onStatus)
    provider.on("sync", onSync)
    provider.connect()

    return {
      disconnect() {
        if (disconnected) return

        disconnected = true
        provider.off("connection-close", onConnectionClose)
        provider.off("connection-error", onConnectionError)
        provider.off("status", onStatus)
        provider.off("sync", onSync)

        try {
          collaboration.disconnect()
        } finally {
          try {
            provider.destroy()
          } finally {
            document.destroy()
          }
        }
      },
    }
  }

function createCursorlessLexicalProvider(): Provider {
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
