"use client"

import { useEffect } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"

import type {
  ResourceDocumentCollaborationClient,
  ResourceDocumentCollaborationConnector,
  ResourceDocumentSyncState,
} from "@/features/resources/editor/resource-document-collaboration-client"

export function ResourceDocumentCollaborationPlugin({
  connect,
  documentId,
  onSyncStateChange,
  onClientChange,
  serverUrl,
}: {
  readonly connect: ResourceDocumentCollaborationConnector
  readonly documentId: string
  readonly onSyncStateChange: (state: ResourceDocumentSyncState) => void
  readonly onClientChange: (
    client: ResourceDocumentCollaborationClient | null
  ) => void
  readonly serverUrl: string
}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    let collaboration: ReturnType<ResourceDocumentCollaborationConnector> | null =
      null

    try {
      collaboration = connect({
        documentId,
        editor,
        onSyncStateChange,
        serverUrl,
      })
      onClientChange(collaboration)
    } catch {
      editor.setEditable(false)
      onSyncStateChange({
        kind: "error",
        message: "공동 편집 연결을 시작하지 못했습니다.",
      })
    }

    return () => {
      onClientChange(null)
      collaboration?.disconnect()
    }
  }, [
    connect,
    documentId,
    editor,
    onClientChange,
    onSyncStateChange,
    serverUrl,
  ])

  return null
}
