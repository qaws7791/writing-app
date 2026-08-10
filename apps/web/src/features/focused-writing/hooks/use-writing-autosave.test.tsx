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
  getGetWritingMockHandler200,
  getSaveWritingMockHandler,
  getSaveWritingMockHandler200,
  getSaveWritingMockHandler409,
} from "@workspace/http-client/learner/msw"
import {
  createApiErrorFixture,
  throwMswNetworkErrorFixture,
} from "@workspace/http-client/msw-fixtures"

import { useWritingAutosave } from "@/features/focused-writing/hooks/use-writing-autosave"
import type {
  LearnerSaveWritingBodyDto,
  LearnerWritingDetailDto,
} from "@/shared/http/learner-api-client"

const localDraft = { body: "로컬 본문", title: "로컬 제목" } as const
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
          title: body.title,
          version: 3,
        })
      })
    )
    const { result } = renderWritingAutosave()

    act(() => {
      result.current.stageWriting({ body: "첫 수정", title: "로컬 제목" })
      vi.advanceTimersByTime(800)
    })
    await firstRequestStarted.promise

    act(() => {
      result.current.stageWriting({
        body: "두 번째 수정",
        title: "로컬 제목",
      })
    })

    expect(requests).toHaveLength(1)

    await act(async () => {
      firstSave.resolve(
        createWriting({ body: "첫 수정", title: "로컬 제목", version: 2 })
      )
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
      title: "다른 화면의 제목",
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
      title: "다른 화면의 제목",
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
          title: body.title,
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
      title: "다른 화면의 제목",
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
          title: body.title,
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
})

function renderWritingAutosave(
  initialWriting = createWriting(),
  onServerWritingApplied = vi.fn()
) {
  return renderHook(() =>
    useWritingAutosave({ initialWriting, onServerWritingApplied })
  )
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
    body: "서버 본문",
    checkedAt: null,
    createdAt: "2026-08-08T00:00:00.000Z",
    id: "writing-1",
    mode: "free",
    selfCheckStartedAt: null,
    status: "drafting",
    title: "서버 제목",
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
