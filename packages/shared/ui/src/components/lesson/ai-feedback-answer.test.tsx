import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  AiFeedbackAnswer,
  type AiFeedbackRequestOutcome,
} from "#ui/components/lesson/ai-feedback-answer"

const feedback = {
  improvements: ["근거를 구체화해 보세요."],
  nextAction: "예시를 한 문장 추가하세요.",
  remainingAttempts: 2,
  strengths: ["주장이 분명합니다."],
  summary: "핵심이 잘 드러납니다.",
}

describe("AiFeedbackAnswer", () => {
  it("요청 중과 성공 결과를 순서대로 알린다", async () => {
    const request = createDeferred<AiFeedbackRequestOutcome>()
    render(
      <AiFeedbackAnswer
        allowRetry
        focus="명확성"
        onRequest={() => request.promise}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "AI 코칭 받기" }))
    expect(screen.getByRole("status")).toHaveTextContent("AI가 코칭 중입니다")

    request.resolve({ feedback, status: "ok" })

    expect(await screen.findByText(feedback.summary)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "AI 코칭 다시 받기 (2회 남음)" })
    ).toBeInTheDocument()
  })

  it("재시도 가능 실패에서 재시도와 피드백 없이 계속하기를 함께 제공한다", async () => {
    const onContinueWithoutFeedback = vi.fn(async () => ({
      status: "ok" as const,
    }))
    render(
      <AiFeedbackAnswer
        allowRetry
        focus="명확성"
        onContinueWithoutFeedback={onContinueWithoutFeedback}
        onRequest={async () => ({
          kind: "retryable",
          status: "error",
        })}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "AI 코칭 받기" }))

    expect(screen.getByRole("alert")).toHaveTextContent(
      "AI 코칭을 잠시 불러오지 못했습니다."
    )
    expect(
      screen.getByRole("button", { name: "AI 코칭 다시 받기" })
    ).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole("button", { name: "피드백 없이 계속하기" })
    )

    expect(onContinueWithoutFeedback).toHaveBeenCalledOnce()
    expect(screen.getByRole("status")).toHaveTextContent(
      "다음 학습으로 이동합니다."
    )
  })

  it("일일 quota의 서버 Retry-After를 한국 시각으로 표시한다", async () => {
    vi.spyOn(Date, "now").mockReturnValue(
      new Date("2026-07-24T00:00:00.000Z").getTime()
    )
    render(
      <AiFeedbackAnswer
        allowRetry
        focus="명확성"
        onContinueWithoutFeedback={async () => ({ status: "ok" })}
        onRequest={async () => ({
          kind: "quota",
          retryAfterSeconds: 3_600,
          status: "error",
        })}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "AI 코칭 받기" }))

    expect(screen.getByRole("alert")).toHaveTextContent(
      "오늘 받을 수 있는 AI 코칭을 모두 사용했어요."
    )
    expect(screen.getByRole("alert").querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-07-24T01:00:00.000Z"
    )
    expect(
      screen.queryByRole("button", { name: "AI 코칭 다시 받기" })
    ).not.toBeInTheDocument()
  })

  it("영구 3회 limit은 재시도 대신 계속하기만 제공한다", async () => {
    render(
      <AiFeedbackAnswer
        allowRetry
        focus="명확성"
        onContinueWithoutFeedback={async () => ({ status: "ok" })}
        onRequest={async () => ({
          kind: "limit",
          status: "error",
        })}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "AI 코칭 받기" }))

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

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}
