"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { MutableRefObject } from "react"

import type {
  WritingSyncState,
  EditorWritingSnapshot,
} from "@/domain/writing/model/writing-sync.service"
import { serializeWritingSnapshot } from "@/domain/writing/model/writing-sync.service"
import type { FlushPendingWritingResult } from "@/features/writing/hooks/use-editor-leave-guard"
import { useAutosaveWritingMutation } from "@/features/writing/hooks/use-autosave-writing-mutation"
import type { WritingRepository } from "@/features/writing/repositories/writing-repository"

type UseWritingAutosaveOptions = {
  repository?: WritingRepository
  writingId: number
  editorWritingRef: MutableRefObject<EditorWritingSnapshot>
  isReady: boolean
  lastSyncedSnapshotRef: MutableRefObject<string | null>
  markSynced: (snapshot: EditorWritingSnapshot) => void
}

export function useWritingAutosave({
  repository,
  writingId,
  editorWritingRef,
  isReady,
  lastSyncedSnapshotRef,
  markSynced,
}: UseWritingAutosaveOptions) {
  const [syncState, setSyncState] = useState<WritingSyncState>("idle")
  const autosaveMutation = useAutosaveWritingMutation(repository)
  const flushPromiseRef = useRef<Promise<FlushPendingWritingResult> | null>(
    null
  )
  const isMountedRef = useRef(true)
  const isDirtyRef = useRef(false)

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

  const derivedSyncState: WritingSyncState =
    isReady && syncState === "idle" ? "saved" : syncState

  const flushPendingWriting =
    useCallback(async (): Promise<FlushPendingWritingResult> => {
      if (flushPromiseRef.current) {
        return flushPromiseRef.current
      }

      const flushPromise = (async (): Promise<FlushPendingWritingResult> => {
        if (!isReadyRef.current) {
          return "blocked"
        }

        const snapshotToSync = editorWritingRef.current
        const serialized = serializeWritingSnapshot(snapshotToSync)

        if (serialized === lastSyncedSnapshotRef.current) {
          isDirtyRef.current = false
          return "noop"
        }

        setSyncState("saving")

        try {
          await autosaveMutationRef.current.mutateAsync({
            writingId,
            content: snapshotToSync.content,
            title: snapshotToSync.title,
          })

          if (!isMountedRef.current) {
            return "saved"
          }

          isDirtyRef.current = false
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
    }, [writingId, editorWritingRef, lastSyncedSnapshotRef])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (isDirtyRef.current) {
        void flushPendingWriting()
      }
    }, 3000)

    return () => {
      window.clearInterval(timer)
    }
  }, [flushPendingWriting])

  const markSaved = useCallback(() => {
    setSyncState("saved")
  }, [])

  const markDirty = useCallback(() => {
    isDirtyRef.current = true
  }, [])

  return {
    flushPendingWriting,
    markSaved,
    markDirty,
    syncState: derivedSyncState,
  }
}
