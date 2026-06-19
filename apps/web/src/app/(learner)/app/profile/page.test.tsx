import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import ProfileRoute from "@/app/(learner)/app/profile/page"
import type { ApiError } from "@/lib/api/api-error"
import { apiFailure } from "@/lib/api/api-result"
import type { WritingAppApi } from "@/lib/api/writing-app-api-port"

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
}))

const api: WritingAppApi = {
  completeLesson: vi.fn(),
  createAiFeedback: vi.fn(),
  getCourseDetail: vi.fn(),
  getLesson: vi.fn(),
  getProfile: vi.fn(),
  getProgress: vi.fn(),
  listCourses: vi.fn(),
  saveLessonAnswer: vi.fn(),
}

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("@/lib/auth/server-session-token", () => ({
  getServerLearnerSessionToken: vi.fn(async () => "learner-token"),
}))

vi.mock("@/lib/api/get-server-writing-app-api", () => ({
  getServerWritingAppApi: vi.fn(() => api),
}))

describe("프로필 route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("API 인증 실패만 로그인으로 보낸다", async () => {
    vi.mocked(api.getProfile).mockResolvedValue(
      apiFailure(authenticationError())
    )

    await expect(ProfileRoute()).rejects.toBeInstanceOf(Error)
    expect(redirectMock).toHaveBeenCalledWith("/login?next=%2Fapp%2Fprofile")
  })

  it("프로필 서비스 장애는 로그인으로 보내지 않고 notice로 보여준다", async () => {
    vi.mocked(api.getProfile).mockResolvedValue(apiFailure(serviceError()))

    render(await ProfileRoute())

    expect(redirectMock).not.toHaveBeenCalled()
    expect(
      screen.getByRole("heading", { name: "프로필을 불러올 수 없습니다." })
    ).toBeInTheDocument()
    expect(
      screen.getByText("프로필 서비스를 잠시 사용할 수 없습니다.")
    ).toBeInTheDocument()
  })
})

function authenticationError(): ApiError {
  return {
    code: "unauthorized",
    message: "로그인이 필요합니다.",
    status: 401,
  }
}

function serviceError(): ApiError {
  return {
    code: "provider-unavailable",
    message: "프로필 서비스를 잠시 사용할 수 없습니다.",
    status: 503,
  }
}
