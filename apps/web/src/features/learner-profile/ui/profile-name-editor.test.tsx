import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

const { push, refresh, updateProfile } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  updateProfile: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}))
vi.mock("@workspace/http-client/learner", () => ({ updateProfile }))

import { ProfileNameEditor } from "@/features/learner-profile/ui/profile-name-editor"

async function openProfileNameDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "표시 이름 수정" }))
}

describe("프로필 이름 편집", () => {
  it("접근 가능한 form으로 이름을 저장하고 Dialog를 닫는다", async () => {
    const user = userEvent.setup()
    updateProfile.mockResolvedValue({ name: "새 이름" })
    render(<ProfileNameEditor currentName="기존 이름" />)

    await openProfileNameDialog(user)
    await user.clear(screen.getByLabelText("표시 이름"))
    await user.type(screen.getByLabelText("표시 이름"), "새 이름")
    await user.click(screen.getByRole("button", { name: "이름 저장" }))

    expect(updateProfile).toHaveBeenCalledWith({ name: "새 이름" })
    expect(refresh).toHaveBeenCalledOnce()
    expect(screen.queryByLabelText("표시 이름")).not.toBeInTheDocument()
  })

  it("API 오류를 숨기지 않고 alert로 전달한다", async () => {
    const user = userEvent.setup()
    updateProfile.mockRejectedValue(
      new GeneratedApiClientError({
        error: {
          code: "IDENTITY_CONFLICT",
          message: "다른 변경과 충돌했습니다.",
          requestId: "request-1",
          violations: [],
        },
        kind: "http",
        retryAfterSeconds: null,
        status: 409,
      })
    )
    render(<ProfileNameEditor currentName="기존 이름" />)

    await openProfileNameDialog(user)
    await user.click(screen.getByRole("button", { name: "이름 저장" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "다른 변경과 충돌했습니다."
    )
    expect(refresh).not.toHaveBeenCalled()
  })
})
