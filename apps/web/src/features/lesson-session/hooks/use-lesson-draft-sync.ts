"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

import { getLesson, saveLearnerStepDraft } from "@workspace/http-client/learner"

import {
  isLearnerApiNetworkError,
  readLearnerApiErrorCode,
  settleLearnerApiRequest,
  type LearnerStepDraftAnswerDto,
  type LearnerStepDraftDto,
} from "@/shared/http/learner-api-client"

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
      readonly localAnswer: LearnerStepDraftAnswerDto
      readonly serverDraft: LearnerStepDraftDto | null
    }

type DraftRecord = {
  answer: LearnerStepDraftAnswerDto
  conflict: {
    readonly localAnswer: LearnerStepDraftAnswerDto
    readonly serverDraft: LearnerStepDraftDto | null
  } | null
  dirty: boolean
  expectedVersion: number | null
  inFlight: boolean
  savedAnswer: LearnerStepDraftAnswerDto | null
  updatedAt: string | null
}

export function useLessonDraftSync({
  expectedCurriculumVersionId,
  initialDrafts,
  lessonId,
  onServerDraftApplied,
}: {
  readonly expectedCurriculumVersionId: string
  readonly initialDrafts: readonly LearnerStepDraftDto[]
  readonly lessonId: string
  readonly onServerDraftApplied: (
    stepId: string,
    answer: LearnerStepDraftAnswerDto | null
  ) => void
}) {
  const recordsRef = useRef<Map<string, DraftRecord> | null>(null)
  const timersRef = useRef(
    new Map<string, ReturnType<typeof globalThis.setTimeout>>()
  )
  const flushStepDraftRef = useRef<(stepId: string) => Promise<void>>(
    async () => undefined
  )
  const reconcilePromiseRef = useRef<Promise<void> | null>(null)
  const mountedRef = useRef(false)
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
    if (!mountedRef.current) return
    setRenderRevisionByStepId((current) => ({
      ...current,
      [stepId]: (current[stepId] ?? 0) + 1,
    }))
  }, [])

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
        void flushStepDraftRef.current(stepId)
      }, AUTOSAVE_DELAY_MS)
      timersRef.current.set(stepId, timer)
    },
    [clearScheduledSave]
  )

  const applyServerDrafts = useCallback(
    (serverDrafts: readonly LearnerStepDraftDto[]) => {
      const records = readDraftRecords(recordsRef)
      const serverDraftByStepId = new Map<string, LearnerStepDraftDto>(
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
      const result = await settleLearnerApiRequest(getLesson(lessonId))

      if (result.status === "error") {
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

      applyServerDrafts(result.value.drafts)

      const pendingStepIds = [...readDraftRecords(recordsRef)]
        .filter(([, record]) => record.dirty && record.conflict === null)
        .map(([stepId]) => stepId)
      await Promise.all(
        pendingStepIds.map((stepId) => flushStepDraftRef.current(stepId))
      )
    })().finally(() => {
      reconcilePromiseRef.current = null
    })

    reconcilePromiseRef.current = reconciliation
    return reconciliation
  }, [applyServerDrafts, expectedCurriculumVersionId, lessonId, setStepStatus])

  const flushStepDraft = useCallback(
    async (stepId: string): Promise<void> => {
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
        saveLearnerStepDraft(lessonId, stepId, {
          answer: sentAnswer,
          expectedCurriculumVersionId,
          expectedVersion: record.expectedVersion,
        })
      )
      record.inFlight = false

      if (result.status === "error") {
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

      record.expectedVersion = result.value.version
      record.savedAnswer = result.value.answer
      record.updatedAt = result.value.updatedAt
      record.dirty = !sameDraftAnswer(record.answer, sentAnswer)
      record.conflict = null

      if (!record.dirty) {
        setStepStatus(stepId, {
          kind: "saved",
          updatedAt: result.value.updatedAt,
        })
        return
      }

      setStepStatus(stepId, { kind: "saving" })
      queueMicrotask(() => {
        void flushStepDraftRef.current(stepId)
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
    flushStepDraftRef.current = flushStepDraft
  }, [flushStepDraft])

  const flushAll = useCallback(async (): Promise<void> => {
    await Promise.all(
      [...readDraftRecords(recordsRef).keys()].map((stepId) =>
        flushStepDraftRef.current(stepId)
      )
    )
  }, [])

  const stageDraft = useCallback(
    (stepId: string, answer: LearnerStepDraftAnswerDto) => {
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
      if (!mountedRef.current) return
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
      void flushStepDraftRef.current(stepId)
    },
    [setStepStatus]
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
      void flushAll()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void flushAll()
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
  }, [flushAll, reconcile, setStepStatus])

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
  drafts: readonly LearnerStepDraftDto[]
): Map<string, DraftRecord> {
  return new Map(
    drafts.map((draft) => [draft.stepId, createServerDraftRecord(draft)])
  )
}

function createServerDraftRecord(draft: LearnerStepDraftDto): DraftRecord {
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

function createUnsavedDraftRecord(
  answer: LearnerStepDraftAnswerDto
): DraftRecord {
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
  draft: LearnerStepDraftDto
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
  left: LearnerStepDraftAnswerDto | undefined,
  right: LearnerStepDraftAnswerDto | null
): boolean {
  return left === undefined
    ? right === null
    : right !== null && sameDraftAnswer(left, right)
}

function sameDraftAnswer(
  left: LearnerStepDraftAnswerDto,
  right: LearnerStepDraftAnswerDto | null
): boolean {
  return right !== null && JSON.stringify(left) === JSON.stringify(right)
}
