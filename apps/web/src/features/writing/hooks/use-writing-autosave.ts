"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { getWriting } from "@workspace/http-client/learner"

import {
  hashWritingDraftBody,
  readWritingDeviceDraftDecision,
  type WritingDraftStore,
} from "@/features/writing/api/writing-device-draft"
import {
  saveWritingDraft,
  type WritingSaveTransport,
} from "@/features/writing/api/writing-transport"
import {
  isLearnerApiAbortedError,
  isLearnerApiNetworkError,
  readLearnerApiErrorCode,
  settleLearnerApiRequest,
  type LearnerWritingDetailDto,
} from "@/shared/http/learner-api-client"
import { useUnmountAbortSignal } from "@/shared/http/use-unmount-abort-signal"

export const writingAutosaveIdleDelayMs = 800
export const writingAutosaveMaxWaitMs = 5_000

export type WritingDraftValues = Readonly<{
  body: string
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
  learnerId,
  onPersistedWriting,
  onRecoveredWriting,
  onServerWritingApplied,
  store,
}: {
  readonly initialWriting: LearnerWritingDetailDto
  readonly learnerId?: string
  readonly onPersistedWriting?: (writing: LearnerWritingDetailDto) => void
  readonly onRecoveredWriting?: (writing: LearnerWritingDetailDto) => void
  readonly onServerWritingApplied: (writing: LearnerWritingDetailDto) => void
  readonly store?: WritingDraftStore
}) {
  const recordRef = useRef<WritingRecord | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(
    null
  )
  const maxWaitTimerRef = useRef<ReturnType<
    typeof globalThis.setTimeout
  > | null>(null)
  const flushWritingRef = useRef<
    (transport: WritingSaveTransport) => Promise<void>
  >(async () => undefined)
  const commitDeviceDraftRef = useRef<() => Promise<void>>(
    async () => undefined
  )
  const inFlightPromiseRef = useRef<Promise<void> | null>(null)
  const reconcilePromiseRef = useRef<Promise<void> | null>(null)
  const deviceWriteChainRef = useRef(Promise.resolve())
  const deviceBodyRef = useRef<string | null>(null)
  const mountedRef = useRef(false)
  const readAbortSignal = useUnmountAbortSignal()
  const onPersistedWritingRef = useRef(onPersistedWriting)
  const onRecoveredWritingRef = useRef(onRecoveredWriting)
  const onServerWritingAppliedRef = useRef(onServerWritingApplied)
  const [dirty, setDirty] = useState(false)
  const [recovered, setRecovered] = useState(false)
  const [ready, setReady] = useState(store === undefined)
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
    onPersistedWritingRef.current = onPersistedWriting
  }, [onPersistedWriting])

  useEffect(() => {
    onRecoveredWritingRef.current = onRecoveredWriting
  }, [onRecoveredWriting])

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
    if (idleTimerRef.current !== null) {
      globalThis.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
    if (maxWaitTimerRef.current !== null) {
      globalThis.clearTimeout(maxWaitTimerRef.current)
      maxWaitTimerRef.current = null
    }
  }, [])

  const commitDeviceDraft = useCallback(async (): Promise<void> => {
    if (store === undefined || learnerId === undefined) return

    const run = async () => {
      const record = readWritingRecord(recordRef)
      try {
        const checksum = await hashWritingDraftBody(record.draft.body)
        await store.put({
          baseVersion: record.expectedVersion,
          body: record.draft.body,
          checksum,
          learnerId,
          savedAt: Date.now(),
          writingId: initialWriting.id,
        })
        deviceBodyRef.current = record.draft.body
      } catch {
        return
      }
    }

    const nextWrite = deviceWriteChainRef.current.then(run, run)
    deviceWriteChainRef.current = nextWrite.then(
      () => undefined,
      () => undefined
    )
    await nextWrite
  }, [initialWriting.id, learnerId, store])

  useEffect(() => {
    commitDeviceDraftRef.current = commitDeviceDraft
  }, [commitDeviceDraft])

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

      if (inFlightPromiseRef.current !== null) {
        await inFlightPromiseRef.current
        return flushWritingWithTransport(transport)
      }

      const record = readWritingRecord(recordRef)
      if (!record.dirty || record.conflict !== null) return

      const saveSequence = (async () => {
        while (true) {
          const activeRecord = readWritingRecord(recordRef)
          if (!activeRecord.dirty || activeRecord.conflict !== null) return

          if (!browserIsOnline()) {
            setSafeStatus({ kind: "offline" })
            return
          }

          const sentDraft = activeRecord.draft
          const sentVersion = activeRecord.expectedVersion
          activeRecord.inFlight = true
          setSafeStatus({ kind: "saving" })

          const result = await settleLearnerApiRequest(
            saveWritingDraft({
              body: {
                ...sentDraft,
                expectedVersion: sentVersion,
              },
              transport,
              writingId: initialWriting.id,
            })
          )
          activeRecord.inFlight = false

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

          activeRecord.expectedVersion = result.value.version
          activeRecord.savedDraft = sentDraft
          activeRecord.updatedAt = result.value.updatedAt
          activeRecord.dirty = !sameDraft(activeRecord.draft, sentDraft)
          activeRecord.conflict = null
          setSafeDirty(activeRecord.dirty)

          if (!activeRecord.dirty) {
            setSafeStatus({
              kind: "saved",
              updatedAt: result.value.updatedAt,
            })
            onPersistedWritingRef.current?.(result.value)
            if (store !== undefined && learnerId !== undefined) {
              deviceBodyRef.current = sentDraft.body
              await store.delete(learnerId, initialWriting.id)
            }
            return
          }
        }
      })().finally(() => {
        inFlightPromiseRef.current = null
      })

      inFlightPromiseRef.current = saveSequence
      await saveSequence
    },
    [
      clearScheduledSave,
      initialWriting.id,
      learnerId,
      reconcile,
      setSafeDirty,
      setSafeStatus,
      store,
    ]
  )

  useEffect(() => {
    flushWritingRef.current = flushWritingWithTransport
  }, [flushWritingWithTransport])

  const scheduleSave = useCallback(() => {
    if (idleTimerRef.current !== null) {
      globalThis.clearTimeout(idleTimerRef.current)
    }
    idleTimerRef.current = globalThis.setTimeout(() => {
      idleTimerRef.current = null
      void flushWritingRef.current(defaultTransport())
    }, writingAutosaveIdleDelayMs)

    if (maxWaitTimerRef.current === null) {
      maxWaitTimerRef.current = globalThis.setTimeout(() => {
        maxWaitTimerRef.current = null
        void flushWritingRef.current(defaultTransport())
      }, writingAutosaveMaxWaitMs)
    }
  }, [defaultTransport])

  const stageWriting = useCallback(
    (draft: WritingDraftValues) => {
      const record = readWritingRecord(recordRef)
      record.draft = draft
      record.dirty = !sameDraft(draft, record.savedDraft)
      setSafeDirty(record.dirty)

      if (!record.dirty) {
        record.conflict = null
        deviceBodyRef.current = record.draft.body
        clearScheduledSave()
        setSafeStatus({ kind: "saved", updatedAt: record.updatedAt })
        if (store !== undefined && learnerId !== undefined) {
          void store.delete(learnerId, initialWriting.id)
        }
        return
      }

      void commitDeviceDraftRef.current()

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
    [
      clearScheduledSave,
      initialWriting.id,
      learnerId,
      scheduleSave,
      setSafeDirty,
      setSafeStatus,
      store,
    ]
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
    deviceBodyRef.current = serverWriting.body
    setSafeDirty(false)
    setSafeStatus({ kind: "saved", updatedAt: serverWriting.updatedAt })
    onServerWritingAppliedRef.current(serverWriting)
    if (store !== undefined && learnerId !== undefined) {
      void store.delete(learnerId, initialWriting.id)
    }
  }, [
    clearScheduledSave,
    initialWriting.id,
    learnerId,
    setSafeDirty,
    setSafeStatus,
    store,
  ])

  const hasUnsavedChanges = useCallback((): boolean => {
    const record = readWritingRecord(recordRef)
    if (record.conflict !== null) return true
    if (!record.dirty) return false
    return deviceBodyRef.current !== record.draft.body
  }, [])

  const readExpectedVersion = useCallback(
    (): number => readWritingRecord(recordRef).expectedVersion,
    []
  )

  useEffect(() => {
    if (store === undefined || learnerId === undefined) {
      setReady(true)
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const local = await store.get(learnerId, initialWriting.id)
        if (cancelled) return

        const checksumMatches =
          local === null ||
          (await hashWritingDraftBody(local.body)) === local.checksum
        const decision = readWritingDeviceDraftDecision({
          local: checksumMatches ? local : "corrupt",
          serverBody: initialWriting.body,
          serverVersion: initialWriting.version,
        })
        const record = readWritingRecord(recordRef)

        switch (decision.kind) {
          case "server":
            if (local !== null) {
              await store.delete(learnerId, initialWriting.id)
            }
            break
          case "discard-corrupt":
            await store.delete(learnerId, initialWriting.id)
            break
          case "recover": {
            record.draft = { body: decision.draft.body }
            record.dirty = !sameDraft(record.draft, record.savedDraft)
            deviceBodyRef.current = decision.draft.body
            setSafeDirty(record.dirty)
            setRecovered(true)
            onRecoveredWritingRef.current?.({
              ...initialWriting,
              body: decision.draft.body,
            })
            if (record.dirty) {
              setSafeStatus({ kind: "saving" })
              void flushWritingRef.current(defaultTransport())
            }
            break
          }
          case "conflict": {
            record.draft = { body: decision.draft.body }
            record.dirty = true
            record.conflict = {
              localDraft: record.draft,
              serverWriting: initialWriting,
            }
            deviceBodyRef.current = decision.draft.body
            setSafeDirty(true)
            setRecovered(true)
            onRecoveredWritingRef.current?.({
              ...initialWriting,
              body: decision.draft.body,
            })
            setSafeStatus({ kind: "conflict", ...record.conflict })
            break
          }
        }
      } catch {
        return
      } finally {
        if (!cancelled) setReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    defaultTransport,
    initialWriting,
    learnerId,
    setSafeDirty,
    setSafeStatus,
    store,
  ])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges()) return
      event.preventDefault()
      event.returnValue = ""
    }
    const handleOnline = () => {
      void reconcile()
    }
    const handleHiddenFlush = () => {
      void commitDeviceDraftRef.current()
      void flushWritingRef.current({ kind: "unload" })
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleHiddenFlush()
      } else {
        void reconcile()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("online", handleOnline)
    window.addEventListener("pagehide", handleHiddenFlush)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("freeze", handleHiddenFlush)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("pagehide", handleHiddenFlush)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("freeze", handleHiddenFlush)
      clearScheduledSave()
      void commitDeviceDraftRef.current()
      void flushWritingRef.current({ kind: "unload" })
    }
  }, [clearScheduledSave, hasUnsavedChanges, reconcile])

  return {
    commitDeviceDraft,
    dirty,
    flushWriting,
    hasUnsavedChanges,
    readExpectedVersion,
    ready,
    reconcile,
    recovered,
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
  return { body: writing.body }
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
  return left.body === right.body
}

function browserIsOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine
}
