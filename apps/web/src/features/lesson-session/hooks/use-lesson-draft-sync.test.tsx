import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

const generatedClient = vi.hoisted(() => ({
  getLesson: vi.fn(),
  saveLearnerStepDraft: vi.fn(),
}))

vi.mock("@workspace/http-client/learner", () => generatedClient)

import { useLessonDraftSync } from "@/features/lesson-session/hooks/use-lesson-draft-sync"
import { parseLessonStepDrafts } from "@/features/lesson-session/model/lesson-view-model"
import type {
  LearnerLessonDto,
  LearnerSaveStepDraftBodyDto,
  LearnerSaveStepDraftResultDto,
  LearnerStepDraftAnswerDto,
  LearnerStepDraftDto,
} from "@/shared/http/learner-api-client"

const initialAnswer = { text: "서버 초안", type: "WRITE" } as const
const localAnswer = { text: "로컬 수정", type: "WRITE" } as const
const latestAnswer = { text: "다른 탭 수정", type: "WRITE" } as const

describe("useLessonDraftSync", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setOnline(true)
    setVisibility("visible")
    generatedClient.getLesson.mockReset()
    generatedClient.getLesson.mockImplementation(async () => createLesson([]))
    generatedClient.saveLearnerStepDraft.mockReset()
    generatedClient.saveLearnerStepDraft.mockImplementation(
      async (
        _lessonId: string,
        _stepId: string,
        request: LearnerSaveStepDraftBodyDto
      ) => createDraft(request.answer, 1)
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    {
      advanceMs: 799,
      expectedCalls: 0,
      label: "debounce 경계 이전에는 초안을 저장하지 않는다",
    },
    {
      advanceMs: 800,
      expectedCalls: 1,
      label: "debounce 경계에서 초안을 한 번 저장한다",
    },
  ])("$label", ({ advanceMs, expectedCalls }) => {
    const { result } = renderDraftSync()

    act(() => {
      result.current.stageDraft("step-write", localAnswer)
      vi.advanceTimersByTime(advanceMs)
    })

    expect(generatedClient.saveLearnerStepDraft).toHaveBeenCalledTimes(
      expectedCalls
    )
  })

  it("저장 진행 중 변경은 병렬 요청 없이 최신 version의 후속 저장으로 합친다", async () => {
    const firstSave = createDeferred<LearnerSaveStepDraftResultDto>()
    generatedClient.saveLearnerStepDraft.mockReturnValueOnce(firstSave.promise)
    const { result } = renderDraftSync()

    act(() => {
      result.current.stageDraft("step-write", localAnswer)
      vi.advanceTimersByTime(800)
    })
    act(() => {
      result.current.stageDraft("step-write", latestAnswer)
    })

    expect(generatedClient.saveLearnerStepDraft).toHaveBeenCalledTimes(1)

    await act(async () => {
      firstSave.resolve(createDraft(localAnswer, 1))
      await vi.waitFor(() => {
        expect(generatedClient.saveLearnerStepDraft).toHaveBeenCalledTimes(2)
      })
    })

    expect(generatedClient.saveLearnerStepDraft).toHaveBeenLastCalledWith(
      "lesson-1",
      "step-write",
      expect.objectContaining({
        answer: latestAnswer,
        expectedVersion: 1,
      }),
      { signal: expect.any(AbortSignal) }
    )
  })

  it("후속 저장까지 성공하면 나갈 준비가 된다", async () => {
    const { result } = renderDraftSync()

    act(() => {
      result.current.stageDraft("step-write", localAnswer)
      vi.advanceTimersByTime(800)
    })
    act(() => {
      result.current.stageDraft("step-write", latestAnswer)
    })

    await act(async () => {
      await vi.waitFor(() => {
        expect(generatedClient.saveLearnerStepDraft).toHaveBeenCalledTimes(2)
      })
    })

    await expect(result.current.flushAll()).resolves.toEqual({
      status: "ready",
    })
  })

  it("명시적 flush와 화면 숨김에서 debounce를 기다리지 않고 저장한다", async () => {
    const { result } = renderDraftSync()

    act(() => {
      result.current.stageDraft("step-write", localAnswer)
    })
    await act(async () => {
      await result.current.flushStepDraft("step-write")
    })

    expect(generatedClient.saveLearnerStepDraft).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.stageDraft("step-write", latestAnswer)
      setVisibility("hidden")
      document.dispatchEvent(new Event("visibilitychange"))
    })
    await act(async () => {
      await vi.waitFor(() => {
        expect(generatedClient.saveLearnerStepDraft).toHaveBeenCalledTimes(2)
      })
    })

    expect(generatedClient.saveLearnerStepDraft).toHaveBeenLastCalledWith(
      "lesson-1",
      "step-write",
      expect.objectContaining({ answer: latestAnswer }),
      { keepalive: true }
    )
  })

  it("화면 숨김 keepalive 저장이 실패하면 로컬 입력을 유지하고 다시 저장한다", async () => {
    generatedClient.saveLearnerStepDraft.mockRejectedValueOnce(
      new GeneratedApiClientError({
        kind: "network",
        method: "PUT",
        url: "/api/learning/lessons/lesson-1/steps/step-write/draft",
      })
    )
    const { result } = renderDraftSync()

    await act(async () => {
      result.current.stageDraft("step-write", localAnswer)
      setVisibility("hidden")
      document.dispatchEvent(new Event("visibilitychange"))
    })

    await act(async () => {
      await result.current.flushStepDraft("step-write")
    })

    expect(generatedClient.saveLearnerStepDraft).toHaveBeenLastCalledWith(
      "lesson-1",
      "step-write",
      expect.objectContaining({ answer: localAnswer }),
      { signal: expect.any(AbortSignal) }
    )
  })

  it("409이면 현재 입력을 최신 version에 자동으로 재적용한다", async () => {
    const serverDraft = createDraft(latestAnswer, 3)
    generatedClient.getLesson.mockResolvedValue(createLesson([serverDraft]))
    generatedClient.saveLearnerStepDraft
      .mockRejectedValueOnce(
        httpError("STEP_DRAFT_VERSION_CONFLICT", 409, "초안 버전 충돌")
      )
      .mockResolvedValueOnce(createDraft(localAnswer, 4))
    const { result } = renderDraftSync([createDraft(initialAnswer, 2)])

    act(() => {
      result.current.stageDraft("step-write", localAnswer)
    })
    await act(async () => {
      await result.current.flushStepDraft("step-write")
    })

    expect(generatedClient.saveLearnerStepDraft).toHaveBeenCalledTimes(2)
    expect(generatedClient.saveLearnerStepDraft).toHaveBeenLastCalledWith(
      "lesson-1",
      "step-write",
      expect.objectContaining({
        answer: localAnswer,
        expectedVersion: 3,
      }),
      { signal: expect.any(AbortSignal) }
    )
  })

  it("네트워크 실패 후 입력을 유지하고 online 재조정에서 저장을 재시도한다", async () => {
    generatedClient.getLesson.mockResolvedValue(
      createLesson([createDraft(initialAnswer, 1)])
    )
    generatedClient.saveLearnerStepDraft
      .mockRejectedValueOnce(
        new GeneratedApiClientError({
          kind: "network",
          method: "PUT",
          url: "/api/learning/lessons/lesson-1/steps/step-write/draft",
        })
      )
      .mockResolvedValueOnce(createDraft(localAnswer, 1))
    const { result } = renderDraftSync()

    act(() => {
      result.current.stageDraft("step-write", localAnswer)
    })
    await act(async () => {
      await result.current.flushStepDraft("step-write")
    })

    await act(async () => {
      window.dispatchEvent(new Event("online"))
      await vi.waitFor(() => {
        expect(generatedClient.saveLearnerStepDraft).toHaveBeenCalledTimes(2)
      })
    })

    expect(generatedClient.getLesson).toHaveBeenCalledOnce()
    expect(generatedClient.saveLearnerStepDraft).toHaveBeenCalledTimes(2)
    expect(generatedClient.saveLearnerStepDraft).toHaveBeenLastCalledWith(
      "lesson-1",
      "step-write",
      expect.objectContaining({ answer: localAnswer }),
      { signal: expect.any(AbortSignal) }
    )
  })

  it("다른 탭의 최신 서버 초안을 focus 재조정으로 적용한다", async () => {
    const onServerDraftApplied = vi.fn()
    const serverDraft = createDraft(latestAnswer, 2)
    generatedClient.getLesson.mockResolvedValue(createLesson([serverDraft]))
    const { result } = renderDraftSync(
      [createDraft(initialAnswer, 1)],
      onServerDraftApplied
    )

    await act(async () => {
      window.dispatchEvent(new Event("focus"))
      await vi.waitFor(() => {
        expect(onServerDraftApplied).toHaveBeenCalledWith(
          "step-write",
          latestAnswer
        )
      })
    })

    expect(result.current.renderRevisionByStepId["step-write"]).toBe(1)
  })

  it("입력을 반영하지 못하면 나가기를 보류한다", async () => {
    generatedClient.saveLearnerStepDraft.mockRejectedValue(
      new GeneratedApiClientError({
        kind: "network",
        method: "PUT",
        url: "/api/learning/lessons/lesson-1/steps/step-write/draft",
      })
    )
    const { result } = renderDraftSync()

    act(() => {
      result.current.stageDraft("step-write", localAnswer)
    })

    await expect(result.current.flushAll()).resolves.toEqual({
      status: "blocked",
    })
  })
})

function renderDraftSync(
  initialDrafts: readonly LearnerStepDraftDto[] = [
    createDraft(initialAnswer, 1),
  ],
  onServerDraftApplied = vi.fn()
) {
  const lesson = createLesson(initialDrafts)
  const parsedDrafts = parseLessonStepDrafts(initialDrafts)
  return renderHook(() =>
    useLessonDraftSync({
      expectedCurriculumVersionId: lesson.version.curriculumVersionId,
      initialDrafts: parsedDrafts,
      lessonId: lesson.id,
      onServerDraftApplied,
    })
  )
}

function createLesson(
  drafts: readonly LearnerStepDraftDto[]
): LearnerLessonDto {
  return {
    category: null,
    courseId: "course-1",
    description: null,
    drafts: [...drafts],
    estimatedMinutes: 5,
    id: "lesson-1",
    learning: {
      completedSteps: 0,
      currentStepId: "step-write",
      currentStepIndex: 0,
      progressPercent: 0,
      status: "in_progress",
      totalSteps: 1,
      version: { curriculumVersionId: "version-1", revision: 1 },
    },
    steps: [
      {
        id: "step-write",
        min: 1,
        sortOrder: 1,
        type: "WRITE",
      },
    ],
    summary: [],
    title: "초안 동기화 테스트",
    unitId: "unit-1",
    version: { curriculumVersionId: "version-1", revision: 1 },
  }
}

function createDraft(
  answer: LearnerStepDraftAnswerDto,
  version: number
): LearnerStepDraftDto {
  return {
    answer,
    stepId: "step-write",
    updatedAt: `2026-07-24T00:00:0${version}.000Z`,
    version,
  }
}

function httpError(
  code: string,
  status: number,
  message: string
): GeneratedApiClientError {
  return new GeneratedApiClientError({
    error: { code, message, requestId: "request-1", violations: [] },
    kind: "http",
    retryAfterSeconds: null,
    status,
  })
}

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  })
}

function setVisibility(value: DocumentVisibilityState): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value,
  })
}
