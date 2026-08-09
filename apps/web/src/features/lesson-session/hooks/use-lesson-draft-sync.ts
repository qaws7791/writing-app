"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

import { getLesson } from "@workspace/http-client/learner"

import {
  saveStepDraft,
  type DraftSaveTransport,
} from "@/features/lesson-session/api/draft-transport"
import {
  isLearnerApiAbortedError,
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

export type LessonDraftFlushResult =
  | { readonly status: "blocked" }
  | { readonly status: "ready" }

type DraftRecord = {
  answer: LessonStepDraftAnswer
  dirty: boolean
  expectedVersion: number | null
  inFlight: Promise<void> | null
  savedAnswer: LessonStepDraftAnswer | null
  updatedAt: string | null
}

type CurrentDraftResult =
  | { readonly draft: LessonStepDraft | null; readonly status: "ok" }
  | { readonly status: "error" }

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

  const bumpRenderRevision = useCallback((stepId: string) => {
    if (!mountedRef.current) return
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
        if (record.inFlight !== null) continue
        const serverDraft = serverDraftByStepId.get(stepId) ?? null

        if (record.dirty) {
          if (serverBaseChanged(record, serverDraft)) {
            rebaseDirtyRecord(record, serverDraft)
          }
          continue
        }

        if (serverDraft === null) {
          records.delete(stepId)
          onServerDraftAppliedRef.current(stepId, null)
          bumpRenderRevision(stepId)
          continue
        }

        if (!serverBaseChanged(record, serverDraft)) continue

        updateRecordFromServer(record, serverDraft)
        onServerDraftAppliedRef.current(stepId, serverDraft.answer)
        bumpRenderRevision(stepId)
      }

      for (const serverDraft of serverDrafts) {
        if (records.has(serverDraft.stepId)) continue
        records.set(serverDraft.stepId, createServerDraftRecord(serverDraft))
        onServerDraftAppliedRef.current(serverDraft.stepId, serverDraft.answer)
        bumpRenderRevision(serverDraft.stepId)
      }
    },
    [bumpRenderRevision]
  )

  const readCurrentDraft = useCallback(
    async (stepId: string): Promise<CurrentDraftResult> => {
      const result = await settleLearnerApiRequest(
        getLesson(lessonId, { signal: readAbortSignal() })
      )
      if (result.status === "error") return { status: "error" }
      if (
        result.value.version.curriculumVersionId !== expectedCurriculumVersionId
      ) {
        return { status: "error" }
      }

      const draft = parseLessonStepDrafts(result.value.drafts).find(
        (candidate) => candidate.stepId === stepId
      )
      return { draft: draft ?? null, status: "ok" }
    },
    [expectedCurriculumVersionId, lessonId, readAbortSignal]
  )

  const saveDirtyRecord = useCallback(
    async (
      stepId: string,
      record: DraftRecord,
      transport: DraftSaveTransport
    ): Promise<void> => {
      let conflictRetryAvailable = true

      while (record.dirty) {
        if (!browserIsOnline()) return

        const sentAnswer = record.answer
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

        if (result.status === "error") {
          if (isLearnerApiAbortedError(result.error)) return
          if (
            conflictRetryAvailable &&
            readLearnerApiErrorCode(result.error) ===
              "STEP_DRAFT_VERSION_CONFLICT"
          ) {
            conflictRetryAvailable = false
            const currentDraft = await readCurrentDraft(stepId)
            if (currentDraft.status === "error") return
            rebaseDirtyRecord(record, currentDraft.draft)
            continue
          }
          return
        }

        const savedDraft = parseLessonStepDraft(result.value)
        record.expectedVersion = savedDraft.version
        record.savedAnswer = savedDraft.answer
        record.updatedAt = savedDraft.updatedAt
        record.dirty = !sameDraftAnswer(record.answer, sentAnswer)
      }
    },
    [expectedCurriculumVersionId, lessonId, readCurrentDraft]
  )

  const flushStepDraftWithTransport = useCallback(
    async (stepId: string, transport: DraftSaveTransport): Promise<void> => {
      clearScheduledSave(stepId)
      const record = readDraftRecords(recordsRef).get(stepId)
      if (record === undefined || !record.dirty) return

      if (record.inFlight !== null) {
        await record.inFlight
        const currentRecord = readDraftRecords(recordsRef).get(stepId)
        if (currentRecord?.dirty) {
          await flushStepDraftRef.current(stepId, transport)
        }
        return
      }

      const operation = saveDirtyRecord(stepId, record, transport)
      record.inFlight = operation
      try {
        await operation
      } finally {
        if (record.inFlight === operation) record.inFlight = null
      }
    },
    [clearScheduledSave, saveDirtyRecord]
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

  const flushAll = useCallback(async (): Promise<LessonDraftFlushResult> => {
    await flushAllWithTransport(defaultTransport())
    const isReady = [...readDraftRecords(recordsRef).values()].every(
      (record) => !record.dirty && record.inFlight === null
    )
    return { status: isReady ? "ready" : "blocked" }
  }, [defaultTransport, flushAllWithTransport])

  const reconcile = useCallback((): Promise<void> => {
    if (reconcilePromiseRef.current !== null) {
      return reconcilePromiseRef.current
    }

    const reconciliation = (async () => {
      const result = await settleLearnerApiRequest(
        getLesson(lessonId, { signal: readAbortSignal() })
      )
      if (result.status === "error") return
      if (
        result.value.version.curriculumVersionId !== expectedCurriculumVersionId
      ) {
        return
      }

      applyServerDrafts(parseLessonStepDrafts(result.value.drafts))

      const pendingStepIds = [...readDraftRecords(recordsRef)]
        .filter(([, record]) => record.dirty)
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
  ])

  const stageDraft = useCallback(
    (stepId: string, answer: LessonStepDraftAnswer) => {
      const records = readDraftRecords(recordsRef)
      const record = records.get(stepId) ?? createUnsavedDraftRecord(answer)
      records.set(stepId, record)

      record.answer = answer
      record.dirty = !sameNullableAnswer(answer, record.savedAnswer)

      if (!record.dirty) {
        clearScheduledSave(stepId)
        return
      }

      if (browserIsOnline()) scheduleSave(stepId)
    },
    [clearScheduledSave, scheduleSave]
  )

  const discardSubmittedDraft = useCallback(
    (stepId: string) => {
      clearScheduledSave(stepId)
      readDraftRecords(recordsRef).delete(stepId)
    },
    [clearScheduledSave]
  )

  useEffect(() => {
    const scheduledTimers = timersRef.current
    const handleFocus = () => {
      if (document.visibilityState === "visible") void reconcile()
    }
    const handleOnline = () => {
      void reconcile()
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
    window.addEventListener("pagehide", handlePageHide)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      globalThis.clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("pagehide", handlePageHide)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      for (const timer of scheduledTimers.values()) {
        globalThis.clearTimeout(timer)
      }
      scheduledTimers.clear()
    }
  }, [flushAllWithTransport, reconcile])

  return {
    applyServerDrafts,
    discardSubmittedDraft,
    flushAll,
    flushStepDraft,
    renderRevisionByStepId,
    stageDraft,
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
    dirty: false,
    expectedVersion: draft.version,
    inFlight: null,
    savedAnswer: draft.answer,
    updatedAt: draft.updatedAt,
  }
}

function createUnsavedDraftRecord(answer: LessonStepDraftAnswer): DraftRecord {
  return {
    answer,
    dirty: true,
    expectedVersion: null,
    inFlight: null,
    savedAnswer: null,
    updatedAt: null,
  }
}

function rebaseDirtyRecord(
  record: DraftRecord,
  draft: LessonStepDraft | null
): void {
  record.expectedVersion = draft?.version ?? null
  record.savedAnswer = draft?.answer ?? null
  record.updatedAt = draft?.updatedAt ?? null
  record.dirty = !sameNullableAnswer(record.answer, record.savedAnswer)
}

function updateRecordFromServer(
  record: DraftRecord,
  draft: LessonStepDraft
): void {
  record.answer = draft.answer
  record.dirty = false
  record.expectedVersion = draft.version
  record.savedAnswer = draft.answer
  record.updatedAt = draft.updatedAt
}

function serverBaseChanged(
  record: DraftRecord,
  draft: LessonStepDraft | null
): boolean {
  return (
    (draft?.version ?? null) !== record.expectedVersion ||
    !sameOptionalAnswer(draft?.answer, record.savedAnswer)
  )
}

function readDraftRecords(
  recordsRef: RefObject<Map<string, DraftRecord> | null>
): Map<string, DraftRecord> {
  const records = recordsRef.current
  if (records === null) {
    throw new Error("레슨을 준비하지 못했습니다.")
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

function sameNullableAnswer(
  left: LessonStepDraftAnswer,
  right: LessonStepDraftAnswer | null
): boolean {
  return right !== null && sameDraftAnswer(left, right)
}

function sameDraftAnswer(
  left: LessonStepDraftAnswer,
  right: LessonStepDraftAnswer
): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
