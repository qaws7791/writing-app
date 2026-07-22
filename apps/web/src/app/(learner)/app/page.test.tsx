import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import AppHomeRoute from "@/app/(learner)/app/page"
import { learnerProgressPageSchema } from "@workspace/contracts/learning/learner-content"
import type { LearnerProfileResponse } from "@workspace/contracts/learning/learner-api"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import type { ApiError } from "@/shared/http/api-error"
import {
  httpApiFailure as apiFailure,
  httpApiOk as apiOk,
} from "@workspace/http-client/api-result"
import type { WritingAppApi } from "@/shared/http/writing-app-api-port"

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
}))

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

const profile: LearnerProfileResponse = {
  stats: {
    completedLessons: 0,
    currentStreakDays: 0,
    lastActiveDate: null,
    progressPercent: 0,
    totalLessons: 0,
  },
  user: {
    email: "minji@example.com",
    id: userIdSchema.parse("user-1"),
    image: null,
    joinedAt: "2026-06-01T00:00:00.000Z",
    name: "민지",
    status: "active",
  },
}

const emptyProgress = learnerProgressPageSchema.parse({
  items: [],
  nextCursor: null,
})

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock("@/server/auth/server-session-token", () => ({
  getServerLearnerSessionToken: vi.fn(async () => "learner-token"),
}))

vi.mock("@/server/http/get-server-writing-app-api", () => ({
  getServerWritingAppApi: vi.fn(() => api),
}))

describe("앱 홈 route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("프로필 조회 실패를 fallback 홈으로 숨기지 않는다", async () => {
    vi.mocked(api.getProfile).mockResolvedValue(
      apiFailure(serviceError("프로필 서비스를 잠시 사용할 수 없습니다."))
    )
    vi.mocked(api.getProgress).mockResolvedValue(apiOk(emptyProgress))

    render(await AppHomeRoute())

    expect(redirectMock).not.toHaveBeenCalled()
    expect(
      screen.getByRole("heading", { name: "홈을 열 수 없습니다." })
    ).toBeInTheDocument()
    expect(
      screen.getByText("프로필 서비스를 잠시 사용할 수 없습니다.")
    ).toBeInTheDocument()
    expect(screen.queryByText("안녕하세요 👋")).not.toBeInTheDocument()
  })

  it("진행률 조회 실패를 빈 진행 상태로 숨기지 않는다", async () => {
    vi.mocked(api.getProfile).mockResolvedValue(apiOk(profile))
    vi.mocked(api.getProgress).mockResolvedValue(
      apiFailure(serviceError("진행률 서비스를 잠시 사용할 수 없습니다."))
    )

    render(await AppHomeRoute())

    expect(redirectMock).not.toHaveBeenCalled()
    expect(
      screen.getByRole("heading", { name: "홈을 열 수 없습니다." })
    ).toBeInTheDocument()
    expect(
      screen.getByText("진행률 서비스를 잠시 사용할 수 없습니다.")
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: /민지님,\s*오늘도 함께 써봐요\./ })
    ).not.toBeInTheDocument()
  })

  it("API 인증 실패는 로그인으로 보낸다", async () => {
    vi.mocked(api.getProfile).mockResolvedValue(
      apiFailure(authenticationError())
    )
    vi.mocked(api.getProgress).mockResolvedValue(apiOk(emptyProgress))

    await expect(AppHomeRoute()).rejects.toBeInstanceOf(Error)
    expect(redirectMock).toHaveBeenCalledWith("/login?next=%2Fapp")
  })
})

function authenticationError(): ApiError {
  return {
    code: "UNAUTHENTICATED",
    message: "로그인이 필요합니다.",
    requestId: "request-authentication",
    status: 401,
  }
}

function serviceError(message: string): ApiError {
  return {
    code: "PROVIDER_UNAVAILABLE",
    message,
    requestId: "request-service",
    status: 503,
  }
}
