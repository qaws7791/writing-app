import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

const { generatedClient, redirectMock, requestOptions, serverOptionsMock } =
  vi.hoisted(() => ({
    generatedClient: {
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
    refresh: vi.fn(),
  }),
}))

import AppHomeRoute from "@/app/(learner)/app/page"
import { emptyLearnerProgressFixture } from "@/test/learner-api-fixtures"
import { learnerProfileFixture } from "@/test/learner-api-fixtures"
import type { LearnerProfileDto } from "@/shared/http/learner-api-client"

const profile: LearnerProfileDto = {
  ...learnerProfileFixture,
  user: {
    ...learnerProfileFixture.user,
    email: "minji@example.com",
    id: "user-1",
    joinedAt: "2026-06-01T00:00:00.000Z",
    name: "민지",
  },
}

const emptyProgress = emptyLearnerProgressFixture

describe("앱 홈 route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    serverOptionsMock.mockResolvedValue(requestOptions)
  })

  it("프로필 조회 실패를 fallback 홈으로 숨기지 않는다", async () => {
    generatedClient.getProfile.mockRejectedValue(
      httpError(
        "PROVIDER_UNAVAILABLE",
        503,
        "프로필 서비스를 잠시 사용할 수 없습니다."
      )
    )
    generatedClient.getProgress.mockResolvedValue(emptyProgress)

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
    generatedClient.getProfile.mockResolvedValue(profile)
    generatedClient.getProgress.mockRejectedValue(
      httpError(
        "PROVIDER_UNAVAILABLE",
        503,
        "진행률 서비스를 잠시 사용할 수 없습니다."
      )
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
    generatedClient.getProfile.mockRejectedValue(
      httpError("UNAUTHENTICATED", 401, "로그인이 필요합니다.")
    )
    generatedClient.getProgress.mockResolvedValue(emptyProgress)

    await expect(AppHomeRoute()).rejects.toBeInstanceOf(Error)
    expect(redirectMock).toHaveBeenCalledWith("/login?next=%2Fapp")
  })
})

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
