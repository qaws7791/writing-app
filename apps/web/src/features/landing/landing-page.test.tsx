import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { LandingPage } from "@/features/landing/landing-page"

describe("공개 랜딩 페이지", () => {
  it("글결 제품명, 핵심 섹션, 앱 진입 CTA를 렌더링한다", () => {
    render(<LandingPage />)

    expect(
      screen.getByRole("heading", { level: 1, name: "글결" })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "짧게 배우고, 바로 쓰고, AI 코칭으로 다시 다듬는 글쓰기 학습"
      )
    ).toBeInTheDocument()

    const primaryCta = screen.getByRole("link", {
      name: "무료로 시작하기",
    })
    expect(primaryCta).toHaveAttribute("href", "/login?next=/app")

    const previewSection = screen.getByRole("region", {
      name: "코스 미리보기",
    })
    expect(
      within(previewSection).getByText("글쓰기 첫걸음 30일")
    ).toBeInTheDocument()
    expect(
      within(previewSection).getByText("문장의 기본 문법")
    ).toBeInTheDocument()

    expect(
      screen.getByRole("region", { name: "학습 방식" })
    ).toBeInTheDocument()
  })
})
