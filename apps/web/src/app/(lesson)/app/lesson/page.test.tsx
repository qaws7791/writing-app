import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import LessonRoute from "@/app/(lesson)/app/lesson/page"
import { networkApiError } from "@/shared/http/api-error"
import { httpApiFailure as apiFailure } from "@workspace/http-client"
import type { WritingAppApi } from "@/shared/http/writing-app-api-port"
import { createHttpNetworkError } from "@workspace/http-client"

const api: WritingAppApi = {
  completeStep: vi.fn(),
  getCourseDetail: vi.fn(),
  getCourseCategories: vi.fn(),
  getLesson: vi.fn(),
  getProfile: vi.fn(),
  getProgress: vi.fn(),
  listCourses: vi.fn(),
  requestAiFeedback: vi.fn(),
  startLesson: vi.fn(),
}

const { redirectMock, sessionTokenMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
  sessionTokenMock: vi.fn(async (): Promise<null | string> => "learner-token"),
}))

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("@/server/auth/server-session-token", () => ({
  getServerLearnerSessionToken: sessionTokenMock,
}))

vi.mock("@/server/http/get-server-writing-app-api", () => ({
  getServerWritingAppApi: vi.fn(() => api),
}))

describe("레슨 route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionTokenMock.mockResolvedValue("learner-token")
  })

  it("lesson_id가 없어도 인증되지 않은 요청을 먼저 로그인으로 보낸다", async () => {
    sessionTokenMock.mockResolvedValueOnce(null)

    await expect(
      LessonRoute({ searchParams: Promise.resolve({}) })
    ).rejects.toBeInstanceOf(Error)

    expect(redirectMock).toHaveBeenCalledWith("/login?next=%2Fapp%2Flesson")
  })

  it("레슨 조회 실패를 fallback 콘텐츠로 숨기지 않는다", async () => {
    vi.mocked(api.getLesson).mockResolvedValue(apiFailure(networkError()))

    render(
      await LessonRoute({
        searchParams: Promise.resolve({ lesson_id: "l1" }),
      })
    )

    expect(
      screen.getByRole("heading", { name: "레슨을 열 수 없습니다." })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "좋은 문장이란 무엇인가" })
    ).not.toBeInTheDocument()
  })

  it("레슨과 프로필만 병렬 조회하고 progress와 course detail은 조회하지 않는다", async () => {
    const lesson =
      createDeferred<Awaited<ReturnType<WritingAppApi["getLesson"]>>>()
    vi.mocked(api.getLesson).mockReturnValueOnce(lesson.promise)

    const routePromise = LessonRoute({
      searchParams: Promise.resolve({ lesson_id: "l1" }),
    })
    await Promise.resolve()
    await Promise.resolve()

    expect(api.getLesson).toHaveBeenCalledWith("l1")
    expect(api.getProfile).toHaveBeenCalledOnce()
    expect(api.getProgress).not.toHaveBeenCalled()
    expect(api.getCourseDetail).not.toHaveBeenCalled()

    lesson.resolve(apiFailure(networkError()))
    await routePromise

    expect(api.getCourseDetail).not.toHaveBeenCalled()
  })
})

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })

  return { promise, resolve }
}

function networkError() {
  return networkApiError(
    createHttpNetworkError(
      new Request("https://api.example.test/test"),
      new TypeError("test network failure")
    )
  )
}
