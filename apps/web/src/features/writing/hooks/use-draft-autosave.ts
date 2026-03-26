"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { MutableRefObject } from "react"

import type {
  DraftSyncState,
  EditorDraftSnapshot,
} from "@/domain/draft/model/draft-sync.service"
import { serializeDraftSnapshot } from "@/domain/draft/model/draft-sync.service"
import type { FlushPendingDraftResult } from "@/features/writing/hooks/use-editor-leave-guard"
import { useAutosaveDraftMutation } from "@/features/writing/hooks/use-autosave-draft-mutation"
import type { DraftRepository } from "@/features/writing/repositories/draft-repository"

type UseDraftAutosaveOptions = {
  repository?: DraftRepository
  draftId: number
  editorDraftRef: MutableRefObject<EditorDraftSnapshot>
  isReady: boolean
  lastSyncedSnapshotRef: MutableRefObject<string | null>
  markSynced: (snapshot: EditorDraftSnapshot) => void
}

export function useDraftAutosave({
  repository,
  draftId,
  editorDraftRef,
  isReady,
  lastSyncedSnapshotRef,
  markSynced,
}: UseDraftAutosaveOptions) {
  const [syncState, setSyncState] = useState<DraftSyncState>("idle")
  const autosaveMutation = useAutosaveDraftMutation(repository)
  const flushPromiseRef = useRef<Promise<FlushPendingDraftResult> | null>(null)
  const isMountedRef = useRef(true)

  const isReadyRef = useRef(isReady)
  const markSyncedRef = useRef(markSynced)
  const autosaveMutationRef = useRef(autosaveMutation)

  useEffect(() => {
    isReadyRef.current = isReady
  }, [isReady])

  useEffect(() => {
    markSyncedRef.current = markSynced
  }, [markSynced])

  useEffect(() => {
    autosaveMutationRef.current = autosaveMutation
  }, [autosaveMutation])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const derivedSyncState: DraftSyncState =
    isReady && syncState === "idle" ? "saved" : syncState

  const flushPendingDraft =
    useCallback(async (): Promise<FlushPendingDraftResult> => {
      if (flushPromiseRef.current) {
        return flushPromiseRef.current
      }

      const flushPromise = (async (): Promise<FlushPendingDraftResult> => {
        if (!isReadyRef.current) {
          return "blocked"
        }

        const snapshotToSync = editorDraftRef.current
        const serialized = serializeDraftSnapshot(snapshotToSync)

        if (serialized === lastSyncedSnapshotRef.current) {
          return "noop"
        }

        setSyncState("saving")

        try {
          await autosaveMutationRef.current.mutateAsync({
            draftId,
            content: snapshotToSync.content,
            title: snapshotToSync.title,
          })

          if (!isMountedRef.current) {
            return "saved"
          }

          markSyncedRef.current(snapshotToSync)
          setSyncState("saved")

          return "saved"
        } catch {
          if (isMountedRef.current) {
            setSyncState("error")
          }

          return "blocked"
        }
      })()

      flushPromiseRef.current = flushPromise

      void flushPromise.finally(() => {
        flushPromiseRef.current = null
      })

      return flushPromise
    }, [draftId, editorDraftRef, lastSyncedSnapshotRef])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void flushPendingDraft()
    }, 3000)

    return () => {
      window.clearInterval(timer)
    }
  }, [flushPendingDraft])

  const markSaved = useCallback(() => {
    setSyncState("saved")
  }, [])

  return {
    flushPendingDraft,
    markSaved,
    syncState: derivedSyncState,
  }
}
