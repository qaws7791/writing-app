import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

const { getProfile, redirectMock, requestOptions, serverOptionsMock } =
  vi.hoisted(() => ({
    getProfile: vi.fn(),
    redirectMock: vi.fn((path: string) => {
      throw new Error(`redirect:${path}`)
    }),
    requestOptions: { cache: "no-store" } as const,
    serverOptionsMock: vi.fn(),
  }))

vi.mock("@workspace/http-client/learner", () => ({ getProfile }))
vi.mock("@/server/http/learner-api-client", () => ({
  getServerLearnerRequestOptions: serverOptionsMock,
}))
vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

import ProfileRoute from "@/app/(learner)/app/profile/page"

describe("프로필 route", () => {
  beforeEach(() => {
    serverOptionsMock.mockResolvedValue(requestOptions)
  })

  it("API 인증 실패만 로그인으로 보낸다", async () => {
    getProfile.mockRejectedValue(
      httpError("UNAUTHENTICATED", 401, "로그인이 필요합니다.")
    )

    await expect(ProfileRoute()).rejects.toThrow()
    expect(redirectMock).toHaveBeenCalledWith("/login?next=%2Fapp%2Fprofile")
  })

  it("프로필 서비스 장애는 로그인으로 보내지 않고 notice로 보여준다", async () => {
    getProfile.mockRejectedValue(
      httpError(
        "PROVIDER_UNAVAILABLE",
        503,
        "프로필 서비스를 잠시 사용할 수 없습니다."
      )
    )

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
