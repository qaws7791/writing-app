import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { MatchAnswer } from "#ui/components/lesson/match-answer"

const leftChoices = [
  { id: "left-1", text: "원인" },
  { id: "left-2", text: "주장" },
] as const
const rightChoices = [
  { id: "right-2", text: "근거" },
  { id: "right-1", text: "결과" },
] as const

describe("MatchAnswer", () => {
  it("controlled 선택·연결 상태를 표시하고 keyboard 선택을 callback으로 전달한다", async () => {
    const onChoiceSelect = vi.fn()
    const user = userEvent.setup()

    render(
      <MatchAnswer
        checked={false}
        connections={[
          {
            leftChoiceId: "left-2",
            rightChoiceId: "right-2",
            tone: "default",
          },
        ]}
        guide="짝을 고르세요"
        leftChoices={leftChoices}
        onChoiceSelect={onChoiceSelect}
        pendingChoice={{ id: "left-1", side: "left" }}
        rightChoices={rightChoices}
        title="매칭"
      />
    )

    const leftGroup = screen.getByRole("group", { name: "왼쪽 선택지" })
    const rightGroup = screen.getByRole("group", { name: "오른쪽 선택지" })

    expect(
      within(leftGroup).getByRole("button", { name: "원인" })
    ).toHaveAttribute("aria-pressed", "true")
    expect(
      within(rightGroup).getByRole("button", { name: "근거" })
    ).toHaveAttribute("aria-pressed", "true")
    expect(
      within(rightGroup).getByRole("button", { name: "결과" })
    ).toHaveAttribute("aria-pressed", "false")

    const rightChoice = within(rightGroup).getByRole("button", {
      name: "결과",
    })
    rightChoice.focus()
    await user.keyboard("{Enter}")

    expect(onChoiceSelect).toHaveBeenCalledWith({
      id: "right-1",
      side: "right",
    })
  })

  it("채점 후에는 추가 선택을 막고 해설을 보여준다", () => {
    render(
      <MatchAnswer
        checked="correct"
        connections={[
          {
            leftChoiceId: "left-1",
            rightChoiceId: "right-1",
            tone: "correct",
          },
        ]}
        explanation="정답 해설"
        guide="짝을 고르세요"
        leftChoices={leftChoices}
        rightChoices={rightChoices}
        title="매칭"
      />
    )

    expect(screen.getByRole("button", { name: "원인" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "주장" })).toBeDisabled()
    expect(screen.getByText("정답 해설")).toBeVisible()
  })
})
