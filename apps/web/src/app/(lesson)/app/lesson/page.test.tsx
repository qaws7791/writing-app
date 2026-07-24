import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

const { generatedClient, redirectMock, requestOptions, serverOptionsMock } =
  vi.hoisted(() => ({
    generatedClient: {
      getCourseDetail: vi.fn(),
      getLesson: vi.fn(),
      getProfile: vi.fn(),
      getProgress: vi.fn(),
    },
    redirectMock: vi.fn((path: string) => {
      throw new Error(`redirect:${path}`)
    }),
    requestOptions: { cache: "no-store" } as const,
    serverOptionsMock: vi.fn(),
  }))

vi.mock("@workspace/http-client/learner", () => generatedClient)
vi.mock("@/server/http/learner-api-client", () => ({
  getServerLearnerRequestOptions: serverOptionsMock,
}))
vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

import LessonRoute from "@/app/(lesson)/app/lesson/page"
import type { LearnerLessonDto } from "@/shared/http/learner-api-client"

describe("레슨 route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serverOptionsMock.mockResolvedValue(requestOptions)
  })

  it("lesson_id가 없어도 인증되지 않은 요청을 먼저 로그인으로 보낸다", async () => {
    serverOptionsMock.mockResolvedValueOnce(null)

    await expect(
      LessonRoute({ searchParams: Promise.resolve({}) })
    ).rejects.toBeInstanceOf(Error)

    expect(redirectMock).toHaveBeenCalledWith("/login?next=%2Fapp%2Flesson")
  })

  it("레슨 조회 실패를 fallback 콘텐츠로 숨기지 않는다", async () => {
    generatedClient.getLesson.mockRejectedValue(networkError())

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

  it("레슨 상태만 조회하고 중복 progress, profile, course detail 조회를 만들지 않는다", async () => {
    const lesson = createDeferred<LearnerLessonDto>()
    generatedClient.getLesson.mockReturnValueOnce(lesson.promise)

    const routePromise = LessonRoute({
      searchParams: Promise.resolve({ lesson_id: "l1" }),
    })
    await Promise.resolve()
    await Promise.resolve()

    expect(generatedClient.getLesson).toHaveBeenCalledWith("l1", requestOptions)
    expect(generatedClient.getProfile).not.toHaveBeenCalled()
    expect(generatedClient.getProgress).not.toHaveBeenCalled()
    expect(generatedClient.getCourseDetail).not.toHaveBeenCalled()

    lesson.reject(networkError())
    await routePromise

    expect(generatedClient.getCourseDetail).not.toHaveBeenCalled()
  })
})

function createDeferred<T>() {
  let reject: (reason: unknown) => void = () => undefined
  const promise = new Promise<T>((_resolve, promiseReject) => {
    reject = promiseReject
  })
  return { promise, reject }
}

function networkError(): GeneratedApiClientError {
  return new GeneratedApiClientError({
    kind: "network",
    method: "GET",
    url: "/api/lessons/l1",
  })
}
