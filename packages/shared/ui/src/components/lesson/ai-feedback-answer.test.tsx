import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AiFeedbackAnswer } from "#ui/components/lesson/ai-feedback-answer"

describe("AiFeedbackAnswer", () => {
  it("복구 가능한 실패는 retry와 피드백 없이 계속하기를 제공한다", async () => {
    const user = userEvent.setup()
    const onContinueWithoutFeedback = vi.fn(async () => ({
      status: "ok" as const,
    }))
    render(
      <AiFeedbackAnswer
        allowRetry
        focus="명확성"
        onContinueWithoutFeedback={onContinueWithoutFeedback}
        onRequest={async () => ({ kind: "retryable", status: "error" })}
      />
    )

    await user.click(screen.getByRole("button", { name: "AI 코칭 받기" }))

    expect(screen.getByRole("alert")).toHaveTextContent(
      "AI 코칭을 잠시 불러오지 못했습니다."
    )
    expect(
      screen.getByRole("button", { name: "AI 코칭 다시 받기" })
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "피드백 없이 계속하기" })
    )

    expect(onContinueWithoutFeedback).toHaveBeenCalledOnce()
    expect(screen.getByRole("status")).toHaveTextContent(
      "다음 학습으로 이동합니다."
    )
  })

  it("영구 실패는 retry 없이 피드백 없이 계속하기만 제공한다", async () => {
    const user = userEvent.setup()
    render(
      <AiFeedbackAnswer
        allowRetry
        focus="명확성"
        onContinueWithoutFeedback={async () => ({ status: "ok" })}
        onRequest={async () => ({ kind: "limit", status: "error" })}
      />
    )

    await user.click(screen.getByRole("button", { name: "AI 코칭 받기" }))

    expect(screen.getByRole("alert")).toHaveTextContent(
      "이 단계에서 받을 수 있는 AI 코칭 3회를 모두 사용했어요."
    )
    expect(
      screen.queryByRole("button", { name: "AI 코칭 다시 받기" })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "피드백 없이 계속하기" })
    ).toBeInTheDocument()
  })
})
