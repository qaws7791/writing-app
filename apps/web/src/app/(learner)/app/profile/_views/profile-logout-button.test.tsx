import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ProfileLogoutButton } from "@/app/(learner)/app/profile/_views/profile-logout-button"

const { clearLessonDraftsMock, pushMock, requestLogoutMock } = vi.hoisted(
  () => ({
    clearLessonDraftsMock: vi.fn(),
    pushMock: vi.fn(),
    requestLogoutMock: vi.fn(async () => "/"),
  })
)

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock("@/features/authentication/api/auth-client", () => ({
  requestLogout: requestLogoutMock,
}))

vi.mock("@/features/lesson-session/api/lesson-draft-storage", () => ({
  clearLessonDraftsForUser: clearLessonDraftsMock,
}))

describe("프로필 로그아웃 버튼", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("로그아웃 성공 후 현재 학습자의 임시 저장을 지우고 홈으로 이동한다", async () => {
    render(<ProfileLogoutButton learnerId="learner-1" />)

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/")
    })
    expect(requestLogoutMock).toHaveBeenCalledWith("/")
    expect(clearLessonDraftsMock).toHaveBeenCalledWith("learner-1")
    expect(requestLogoutMock.mock.invocationCallOrder[0]).toBeLessThan(
      clearLessonDraftsMock.mock.invocationCallOrder[0] ?? 0
    )
    expect(clearLessonDraftsMock.mock.invocationCallOrder[0]).toBeLessThan(
      pushMock.mock.invocationCallOrder[0] ?? 0
    )
  })
})
