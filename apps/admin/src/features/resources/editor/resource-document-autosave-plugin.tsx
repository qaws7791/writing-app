"use client"

import { useEffect } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { readResourceDocumentMarkdown } from "@workspace/resource-document/resource-markdown"

import type { ResourceDocumentEditorApi } from "@/features/resources/resource-library-api"
import type { AdminResourceLibraryDocument } from "@/lib/api/admin-api"

export type ResourceDocumentSyncState =
  | { readonly kind: "conflict"; readonly message: string }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "invalid"; readonly message: string }
  | { readonly kind: "pending"; readonly message: string }
  | { readonly kind: "saved"; readonly message: string }
  | { readonly kind: "saving"; readonly message: string }

type PendingSave = {
  readonly editVersion: number
  readonly markdown: string
}

const autosaveDelayMilliseconds = 500

export function ResourceDocumentAutosavePlugin({
  api,
  documentId,
  initialContentRevision,
  initialMarkdown,
  onSaved,
  onSyncStateChange,
}: {
  readonly api: ResourceDocumentEditorApi
  readonly documentId: string
  readonly initialContentRevision: number
  readonly initialMarkdown: string
  readonly onSaved: (document: AdminResourceLibraryDocument) => void
  readonly onSyncStateChange: (state: ResourceDocumentSyncState) => void
}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    let contentRevision = initialContentRevision
    let disposed = false
    let editVersion = 0
    let inFlight = false
    let pendingSave: PendingSave | null = null
    let savedMarkdown = initialMarkdown
    let timeout: ReturnType<typeof setTimeout> | null = null

    function setSyncState(state: ResourceDocumentSyncState): void {
      if (!disposed) onSyncStateChange(state)
    }

    function projectLatestMarkdown(): void {
      timeout = null
      const projection = readResourceDocumentMarkdown(editor)

      if (projection.status === "invalid") {
        pendingSave = null
        setSyncState({
          kind: "invalid",
          message: "지원하지 않는 서식이 있어 동기화할 수 없습니다.",
        })
        return
      }

      if (projection.markdown === savedMarkdown) {
        pendingSave = null
        if (!inFlight) {
          setSyncState({ kind: "saved", message: "모든 변경 사항이 저장됨" })
        }
        return
      }

      pendingSave = { editVersion, markdown: projection.markdown }
      void flushPendingSave()
    }

    async function flushPendingSave(): Promise<void> {
      if (disposed || inFlight || pendingSave === null) return

      const saving = pendingSave
      pendingSave = null
      inFlight = true
      setSyncState({ kind: "saving", message: "변경 사항 동기화 중" })
      const result = await api.saveResourceLibraryDocument(documentId, {
        expectedContentRevision: contentRevision,
        markdown: saving.markdown,
      })
      inFlight = false

      if (disposed) return

      if (result.status === "error") {
        setSyncState({
          kind:
            result.error.code === "stale-content-revision"
              ? "conflict"
              : "error",
          message: result.error.message,
        })
        return
      }

      contentRevision = result.value.contentRevision
      savedMarkdown = result.value.contentMarkdown
      onSaved(result.value)

      if (pendingSave !== null) {
        void flushPendingSave()
        return
      }

      setSyncState(
        saving.editVersion === editVersion && timeout === null
          ? { kind: "saved", message: "모든 변경 사항이 저장됨" }
          : { kind: "pending", message: "변경 사항 동기화 대기 중" }
      )
    }

    function scheduleSave(): void {
      editVersion += 1
      if (timeout !== null) clearTimeout(timeout)
      setSyncState({ kind: "pending", message: "변경 사항 동기화 대기 중" })
      timeout = setTimeout(projectLatestMarkdown, autosaveDelayMilliseconds)
    }

    const unregisterUpdateListener = editor.registerUpdateListener(
      ({ dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return
        scheduleSave()
      }
    )
    let currentRoot: HTMLElement | null = null
    const flushOnFocusOut = (event: FocusEvent) => {
      const nextTarget = event.relatedTarget

      if (
        currentRoot !== null &&
        nextTarget instanceof Node &&
        currentRoot.contains(nextTarget)
      ) {
        return
      }

      if (timeout !== null) clearTimeout(timeout)
      projectLatestMarkdown()
    }
    const unregisterRootListener = editor.registerRootListener((root) => {
      currentRoot?.removeEventListener("focusout", flushOnFocusOut)
      currentRoot = root
      currentRoot?.addEventListener("focusout", flushOnFocusOut)
    })

    return () => {
      disposed = true
      if (timeout !== null) clearTimeout(timeout)
      currentRoot?.removeEventListener("focusout", flushOnFocusOut)
      unregisterRootListener()
      unregisterUpdateListener()
    }
  }, [
    api,
    documentId,
    editor,
    initialContentRevision,
    initialMarkdown,
    onSaved,
    onSyncStateChange,
  ])

  return null
}
