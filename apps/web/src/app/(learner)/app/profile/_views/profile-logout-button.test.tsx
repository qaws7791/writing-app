import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ProfileLogoutButton } from "@/app/(learner)/app/profile/_views/profile-logout-button"

const { pushMock, requestLogoutMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  requestLogoutMock: vi.fn(async () => "/"),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock("@/features/authentication/api/auth-client", () => ({
  requestLogout: requestLogoutMock,
}))

describe("프로필 로그아웃 버튼", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("로그아웃 성공 후 홈으로 이동한다", async () => {
    render(<ProfileLogoutButton />)

    fireEvent.click(screen.getByRole("button", { name: "로그아웃" }))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/")
    })
    expect(requestLogoutMock).toHaveBeenCalledWith("/")
  })
})
