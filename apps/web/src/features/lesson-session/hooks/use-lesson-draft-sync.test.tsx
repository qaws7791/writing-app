import { act, renderHook } from "@testing-library/react"
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"
import { setupServer } from "msw/node"

import {
  getGetLessonMockHandler200,
  getSaveLearnerStepDraftMockHandler,
  getSaveLearnerStepDraftMockHandler200,
  getSaveLearnerStepDraftMockHandler409,
} from "@workspace/http-client/learner/msw"
import {
  createApiErrorFixture,
  throwMswNetworkErrorFixture,
} from "@workspace/http-client/msw-fixtures"

import {
  parseLessonStepDrafts,
  type LessonStepDraftAnswer,
} from "@/features/lesson-session/model/lesson-view-model"
import { useLessonDraftSync } from "@/features/lesson-session/hooks/use-lesson-draft-sync"
import type {
  LearnerLessonDto,
  LearnerSaveStepDraftBodyDto,
  LearnerStepDraftDto,
} from "@/shared/http/learner-api-client"
import { createLearnerLessonWireFixture } from "@/test/learner-api-fixtures"

const initialAnswer = {
  selectedOptionId: "option-1",
  type: "MULTIPLE_CHOICE",
} as LessonStepDraftAnswer
const localAnswer = {
  selectedOptionId: "option-2",
  type: "MULTIPLE_CHOICE",
} as LessonStepDraftAnswer
const latestAnswer = {
  selectedOptionId: "option-1",
  type: "MULTIPLE_CHOICE",
} as LessonStepDraftAnswer
const server = setupServer()
const nativeRequest = globalThis.Request

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
})

beforeEach(() => {
  vi.useFakeTimers()
  setOnline(true)
  setVisibility("visible")
  vi.stubGlobal(
    "Request",
    class BrowserRequest extends nativeRequest {
      constructor(input: RequestInfo | URL, init?: RequestInit) {
        super(resolveBrowserRequestInput(input), init)
      }
    }
  )
})

afterEach(() => {
  server.resetHandlers()
  vi.useRealTimers()
})

afterAll(() => {
  server.close()
})

describe("useLessonDraftSync", () => {
  it("저장 중 후속 입력은 반환된 version으로 직렬 저장한다", async () => {
    const firstSave = createDeferred<LearnerStepDraftDto>()
    const firstRequestStarted = createDeferred<void>()
    const secondRequestStarted = createDeferred<void>()
    const requests: LearnerSaveStepDraftBodyDto[] = []
    server.use(
      getSaveLearnerStepDraftMockHandler200(async ({ request }) => {
        const body = await readJson<LearnerSaveStepDraftBodyDto>(request)
        requests.push(body)
        if (requests.length === 1) {
          firstRequestStarted.resolve()
          return firstSave.promise
        }
        secondRequestStarted.resolve()
        return createDraft(body.answer as LessonStepDraftAnswer, 3)
      })
    )
    const { result } = renderDraftSync()

    act(() => {
      result.current.stageDraft("step-mc", localAnswer)
      vi.advanceTimersByTime(800)
    })
    await firstRequestStarted.promise

    act(() => {
      result.current.stageDraft("step-mc", latestAnswer)
    })

    expect(requests).toHaveLength(1)

    await act(async () => {
      firstSave.resolve(createDraft(localAnswer, 2))
      await secondRequestStarted.promise
    })

    expect(requests[1]).toMatchObject({
      answer: latestAnswer,
      expectedVersion: 2,
    })
  })

  it("409이면 최신 draft를 조회하고 로컬 입력을 최신 version으로 다시 보낸다", async () => {
    const serverDraft = createDraft(latestAnswer, 3)
    const retryRequests: LearnerSaveStepDraftBodyDto[] = []
    server.use(
      getSaveLearnerStepDraftMockHandler409(createConflictError(), {
        once: true,
      }),
      getSaveLearnerStepDraftMockHandler200(async ({ request }) => {
        const body = await readJson<LearnerSaveStepDraftBodyDto>(request)
        retryRequests.push(body)
        return createDraft(body.answer as LessonStepDraftAnswer, 4)
      }),
      getGetLessonMockHandler200(createLesson([serverDraft]))
    )
    const { result } = renderDraftSync([createDraft(initialAnswer, 2)])

    act(() => {
      result.current.stageDraft("step-mc", localAnswer)
    })
    await act(async () => {
      await result.current.flushStepDraft("step-mc")
    })

    expect(retryRequests).toEqual([
      expect.objectContaining({
        answer: localAnswer,
        expectedVersion: 3,
      }),
    ])
  })

  it("반복 저장 실패는 blocked를 반환하고 같은 로컬 입력을 보존한다", async () => {
    const requests: LearnerSaveStepDraftBodyDto[] = []
    server.use(
      getSaveLearnerStepDraftMockHandler(async ({ request }) => {
        requests.push(await readJson<LearnerSaveStepDraftBodyDto>(request))
        return throwMswNetworkErrorFixture()
      })
    )
    const { result } = renderDraftSync()

    act(() => {
      result.current.stageDraft("step-mc", localAnswer)
    })

    await expect(result.current.flushAll()).resolves.toEqual({
      status: "blocked",
    })
    await expect(result.current.flushAll()).resolves.toEqual({
      status: "blocked",
    })

    expect(requests).toHaveLength(2)
    expect(requests.map((request) => request.answer)).toEqual([
      localAnswer,
      localAnswer,
    ])
  })

  it("명시적 flush는 debounce를 기다리지 않고 즉시 저장한다", async () => {
    const requests: LearnerSaveStepDraftBodyDto[] = []
    server.use(
      getSaveLearnerStepDraftMockHandler200(async ({ request }) => {
        const body = await readJson<LearnerSaveStepDraftBodyDto>(request)
        requests.push(body)
        return createDraft(body.answer as LessonStepDraftAnswer, 2)
      })
    )
    const { result } = renderDraftSync()

    act(() => {
      result.current.stageDraft("step-mc", localAnswer)
    })
    await act(async () => {
      await result.current.flushStepDraft("step-mc")
    })

    expect(requests).toEqual([
      expect.objectContaining({ answer: localAnswer, expectedVersion: 1 }),
    ])
  })
})

function renderDraftSync(
  initialDrafts: readonly LearnerStepDraftDto[] = [
    createDraft(initialAnswer, 1),
  ]
) {
  const lesson = createLesson(initialDrafts)
  return renderHook(() =>
    useLessonDraftSync({
      expectedCurriculumVersionId: lesson.version.curriculumVersionId,
      initialDrafts: parseLessonStepDrafts(initialDrafts),
      lessonId: lesson.id,
      onServerDraftApplied: vi.fn(),
    })
  )
}

function createLesson(
  drafts: readonly LearnerStepDraftDto[]
): LearnerLessonDto {
  return createLearnerLessonWireFixture({
    drafts: [...drafts],
    id: "lesson-1",
    learning: {
      completedSteps: 0,
      currentStepId: "step-mc",
      currentStepIndex: 0,
      progressPercent: 0,
      status: "in_progress",
      totalSteps: 1,
      version: {
        curriculumVersionId: "fixture-curriculum-v1",
        revision: 1,
      },
    },
    steps: [
      {
        id: "step-mc",
        options: [
          { id: "option-1", text: "선택 1" },
          { id: "option-2", text: "선택 2" },
        ],
        question: "질문",
        sortOrder: 1,
        type: "MULTIPLE_CHOICE",
      },
    ],
  })
}

function createDraft(
  answer: LessonStepDraftAnswer,
  version: number
): LearnerStepDraftDto {
  return {
    answer,
    stepId: "step-mc",
    updatedAt: `2026-07-24T00:00:0${version}.000Z`,
    version,
  }
}

function createConflictError() {
  const error = createApiErrorFixture(409, {
    code: "STEP_DRAFT_VERSION_CONFLICT",
    message: "초안 버전이 충돌했습니다.",
  })
  return {
    code: error.code,
    message: error.message,
    requestId: error.requestId,
  }
}

async function readJson<TValue>(request: Request): Promise<TValue> {
  return (await request.clone().json()) as TValue
}

function createDeferred<TValue>() {
  let resolve: (value: TValue) => void = () => undefined
  const promise = new Promise<TValue>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

function resolveBrowserRequestInput(
  input: RequestInfo | URL
): RequestInfo | URL {
  return typeof input === "string" && input.startsWith("/")
    ? new URL(input, "http://localhost")
    : input
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
