"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

import { getLesson } from "@workspace/http-client/learner"

import {
  saveStepDraft,
  type DraftSaveTransport,
} from "@/features/lesson-session/api/draft-transport"
import {
  isLearnerApiAbortedError,
  isLearnerApiNetworkError,
  readLearnerApiErrorCode,
  settleLearnerApiRequest,
} from "@/shared/http/learner-api-client"
import {
  parseLessonStepDraft,
  parseLessonStepDrafts,
  type LessonStepDraft,
  type LessonStepDraftAnswer,
} from "@/features/lesson-session/model/lesson-view-model"
import { useUnmountAbortSignal } from "@/shared/http/use-unmount-abort-signal"

const AUTOSAVE_DELAY_MS = 800
const RECONCILE_INTERVAL_MS = 30_000

export type LessonDraftSyncStatus =
  | { readonly kind: "idle" }
  | { readonly kind: "saving" }
  | { readonly kind: "saved"; readonly updatedAt: string }
  | { readonly kind: "offline" }
  | { readonly kind: "error"; readonly message: string }
  | {
      readonly kind: "conflict"
      readonly localAnswer: LessonStepDraftAnswer
      readonly serverDraft: LessonStepDraft | null
    }

type DraftRecord = {
  answer: LessonStepDraftAnswer
  conflict: {
    readonly localAnswer: LessonStepDraftAnswer
    readonly serverDraft: LessonStepDraft | null
  } | null
  dirty: boolean
  expectedVersion: number | null
  inFlight: boolean
  savedAnswer: LessonStepDraftAnswer | null
  updatedAt: string | null
}

export function useLessonDraftSync({
  expectedCurriculumVersionId,
  initialDrafts,
  lessonId,
  onServerDraftApplied,
}: {
  readonly expectedCurriculumVersionId: string
  readonly initialDrafts: readonly LessonStepDraft[]
  readonly lessonId: string
  readonly onServerDraftApplied: (
    stepId: string,
    answer: LessonStepDraftAnswer | null
  ) => void
}) {
  const recordsRef = useRef<Map<string, DraftRecord> | null>(null)
  const timersRef = useRef(
    new Map<string, ReturnType<typeof globalThis.setTimeout>>()
  )
  const flushStepDraftRef = useRef<
    (stepId: string, transport: DraftSaveTransport) => Promise<void>
  >(async () => undefined)
  const reconcilePromiseRef = useRef<Promise<void> | null>(null)
  const mountedRef = useRef(false)
  const readAbortSignal = useUnmountAbortSignal()
  const onServerDraftAppliedRef = useRef(onServerDraftApplied)
  const [renderRevisionByStepId, setRenderRevisionByStepId] = useState<
    Readonly<Record<string, number>>
  >({})
  const [statusByStepId, setStatusByStepId] = useState<
    Readonly<Record<string, LessonDraftSyncStatus>>
  >(() =>
    Object.fromEntries(
      initialDrafts.map((draft) => [
        draft.stepId,
        { kind: "saved", updatedAt: draft.updatedAt },
      ])
    )
  )

  if (recordsRef.current === null) {
    recordsRef.current = createDraftRecords(initialDrafts)
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    onServerDraftAppliedRef.current = onServerDraftApplied
  }, [onServerDraftApplied])

  const setStepStatus = useCallback(
    (stepId: string, status: LessonDraftSyncStatus) => {
      if (!mountedRef.current) return
      setStatusByStepId((current) => ({ ...current, [stepId]: status }))
    },
    []
  )

  const bumpRenderRevision = useCallback((stepId: string) => {
    setRenderRevisionByStepId((current) => ({
      ...current,
      [stepId]: (current[stepId] ?? 0) + 1,
    }))
  }, [])

  const defaultTransport = useCallback(
    (): DraftSaveTransport => ({
      kind: "default",
      signal: readAbortSignal(),
    }),
    [readAbortSignal]
  )

  const clearScheduledSave = useCallback((stepId: string) => {
    const timer = timersRef.current.get(stepId)
    if (timer === undefined) return
    globalThis.clearTimeout(timer)
    timersRef.current.delete(stepId)
  }, [])

  const scheduleSave = useCallback(
    (stepId: string) => {
      clearScheduledSave(stepId)
      const timer = globalThis.setTimeout(() => {
        timersRef.current.delete(stepId)
        void flushStepDraftRef.current(stepId, defaultTransport())
      }, AUTOSAVE_DELAY_MS)
      timersRef.current.set(stepId, timer)
    },
    [clearScheduledSave, defaultTransport]
  )

  const applyServerDrafts = useCallback(
    (serverDrafts: readonly LessonStepDraft[]) => {
      const records = readDraftRecords(recordsRef)
      const serverDraftByStepId = new Map<string, LessonStepDraft>(
        serverDrafts.map((draft) => [draft.stepId, draft])
      )

      for (const [stepId, record] of records) {
        if (record.inFlight) continue
        const serverDraft = serverDraftByStepId.get(stepId) ?? null

        if (record.dirty) {
          const serverChanged =
            (serverDraft?.version ?? null) !== record.expectedVersion ||
            !sameOptionalAnswer(serverDraft?.answer, record.savedAnswer)

          if (serverChanged) {
            record.conflict = {
              localAnswer: record.answer,
              serverDraft,
            }
            setStepStatus(stepId, {
              kind: "conflict",
              ...record.conflict,
            })
          }
          continue
        }

        if (serverDraft === null) {
          if (record.expectedVersion !== null) {
            record.conflict = {
              localAnswer: record.answer,
              serverDraft: null,
            }
            setStepStatus(stepId, {
              kind: "conflict",
              ...record.conflict,
            })
          }
          continue
        }

        if (
          serverDraft.version === record.expectedVersion &&
          sameDraftAnswer(serverDraft.answer, record.savedAnswer)
        ) {
          continue
        }

        updateRecordFromServer(record, serverDraft)
        setStepStatus(stepId, {
          kind: "saved",
          updatedAt: serverDraft.updatedAt,
        })
        onServerDraftAppliedRef.current(stepId, serverDraft.answer)
        bumpRenderRevision(stepId)
      }

      for (const serverDraft of serverDrafts) {
        if (records.has(serverDraft.stepId)) continue
        records.set(serverDraft.stepId, createServerDraftRecord(serverDraft))
        setStepStatus(serverDraft.stepId, {
          kind: "saved",
          updatedAt: serverDraft.updatedAt,
        })
        onServerDraftAppliedRef.current(serverDraft.stepId, serverDraft.answer)
        bumpRenderRevision(serverDraft.stepId)
      }
    },
    [bumpRenderRevision, setStepStatus]
  )

  const reconcile = useCallback((): Promise<void> => {
    if (reconcilePromiseRef.current !== null) {
      return reconcilePromiseRef.current
    }

    const reconciliation = (async () => {
      const result = await settleLearnerApiRequest(
        getLesson(lessonId, { signal: readAbortSignal() })
      )

      if (result.status === "error") {
        if (isLearnerApiAbortedError(result.error)) return
        const records = readDraftRecords(recordsRef)
        for (const [stepId, record] of records) {
          if (!record.dirty) continue
          setStepStatus(
            stepId,
            isLearnerApiNetworkError(result.error)
              ? { kind: "offline" }
              : { kind: "error", message: result.error.message }
          )
        }
        return
      }

      if (
        result.value.version.curriculumVersionId !== expectedCurriculumVersionId
      ) {
        const records = readDraftRecords(recordsRef)
        for (const [stepId, record] of records) {
          if (!record.dirty) continue
          setStepStatus(stepId, {
            kind: "error",
            message:
              "학습 콘텐츠 버전이 변경되었습니다. 레슨을 다시 열어 주세요.",
          })
        }
        return
      }

      applyServerDrafts(parseLessonStepDrafts(result.value.drafts))

      const pendingStepIds = [...readDraftRecords(recordsRef)]
        .filter(([, record]) => record.dirty && record.conflict === null)
        .map(([stepId]) => stepId)
      await Promise.all(
        pendingStepIds.map((stepId) =>
          flushStepDraftRef.current(stepId, defaultTransport())
        )
      )
    })().finally(() => {
      reconcilePromiseRef.current = null
    })

    reconcilePromiseRef.current = reconciliation
    return reconciliation
  }, [
    applyServerDrafts,
    defaultTransport,
    expectedCurriculumVersionId,
    lessonId,
    readAbortSignal,
    setStepStatus,
  ])

  const flushStepDraftWithTransport = useCallback(
    async (stepId: string, transport: DraftSaveTransport): Promise<void> => {
      clearScheduledSave(stepId)
      const record = readDraftRecords(recordsRef).get(stepId)
      if (
        record === undefined ||
        !record.dirty ||
        record.inFlight ||
        record.conflict !== null
      ) {
        return
      }

      if (!browserIsOnline()) {
        setStepStatus(stepId, { kind: "offline" })
        return
      }

      const sentAnswer = record.answer
      record.inFlight = true
      setStepStatus(stepId, { kind: "saving" })

      const result = await settleLearnerApiRequest(
        saveStepDraft({
          body: {
            answer: sentAnswer,
            expectedCurriculumVersionId,
            expectedVersion: record.expectedVersion,
          },
          lessonId,
          stepId,
          transport,
        })
      )
      record.inFlight = false

      if (result.status === "error") {
        if (isLearnerApiAbortedError(result.error)) return
        if (
          readLearnerApiErrorCode(result.error) ===
          "STEP_DRAFT_VERSION_CONFLICT"
        ) {
          await reconcile()
          return
        }

        setStepStatus(
          stepId,
          isLearnerApiNetworkError(result.error)
            ? { kind: "offline" }
            : { kind: "error", message: result.error.message }
        )
        return
      }

      const savedDraft = parseLessonStepDraft(result.value)
      record.expectedVersion = savedDraft.version
      record.savedAnswer = savedDraft.answer
      record.updatedAt = savedDraft.updatedAt
      record.dirty = !sameDraftAnswer(record.answer, sentAnswer)
      record.conflict = null

      if (!record.dirty) {
        setStepStatus(stepId, {
          kind: "saved",
          updatedAt: savedDraft.updatedAt,
        })
        return
      }

      setStepStatus(stepId, { kind: "saving" })
      queueMicrotask(() => {
        void flushStepDraftRef.current(stepId, transport)
      })
    },
    [
      clearScheduledSave,
      expectedCurriculumVersionId,
      lessonId,
      reconcile,
      setStepStatus,
    ]
  )

  useEffect(() => {
    flushStepDraftRef.current = flushStepDraftWithTransport
  }, [flushStepDraftWithTransport])

  const flushStepDraft = useCallback(
    (stepId: string): Promise<void> =>
      flushStepDraftRef.current(stepId, defaultTransport()),
    [defaultTransport]
  )

  const flushAllWithTransport = useCallback(
    async (transport: DraftSaveTransport): Promise<void> => {
      await Promise.all(
        [...readDraftRecords(recordsRef).keys()].map((stepId) =>
          flushStepDraftRef.current(stepId, transport)
        )
      )
    },
    []
  )

  const flushAll = useCallback(
    (): Promise<void> => flushAllWithTransport(defaultTransport()),
    [defaultTransport, flushAllWithTransport]
  )

  const stageDraft = useCallback(
    (stepId: string, answer: LessonStepDraftAnswer) => {
      const records = readDraftRecords(recordsRef)
      const record = records.get(stepId) ?? createUnsavedDraftRecord(answer)
      records.set(stepId, record)

      record.answer = answer
      record.dirty = !sameOptionalAnswer(answer, record.savedAnswer)

      if (!record.dirty) {
        record.conflict = null
        clearScheduledSave(stepId)
        setStepStatus(
          stepId,
          record.updatedAt === null
            ? { kind: "idle" }
            : { kind: "saved", updatedAt: record.updatedAt }
        )
        return
      }

      if (record.conflict !== null) {
        record.conflict = {
          ...record.conflict,
          localAnswer: answer,
        }
        setStepStatus(stepId, {
          kind: "conflict",
          ...record.conflict,
        })
        return
      }

      if (!browserIsOnline()) {
        setStepStatus(stepId, { kind: "offline" })
        return
      }

      setStepStatus(stepId, { kind: "saving" })
      scheduleSave(stepId)
    },
    [clearScheduledSave, scheduleSave, setStepStatus]
  )

  const discardSubmittedDraft = useCallback(
    (stepId: string) => {
      clearScheduledSave(stepId)
      readDraftRecords(recordsRef).delete(stepId)
      setStatusByStepId((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([id]) => id !== stepId)
        )
      )
    },
    [clearScheduledSave]
  )

  const retryLocalDraft = useCallback(
    (stepId: string) => {
      const record = readDraftRecords(recordsRef).get(stepId)
      if (record?.conflict === null || record?.conflict === undefined) return
      const serverDraft = record.conflict.serverDraft
      record.savedAnswer = serverDraft?.answer ?? null
      record.expectedVersion = serverDraft?.version ?? null
      record.updatedAt = serverDraft?.updatedAt ?? null
      record.conflict = null
      record.dirty = true
      setStepStatus(stepId, { kind: "saving" })
      void flushStepDraftRef.current(stepId, defaultTransport())
    },
    [defaultTransport, setStepStatus]
  )

  const useServerDraft = useCallback(
    (stepId: string) => {
      const records = readDraftRecords(recordsRef)
      const record = records.get(stepId)
      if (record?.conflict === null || record?.conflict === undefined) return
      clearScheduledSave(stepId)
      const serverDraft = record.conflict.serverDraft

      if (serverDraft === null) {
        records.delete(stepId)
        onServerDraftAppliedRef.current(stepId, null)
        setStepStatus(stepId, { kind: "idle" })
      } else {
        updateRecordFromServer(record, serverDraft)
        onServerDraftAppliedRef.current(stepId, serverDraft.answer)
        setStepStatus(stepId, {
          kind: "saved",
          updatedAt: serverDraft.updatedAt,
        })
      }

      bumpRenderRevision(stepId)
    },
    [bumpRenderRevision, clearScheduledSave, setStepStatus]
  )

  useEffect(() => {
    const scheduledTimers = timersRef.current
    const handleFocus = () => {
      if (document.visibilityState === "visible") void reconcile()
    }
    const handleOnline = () => {
      void reconcile()
    }
    const handleOffline = () => {
      for (const [stepId, record] of readDraftRecords(recordsRef)) {
        if (record.dirty) setStepStatus(stepId, { kind: "offline" })
      }
    }
    const handlePageHide = () => {
      void flushAllWithTransport({ kind: "unload" })
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void flushAllWithTransport({ kind: "unload" })
      } else {
        void reconcile()
      }
    }
    const interval = globalThis.setInterval(() => {
      if (document.visibilityState === "visible") void reconcile()
    }, RECONCILE_INTERVAL_MS)

    window.addEventListener("focus", handleFocus)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("pagehide", handlePageHide)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      globalThis.clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("pagehide", handlePageHide)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      for (const timer of scheduledTimers.values()) {
        globalThis.clearTimeout(timer)
      }
      scheduledTimers.clear()
    }
  }, [flushAllWithTransport, reconcile, setStepStatus])

  return {
    applyServerDrafts,
    discardSubmittedDraft,
    flushAll,
    flushStepDraft,
    reconcile,
    renderRevisionByStepId,
    retryLocalDraft,
    stageDraft,
    statusByStepId,
    useServerDraft,
  }
}

function createDraftRecords(
  drafts: readonly LessonStepDraft[]
): Map<string, DraftRecord> {
  return new Map(
    drafts.map((draft) => [draft.stepId, createServerDraftRecord(draft)])
  )
}

function createServerDraftRecord(draft: LessonStepDraft): DraftRecord {
  return {
    answer: draft.answer,
    conflict: null,
    dirty: false,
    expectedVersion: draft.version,
    inFlight: false,
    savedAnswer: draft.answer,
    updatedAt: draft.updatedAt,
  }
}

function createUnsavedDraftRecord(answer: LessonStepDraftAnswer): DraftRecord {
  return {
    answer,
    conflict: null,
    dirty: true,
    expectedVersion: null,
    inFlight: false,
    savedAnswer: null,
    updatedAt: null,
  }
}

function updateRecordFromServer(
  record: DraftRecord,
  draft: LessonStepDraft
): void {
  record.answer = draft.answer
  record.conflict = null
  record.dirty = false
  record.expectedVersion = draft.version
  record.savedAnswer = draft.answer
  record.updatedAt = draft.updatedAt
}

function readDraftRecords(
  recordsRef: RefObject<Map<string, DraftRecord> | null>
): Map<string, DraftRecord> {
  const records = recordsRef.current
  if (records === null) {
    throw new Error("레슨 드래프트 동기화가 초기화되지 않았습니다.")
  }
  return records
}

function browserIsOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine
}

function sameOptionalAnswer(
  left: LessonStepDraftAnswer | undefined,
  right: LessonStepDraftAnswer | null
): boolean {
  return left === undefined
    ? right === null
    : right !== null && sameDraftAnswer(left, right)
}

function sameDraftAnswer(
  left: LessonStepDraftAnswer,
  right: LessonStepDraftAnswer | null
): boolean {
  return right !== null && JSON.stringify(left) === JSON.stringify(right)
}
