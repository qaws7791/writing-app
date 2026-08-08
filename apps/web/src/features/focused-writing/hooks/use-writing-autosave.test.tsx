import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

const generatedClient = vi.hoisted(() => ({
  getWriting: vi.fn(),
  saveWriting: vi.fn(),
}))

vi.mock("@workspace/http-client/learner", () => generatedClient)

import { useWritingAutosave } from "@/features/focused-writing/hooks/use-writing-autosave"
import type {
  LearnerSaveWritingBodyDto,
  LearnerWritingDetailDto,
} from "@/shared/http/learner-api-client"

describe("useWritingAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setOnline(true)
    setVisibility("visible")
    generatedClient.getWriting.mockReset()
    generatedClient.getWriting.mockResolvedValue(createWriting())
    generatedClient.saveWriting.mockReset()
    generatedClient.saveWriting.mockImplementation(
      async (_writingId: string, request: LearnerSaveWritingBodyDto) =>
        createWriting({
          body: request.body,
          title: request.title,
          version: request.expectedVersion + 1,
        })
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    { advanceMs: 799, expectedCalls: 0 },
    { advanceMs: 800, expectedCalls: 1 },
  ])(
    "$advanceMs ms 입력 정지 뒤 저장 호출 수가 $expectedCalls이다",
    ({ advanceMs, expectedCalls }) => {
      const { result } = renderWritingAutosave()

      act(() => {
        result.current.stageWriting({ body: "로컬 본문", title: "로컬 제목" })
        vi.advanceTimersByTime(advanceMs)
      })

      expect(generatedClient.saveWriting).toHaveBeenCalledTimes(expectedCalls)
    }
  )

  it("저장 진행 중 입력을 최신 version의 후속 저장으로 직렬화한다", async () => {
    const firstSave = createDeferred<LearnerWritingDetailDto>()
    generatedClient.saveWriting.mockReturnValueOnce(firstSave.promise)
    const { result } = renderWritingAutosave()

    act(() => {
      result.current.stageWriting({ body: "첫 수정", title: "로컬 제목" })
      vi.advanceTimersByTime(800)
      result.current.stageWriting({ body: "두 번째 수정", title: "로컬 제목" })
    })

    expect(generatedClient.saveWriting).toHaveBeenCalledTimes(1)

    await act(async () => {
      firstSave.resolve(
        createWriting({ body: "첫 수정", title: "로컬 제목", version: 2 })
      )
      await vi.waitFor(() => {
        expect(generatedClient.saveWriting).toHaveBeenCalledTimes(2)
      })
    })

    expect(generatedClient.saveWriting).toHaveBeenLastCalledWith(
      "writing-1",
      expect.objectContaining({
        body: "두 번째 수정",
        expectedVersion: 2,
      }),
      { signal: expect.any(AbortSignal) }
    )
    expect(result.current.status).toMatchObject({ kind: "saved" })
  })

  it("화면 숨김에서 대기 중인 글을 keepalive 요청으로 저장한다", async () => {
    const { result } = renderWritingAutosave()

    await act(async () => {
      result.current.stageWriting({ body: "로컬 본문", title: "로컬 제목" })
      setVisibility("hidden")
      document.dispatchEvent(new Event("visibilitychange"))
      await vi.waitFor(() => {
        expect(generatedClient.saveWriting).toHaveBeenCalledOnce()
      })
    })

    expect(generatedClient.saveWriting).toHaveBeenCalledWith(
      "writing-1",
      expect.objectContaining({ body: "로컬 본문" }),
      { keepalive: true }
    )
  })

  it("진행 중 저장 뒤 남은 입력은 화면 숨김 요청을 keepalive로 승격한다", async () => {
    const firstSave = createDeferred<LearnerWritingDetailDto>()
    generatedClient.saveWriting.mockReturnValueOnce(firstSave.promise)
    const { result } = renderWritingAutosave()

    act(() => {
      result.current.stageWriting({ body: "첫 수정", title: "로컬 제목" })
      vi.advanceTimersByTime(800)
      result.current.stageWriting({
        body: "닫기 직전 수정",
        title: "로컬 제목",
      })
      setVisibility("hidden")
      document.dispatchEvent(new Event("visibilitychange"))
    })

    await act(async () => {
      firstSave.resolve(
        createWriting({ body: "첫 수정", title: "로컬 제목", version: 2 })
      )
      await vi.waitFor(() => {
        expect(generatedClient.saveWriting).toHaveBeenCalledTimes(2)
      })
    })

    expect(generatedClient.saveWriting).toHaveBeenLastCalledWith(
      "writing-1",
      expect.objectContaining({ body: "닫기 직전 수정", expectedVersion: 2 }),
      { keepalive: true }
    )
  })

  it("409에서 로컬 입력과 서버 글을 함께 보존하고 최신 version으로 재시도한다", async () => {
    const latestWriting = createWriting({
      body: "다른 화면의 본문",
      title: "다른 화면의 제목",
      version: 3,
    })
    generatedClient.getWriting.mockResolvedValue(latestWriting)
    generatedClient.saveWriting
      .mockRejectedValueOnce(
        httpError("WRITING_VERSION_CONFLICT", 409, "글 version 충돌")
      )
      .mockResolvedValueOnce(
        createWriting({ body: "로컬 본문", title: "로컬 제목", version: 4 })
      )
    const { result } = renderWritingAutosave()

    act(() => {
      result.current.stageWriting({ body: "로컬 본문", title: "로컬 제목" })
    })
    await act(async () => {
      await result.current.flushWriting()
    })

    expect(result.current.status).toEqual({
      kind: "conflict",
      localDraft: { body: "로컬 본문", title: "로컬 제목" },
      serverWriting: latestWriting,
    })

    await act(async () => {
      result.current.retryLocalWriting()
      await vi.waitFor(() => {
        expect(generatedClient.saveWriting).toHaveBeenCalledTimes(2)
      })
    })

    expect(generatedClient.saveWriting).toHaveBeenLastCalledWith(
      "writing-1",
      expect.objectContaining({
        body: "로컬 본문",
        expectedVersion: 3,
      }),
      { signal: expect.any(AbortSignal) }
    )
  })

  it("네트워크 실패 뒤 online event에서 보존한 입력을 다시 저장한다", async () => {
    generatedClient.saveWriting
      .mockRejectedValueOnce(
        new GeneratedApiClientError({
          kind: "network",
          method: "PUT",
          url: "/api/writings/writing-1",
        })
      )
      .mockResolvedValueOnce(
        createWriting({ body: "로컬 본문", title: "로컬 제목", version: 2 })
      )
    const { result } = renderWritingAutosave()

    act(() => {
      result.current.stageWriting({ body: "로컬 본문", title: "로컬 제목" })
    })
    await act(async () => {
      await result.current.flushWriting()
    })
    expect(result.current.status).toEqual({ kind: "offline" })

    await act(async () => {
      window.dispatchEvent(new Event("online"))
      await vi.waitFor(() => {
        expect(generatedClient.saveWriting).toHaveBeenCalledTimes(2)
      })
    })

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
