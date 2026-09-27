import { act, cleanup, renderHook } from "@testing-library/react"
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
  getGetWritingMockHandler200,
  getSaveWritingMockHandler,
  getSaveWritingMockHandler200,
  getSaveWritingMockHandler409,
} from "@workspace/http-client/learner/msw"
import {
  createApiErrorFixture,
  throwMswNetworkErrorFixture,
} from "@workspace/http-client/msw-fixtures"

import {
  createMemoryWritingDraftStore,
  hashWritingDraftBody,
} from "@/features/writing/api/writing-device-draft"
import {
  useWritingAutosave,
  writingAutosaveIdleDelayMs,
  writingAutosaveMaxWaitMs,
} from "@/features/writing/hooks/use-writing-autosave"
import type {
  LearnerSaveWritingBodyDto,
  LearnerWritingDetailDto,
} from "@/shared/http/learner-api-client"

const localDraft = { body: "로컬 본문" } as const
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
  server.use(
    getSaveWritingMockHandler200(async ({ request }) => {
      const body = await readJson<LearnerSaveWritingBodyDto>(request)
      return createWriting({
        body: body.body,
        version: body.expectedVersion + 1,
      })
    })
  )
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  vi.useRealTimers()
})

afterAll(() => {
  server.close()
})

describe("useWritingAutosave", () => {
  it("저장 중 후속 입력은 반환된 version으로 직렬 저장한다", async () => {
    const firstSave = createDeferred<LearnerWritingDetailDto>()
    const firstRequestStarted = createDeferred<void>()
    const requests: LearnerSaveWritingBodyDto[] = []
    server.use(
      getSaveWritingMockHandler200(async ({ request }) => {
        const body = await readJson<LearnerSaveWritingBodyDto>(request)
        requests.push(body)
        if (requests.length === 1) {
          firstRequestStarted.resolve()
          return firstSave.promise
        }
        return createWriting({
          body: body.body,
          version: 3,
        })
      })
    )
    const { result } = renderWritingAutosave()

    act(() => {
      result.current.stageWriting({ body: "첫 수정" })
      vi.advanceTimersByTime(writingAutosaveIdleDelayMs)
    })
    await firstRequestStarted.promise

    act(() => {
      result.current.stageWriting({
        body: "두 번째 수정",
      })
    })

    expect(requests).toHaveLength(1)

    await act(async () => {
      firstSave.resolve(createWriting({ body: "첫 수정", version: 2 }))
      await result.current.flushWriting()
    })

    expect(requests[1]).toMatchObject({
      body: "두 번째 수정",
      expectedVersion: 2,
    })
    expect(result.current.status).toMatchObject({ kind: "saved" })
  })

  it("409은 로컬 입력과 최신 server 글을 함께 보존한다", async () => {
    const latestWriting = createWriting({
      body: "다른 화면의 본문",
      version: 3,
    })
    server.use(
      getSaveWritingMockHandler409(createConflictError(), { once: true }),
      getGetWritingMockHandler200(latestWriting)
    )
    const { result } = renderWritingAutosave()

    await createWritingConflict(result)

    expect(result.current.status).toEqual({
      kind: "conflict",
      localDraft,
      serverWriting: latestWriting,
    })
  })

  it("로컬 재시도는 최신 server version으로 로컬 입력을 저장한다", async () => {
    const latestWriting = createWriting({
      body: "다른 화면의 본문",
      version: 3,
    })
    const retryRequests: LearnerSaveWritingBodyDto[] = []
    server.use(
      getSaveWritingMockHandler409(createConflictError(), { once: true }),
      getSaveWritingMockHandler200(async ({ request }) => {
        const body = await readJson<LearnerSaveWritingBodyDto>(request)
        retryRequests.push(body)
        return createWriting({
          body: body.body,
          version: 4,
        })
      }),
      getGetWritingMockHandler200(latestWriting)
    )
    const { result } = renderWritingAutosave()
    await createWritingConflict(result)

    act(() => {
      result.current.retryLocalWriting()
    })
    await act(async () => {
      await result.current.flushWriting()
    })

    expect(retryRequests).toEqual([
      expect.objectContaining({
        ...localDraft,
        expectedVersion: 3,
      }),
    ])
  })

  it("server 선택은 server 글을 적용하고 로컬 dirty 상태를 해제한다", async () => {
    const latestWriting = createWriting({
      body: "다른 화면의 본문",
      version: 3,
    })
    const onServerWritingApplied = vi.fn()
    server.use(
      getSaveWritingMockHandler409(createConflictError(), { once: true }),
      getGetWritingMockHandler200(latestWriting)
    )
    const { result } = renderWritingAutosave(
      createWriting(),
      onServerWritingApplied
    )
    await createWritingConflict(result)

    act(() => {
      result.current.useServerWriting()
    })

    expect(onServerWritingApplied).toHaveBeenCalledWith(latestWriting)
    expect(result.current.dirty).toBe(false)
    expect(result.current.status).toEqual({
      kind: "saved",
      updatedAt: latestWriting.updatedAt,
    })
  })

  it("네트워크 복구는 보존한 로컬 입력을 다시 저장한다", async () => {
    const recoveredRequests: LearnerSaveWritingBodyDto[] = []
    server.use(
      getSaveWritingMockHandler(() => throwMswNetworkErrorFixture(), {
        once: true,
      }),
      getSaveWritingMockHandler200(async ({ request }) => {
        const body = await readJson<LearnerSaveWritingBodyDto>(request)
        recoveredRequests.push(body)
        return createWriting({
          body: body.body,
          version: 2,
        })
      }),
      getGetWritingMockHandler200(createWriting())
    )
    const { result } = renderWritingAutosave()

    act(() => {
      result.current.stageWriting(localDraft)
    })
    await act(async () => {
      await result.current.flushWriting()
    })

    expect(result.current.status).toEqual({ kind: "offline" })

    await act(async () => {
      window.dispatchEvent(new Event("online"))
      await result.current.reconcile()
    })

    expect(recoveredRequests).toEqual([expect.objectContaining(localDraft)])
    expect(result.current.status).toMatchObject({ kind: "saved" })
  })

  it("계속 입력해도 maxWait 안에 서버 저장을 보낸다", async () => {
    const requests: LearnerSaveWritingBodyDto[] = []
    const firstRequestStarted = createDeferred<void>()
    server.use(
      getSaveWritingMockHandler200(async ({ request }) => {
        const body = await readJson<LearnerSaveWritingBodyDto>(request)
        requests.push(body)
        if (requests.length === 1) firstRequestStarted.resolve()
        return createWriting({
          body: body.body,
          version: body.expectedVersion + 1,
        })
      })
    )
    const { result } = renderWritingAutosave()

    act(() => {
      result.current.stageWriting({ body: "연속 0" })
    })
    for (let index = 1; index <= 12; index += 1) {
      act(() => {
        vi.advanceTimersByTime(400)
        result.current.stageWriting({ body: `연속 ${index}` })
      })
    }
    act(() => {
      vi.advanceTimersByTime(writingAutosaveMaxWaitMs - 400 * 12)
    })
    await firstRequestStarted.promise

    expect(requests[0]).toMatchObject({
      body: "연속 12",
      expectedVersion: 1,
    })
  })

  it("unmount는 idle debounce 전에 마지막 본문을 저장한다", async () => {
    const requests: LearnerSaveWritingBodyDto[] = []
    const requestStarted = createDeferred<void>()
    server.use(
      getSaveWritingMockHandler200(async ({ request }) => {
        const body = await readJson<LearnerSaveWritingBodyDto>(request)
        requests.push(body)
        requestStarted.resolve()
        return createWriting({
          body: body.body,
          version: 2,
        })
      })
    )
    const { result, unmount } = renderWritingAutosave()

    act(() => {
      result.current.stageWriting({ body: "이탈 직전" })
    })
    unmount()
    await requestStarted.promise

    expect(requests).toEqual([
      expect.objectContaining({
        body: "이탈 직전",
        expectedVersion: 1,
      }),
    ])
  })

  it("같은 version의 기기 초안을 복구하고 서버에 저장한다", async () => {
    const recoveredBody = "기기 본문"
    const store = createMemoryWritingDraftStore([
      {
        baseVersion: 1,
        body: recoveredBody,
        checksum: await hashWritingDraftBody(recoveredBody),
        learnerId: "learner-1",
        savedAt: 1,
        writingId: "writing-1",
      },
    ])
    const requests: LearnerSaveWritingBodyDto[] = []
    const onRecoveredWriting = vi.fn()
    server.use(
      getSaveWritingMockHandler200(async ({ request }) => {
        const body = await readJson<LearnerSaveWritingBodyDto>(request)
        requests.push(body)
        return createWriting({
          body: body.body,
          version: 2,
        })
      })
    )
    const { result } = renderWritingAutosave(createWriting(), vi.fn(), {
      learnerId: "learner-1",
      onRecoveredWriting,
      store,
    })

    await waitUntilReady(result)

    expect(onRecoveredWriting).toHaveBeenCalledWith(
      expect.objectContaining({ body: recoveredBody })
    )
    expect(result.current.recovered).toBe(true)
    await act(async () => {
      await result.current.flushWriting()
    })
    expect(requests).toEqual([
      expect.objectContaining({
        body: recoveredBody,
        expectedVersion: 1,
      }),
    ])
    expect(await store.get("learner-1", "writing-1")).toBeNull()
  })

  it("checksum이 불량인 기기 초안은 버리고 서버 본문을 유지한다", async () => {
    const store = createMemoryWritingDraftStore([
      {
        baseVersion: 1,
        body: "손상된 본문",
        checksum: "not-a-checksum",
        learnerId: "learner-1",
        savedAt: 1,
        writingId: "writing-1",
      },
    ])
    const onRecoveredWriting = vi.fn()
    const { result } = renderWritingAutosave(createWriting(), vi.fn(), {
      learnerId: "learner-1",
      onRecoveredWriting,
      store,
    })

    await waitUntilReady(result)

    expect(onRecoveredWriting).not.toHaveBeenCalled()
    expect(result.current.recovered).toBe(false)
    expect(await store.get("learner-1", "writing-1")).toBeNull()
  })

  it("서버 version이 앞선 기기 초안은 충돌로 연다", async () => {
    const localBody = "이 화면의 본문"
    const serverWriting = createWriting({
      body: "다른 화면의 본문",
      version: 2,
    })
    const store = createMemoryWritingDraftStore([
      {
        baseVersion: 1,
        body: localBody,
        checksum: await hashWritingDraftBody(localBody),
        learnerId: "learner-1",
        savedAt: 1,
        writingId: "writing-1",
      },
    ])
    const { result } = renderWritingAutosave(serverWriting, vi.fn(), {
      learnerId: "learner-1",
      store,
    })

    await waitUntilReady(result)

    expect(result.current.status).toEqual({
      kind: "conflict",
      localDraft: { body: localBody },
      serverWriting,
    })
  })

  it("기기 커밋 뒤에는 서버 dirty여도 나가기 경고를 열지 않는다", async () => {
    const store = createMemoryWritingDraftStore()
    const { result } = renderWritingAutosave(createWriting(), vi.fn(), {
      learnerId: "learner-1",
      store,
    })

    await waitUntilReady(result)
    act(() => {
      result.current.stageWriting({ body: "기기에만 남은 본문" })
    })
    await act(async () => {
      await result.current.commitDeviceDraft()
    })

    expect(result.current.dirty).toBe(true)
    expect(result.current.hasUnsavedChanges()).toBe(false)
  })
})

function renderWritingAutosave(
  initialWriting = createWriting(),
  onServerWritingApplied = vi.fn(),
  options?: {
    readonly learnerId: string
    readonly onRecoveredWriting?: (writing: LearnerWritingDetailDto) => void
    readonly store: ReturnType<typeof createMemoryWritingDraftStore>
  }
) {
  return renderHook(() =>
    options === undefined
      ? useWritingAutosave({ initialWriting, onServerWritingApplied })
      : useWritingAutosave({
          initialWriting,
          learnerId: options.learnerId,
          onServerWritingApplied,
          store: options.store,
          ...(options.onRecoveredWriting === undefined
            ? {}
            : { onRecoveredWriting: options.onRecoveredWriting }),
        })
  )
}

async function waitUntilReady(
  result: ReturnType<typeof renderWritingAutosave>["result"]
): Promise<void> {
  await vi.waitFor(async () => {
    await act(async () => {})
    expect(result.current.ready).toBe(true)
  })
}

async function createWritingConflict(
  result: ReturnType<typeof renderWritingAutosave>["result"]
): Promise<void> {
  act(() => {
    result.current.stageWriting(localDraft)
  })
  await act(async () => {
    await result.current.flushWriting()
  })
}

function createWriting(
  overrides: Partial<LearnerWritingDetailDto> = {}
): LearnerWritingDetailDto {
  return {
    aiNoticeAcknowledged: false,
    body: "서버 본문",
    brief: {
      audience: "친구",
      difficulty: "입문",
      domain: "일상·실용문",
      goalChars: 120,
      minChars: 40,
      publicationId: "pub-1",
      requiredElements: ["초대 이유"],
      situation: "주말에 가까운 사람을 공원 소풍에 초대합니다.",
      taskId: "task-1",
      title: "주말 소풍 초대 메시지",
      typeName: "초대장",
    },
    check: null,
    createdAt: "2026-08-08T00:00:00.000Z",
    dailyChecksRemaining: 5,
    id: "writing-1",
    updatedAt: `2026-08-08T00:00:0${overrides.version ?? 1}.000Z`,
    version: 1,
    ...overrides,
  }
}

function createConflictError() {
  const error = createApiErrorFixture(409, {
    code: "WRITING_VERSION_CONFLICT",
    message: "글 version이 충돌했습니다.",
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
