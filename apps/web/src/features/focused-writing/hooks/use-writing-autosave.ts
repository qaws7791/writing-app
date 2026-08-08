"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { getWriting } from "@workspace/http-client/learner"

import {
  saveWritingDraft,
  type WritingSaveTransport,
} from "@/features/focused-writing/api/writing-transport"
import {
  isLearnerApiAbortedError,
  isLearnerApiNetworkError,
  readLearnerApiErrorCode,
  settleLearnerApiRequest,
  type LearnerWritingDetailDto,
} from "@/shared/http/learner-api-client"
import { useUnmountAbortSignal } from "@/shared/http/use-unmount-abort-signal"

const autosaveDelayMs = 800

export type WritingDraftValues = Readonly<{
  body: string
  title: string
}>

export type WritingAutosaveStatus =
  | Readonly<{ kind: "saving" }>
  | Readonly<{ kind: "saved"; updatedAt: string }>
  | Readonly<{ kind: "offline" }>
  | Readonly<{ kind: "error" }>
  | Readonly<{
      kind: "conflict"
      localDraft: WritingDraftValues
      serverWriting: LearnerWritingDetailDto
    }>

type WritingRecord = {
  conflict: {
    localDraft: WritingDraftValues
    serverWriting: LearnerWritingDetailDto
  } | null
  dirty: boolean
  draft: WritingDraftValues
  expectedVersion: number
  inFlight: boolean
  savedDraft: WritingDraftValues
  updatedAt: string
}

export function useWritingAutosave({
  initialWriting,
  onServerWritingApplied,
}: {
  readonly initialWriting: LearnerWritingDetailDto
  readonly onServerWritingApplied: (writing: LearnerWritingDetailDto) => void
}) {
  const recordRef = useRef<WritingRecord | null>(null)
  const timerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
  const flushWritingRef = useRef<
    (transport: WritingSaveTransport) => Promise<void>
  >(async () => undefined)
  const inFlightPromiseRef = useRef<Promise<void> | null>(null)
  const reconcilePromiseRef = useRef<Promise<void> | null>(null)
  const unloadRequestedRef = useRef(false)
  const mountedRef = useRef(false)
  const readAbortSignal = useUnmountAbortSignal()
  const onServerWritingAppliedRef = useRef(onServerWritingApplied)
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState<WritingAutosaveStatus>({
    kind: "saved",
    updatedAt: initialWriting.updatedAt,
  })

  if (recordRef.current === null) {
    recordRef.current = createWritingRecord(initialWriting)
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    onServerWritingAppliedRef.current = onServerWritingApplied
  }, [onServerWritingApplied])

  const setSafeStatus = useCallback((nextStatus: WritingAutosaveStatus) => {
    if (mountedRef.current) setStatus(nextStatus)
  }, [])

  const setSafeDirty = useCallback((nextDirty: boolean) => {
    if (mountedRef.current) setDirty(nextDirty)
  }, [])

  const defaultTransport = useCallback(
    (): WritingSaveTransport => ({
      kind: "default",
      signal: readAbortSignal(),
    }),
    [readAbortSignal]
  )

  const clearScheduledSave = useCallback(() => {
    if (timerRef.current === null) return
    globalThis.clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const reconcile = useCallback((): Promise<void> => {
    if (reconcilePromiseRef.current !== null) {
      return reconcilePromiseRef.current
    }

    const reconciliation = (async () => {
      const result = await settleLearnerApiRequest(
        getWriting(initialWriting.id, { signal: readAbortSignal() })
      )
      const record = readWritingRecord(recordRef)

      if (result.status === "error") {
        if (isLearnerApiAbortedError(result.error)) return
        if (!record.dirty) return
        setSafeStatus(
          isLearnerApiNetworkError(result.error)
            ? { kind: "offline" }
            : { kind: "error" }
        )
        return
      }

      const serverWriting = result.value
      if (record.dirty) {
        const serverChanged =
          serverWriting.version !== record.expectedVersion ||
          !sameDraft(readDraft(serverWriting), record.savedDraft)

        if (serverChanged) {
          record.conflict = {
            localDraft: record.draft,
            serverWriting,
          }
          setSafeStatus({ kind: "conflict", ...record.conflict })
          return
        }

        await flushWritingRef.current(defaultTransport())
        return
      }

      if (
        serverWriting.version === record.expectedVersion &&
        sameDraft(readDraft(serverWriting), record.savedDraft)
      ) {
        return
      }

      updateRecordFromServer(record, serverWriting)
      setSafeDirty(false)
      setSafeStatus({ kind: "saved", updatedAt: serverWriting.updatedAt })
      onServerWritingAppliedRef.current(serverWriting)
    })().finally(() => {
      reconcilePromiseRef.current = null
    })

    reconcilePromiseRef.current = reconciliation
    return reconciliation
  }, [
    defaultTransport,
    initialWriting.id,
    readAbortSignal,
    setSafeDirty,
    setSafeStatus,
  ])

  const flushWritingWithTransport = useCallback(
    async (transport: WritingSaveTransport): Promise<void> => {
      clearScheduledSave()
      if (transport.kind === "unload") unloadRequestedRef.current = true

      const runningRequest = inFlightPromiseRef.current
      if (runningRequest !== null) {
        await runningRequest
        return
      }

      const saveSequence = (async () => {
        while (true) {
          const record = readWritingRecord(recordRef)
          if (!record.dirty || record.conflict !== null) return

          if (!browserIsOnline()) {
            setSafeStatus({ kind: "offline" })
            return
          }

          const sentDraft = record.draft
          const sentVersion = record.expectedVersion
          const activeTransport: WritingSaveTransport =
            unloadRequestedRef.current ? { kind: "unload" } : transport
          record.inFlight = true
          setSafeStatus({ kind: "saving" })

          const result = await settleLearnerApiRequest(
            saveWritingDraft({
              body: {
                ...sentDraft,
                expectedVersion: sentVersion,
              },
              transport: activeTransport,
              writingId: initialWriting.id,
            })
          )
          record.inFlight = false

          if (result.status === "error") {
            if (isLearnerApiAbortedError(result.error)) return
            if (
              readLearnerApiErrorCode(result.error) ===
              "WRITING_VERSION_CONFLICT"
            ) {
              await reconcile()
              return
            }

            setSafeStatus(
              isLearnerApiNetworkError(result.error)
                ? { kind: "offline" }
                : { kind: "error" }
            )
            return
          }

          record.expectedVersion = result.value.version
          record.savedDraft = sentDraft
          record.updatedAt = result.value.updatedAt
          record.dirty = !sameDraft(record.draft, sentDraft)
          record.conflict = null
          setSafeDirty(record.dirty)

          if (!record.dirty) {
            setSafeStatus({
              kind: "saved",
              updatedAt: result.value.updatedAt,
            })
            return
          }
        }
      })().finally(() => {
        inFlightPromiseRef.current = null
        unloadRequestedRef.current = false
      })

      inFlightPromiseRef.current = saveSequence
      await saveSequence
    },
    [
      clearScheduledSave,
      initialWriting.id,
      reconcile,
      setSafeDirty,
      setSafeStatus,
    ]
  )

  useEffect(() => {
    flushWritingRef.current = flushWritingWithTransport
  }, [flushWritingWithTransport])

  const scheduleSave = useCallback(() => {
    clearScheduledSave()
    timerRef.current = globalThis.setTimeout(() => {
      timerRef.current = null
      void flushWritingRef.current(defaultTransport())
    }, autosaveDelayMs)
  }, [clearScheduledSave, defaultTransport])

  const stageWriting = useCallback(
    (draft: WritingDraftValues) => {
      const record = readWritingRecord(recordRef)
      record.draft = draft
      record.dirty = !sameDraft(draft, record.savedDraft)
      setSafeDirty(record.dirty)

      if (!record.dirty) {
        record.conflict = null
        clearScheduledSave()
        setSafeStatus({ kind: "saved", updatedAt: record.updatedAt })
        return
      }

      if (record.conflict !== null) {
        record.conflict = { ...record.conflict, localDraft: draft }
        setSafeStatus({ kind: "conflict", ...record.conflict })
        return
      }

      if (!browserIsOnline()) {
        setSafeStatus({ kind: "offline" })
        return
      }

      setSafeStatus({ kind: "saving" })
      scheduleSave()
    },
    [clearScheduledSave, scheduleSave, setSafeDirty, setSafeStatus]
  )

  const flushWriting = useCallback(
    (): Promise<void> => flushWritingRef.current(defaultTransport()),
    [defaultTransport]
  )

  const retryLocalWriting = useCallback(() => {
    const record = readWritingRecord(recordRef)
    if (record.conflict === null) return

    record.expectedVersion = record.conflict.serverWriting.version
    record.savedDraft = readDraft(record.conflict.serverWriting)
    record.updatedAt = record.conflict.serverWriting.updatedAt
    record.conflict = null
    record.dirty = !sameDraft(record.draft, record.savedDraft)
    setSafeDirty(record.dirty)

    if (!record.dirty) {
      setSafeStatus({ kind: "saved", updatedAt: record.updatedAt })
      return
    }

    setSafeStatus({ kind: "saving" })
    void flushWritingRef.current(defaultTransport())
  }, [defaultTransport, setSafeDirty, setSafeStatus])

  const useServerWriting = useCallback(() => {
    const record = readWritingRecord(recordRef)
    if (record.conflict === null) return

    const serverWriting = record.conflict.serverWriting
    clearScheduledSave()
    updateRecordFromServer(record, serverWriting)
    setSafeDirty(false)
    setSafeStatus({ kind: "saved", updatedAt: serverWriting.updatedAt })
    onServerWritingAppliedRef.current(serverWriting)
  }, [clearScheduledSave, setSafeDirty, setSafeStatus])

  const hasUnsavedChanges = useCallback((): boolean => {
    const record = readWritingRecord(recordRef)
    return record.dirty || record.inFlight || record.conflict !== null
  }, [])

  const readExpectedVersion = useCallback(
    (): number => readWritingRecord(recordRef).expectedVersion,
    []
  )

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges()) return
      event.preventDefault()
      event.returnValue = ""
    }
    const handleOnline = () => {
      void reconcile()
    }
    const handlePageHide = () => {
      void flushWritingRef.current({ kind: "unload" })
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void flushWritingRef.current({ kind: "unload" })
      } else {
        void reconcile()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("online", handleOnline)
    window.addEventListener("pagehide", handlePageHide)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("pagehide", handlePageHide)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      clearScheduledSave()
    }
  }, [clearScheduledSave, hasUnsavedChanges, reconcile])

  return {
    dirty,
    flushWriting,
    hasUnsavedChanges,
    readExpectedVersion,
    reconcile,
    retryLocalWriting,
    stageWriting,
    status,
    useServerWriting,
  }
}

function createWritingRecord(writing: LearnerWritingDetailDto): WritingRecord {
  const draft = readDraft(writing)
  return {
    conflict: null,
    dirty: false,
    draft,
    expectedVersion: writing.version,
    inFlight: false,
    savedDraft: draft,
    updatedAt: writing.updatedAt,
  }
}

function readWritingRecord(
  recordRef: RefObject<WritingRecord | null>
): WritingRecord {
  const record = recordRef.current
  if (record === null) {
    throw new Error("쓰기 자동 저장 상태가 초기화되지 않았습니다.")
  }
  return record
}

function readDraft(writing: LearnerWritingDetailDto): WritingDraftValues {
  return { body: writing.body, title: writing.title }
}

function updateRecordFromServer(
  record: WritingRecord,
  writing: LearnerWritingDetailDto
): void {
  const draft = readDraft(writing)
  record.conflict = null
  record.dirty = false
  record.draft = draft
  record.expectedVersion = writing.version
  record.inFlight = false
  record.savedDraft = draft
  record.updatedAt = writing.updatedAt
}

function sameDraft(
  left: WritingDraftValues,
  right: WritingDraftValues
): boolean {
  return left.title === right.title && left.body === right.body
}

function browserIsOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine
}
