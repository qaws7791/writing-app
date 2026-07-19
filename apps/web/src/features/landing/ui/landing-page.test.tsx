import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { LandingPage } from "@/features/landing/ui/landing-page"

describe("공개 랜딩 페이지", () => {
  it("현재 제품 랜딩의 브랜드, 섹션 순서, 주요 CTA를 렌더링한다", () => {
    const { container } = render(<LandingPage />)

    const getSection = (index: number) => {
      const section = container.querySelectorAll("section")[index]
      if (!section) {
        throw new Error(`${index}번 랜딩 section을 찾지 못했습니다.`)
      }

      return section as HTMLElement
    }

    expect(screen.getAllByText("글결")).toHaveLength(2)
    expect(screen.getByText("하루 5분, 새로운 학습 습관")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /매일 한 조각,\s*단단해지는\s*학습/
    )

    const primaryCtas = screen.getAllByRole("link", {
      name: "무료로 시작하기",
    })
    expect(primaryCtas).toHaveLength(2)

    const primaryCta = primaryCtas[0]
    if (!primaryCta) {
      throw new Error("첫 번째 무료로 시작하기 버튼을 찾지 못했습니다.")
    }

    const browseCourses = screen.getByRole("link", {
      name: "코스 둘러보기",
    })

    const pageSections = Array.from(container.querySelectorAll("section"))
    expect(pageSections).toHaveLength(7)
    expect(pageSections.map((section) => section.textContent)).toEqual([
      expect.stringContaining("하루 5분, 새로운 학습 습관"),
      expect.stringContaining("언어디자인코딩역사"),
      expect.stringContaining("왜 글결인가"),
      expect.stringContaining("이렇게 시작해요"),
      expect.stringContaining("큐레이션 코스"),
      expect.stringContaining("미리보기"),
      expect.stringContaining("오늘의 첫 조각을"),
    ])

    const features = getSection(2)
    expect(within(features).getByText("왜 글결인가")).toBeInTheDocument()
    expect(within(features).getByText("작은 조각으로")).toBeInTheDocument()
    expect(within(features).getByText("습관이 되는 흐름")).toBeInTheDocument()
    expect(within(features).getByText("직접 만지는 학습")).toBeInTheDocument()
    expect(within(features).getByText("나에게 맞춰")).toBeInTheDocument()

    const howItWorks = getSection(3)
    expect(within(howItWorks).getByText("이렇게 시작해요")).toBeInTheDocument()
    expect(within(howItWorks).getByText("관심사를 골라요")).toBeInTheDocument()
    expect(within(howItWorks).getByText("매일 한 조각씩")).toBeInTheDocument()
    expect(
      within(howItWorks).getByText("쌓여서 단단해져요")
    ).toBeInTheDocument()

    const stats = getSection(4)
    expect(within(stats).getAllByText("0+")).toHaveLength(2)
    expect(within(stats).getByText("0%")).toBeInTheDocument()

    const showcase = getSection(5)
    expect(within(showcase).getByText("미리보기")).toBeInTheDocument()
    expect(
      within(showcase).getByText("손에 익는 학습 경험")
    ).toBeInTheDocument()

    const finalCta = getSection(6)
    expect(
      within(finalCta).getByRole("heading", { level: 2 })
    ).toHaveTextContent(/오늘의 첫 조각을\s*맞춰볼까요\?/)

    expect(screen.getByRole("link", { name: "글결" })).toHaveAttribute(
      "href",
      "/"
    )
    expect(screen.getByRole("link", { name: "시작하기" })).toHaveAttribute(
      "href",
      "/app"
    )
    expect(primaryCta).toHaveAttribute("href", "/app")
    expect(browseCourses).toHaveAttribute("href", "/app/courses")
  })

  it("현재 제품 랜딩 HTML과 다른 제품 전용 속성을 추가하지 않는다", () => {
    const { container } = render(<LandingPage />)

    expect(container.querySelector("[data-testid]")).not.toBeInTheDocument()

    for (const button of container.querySelectorAll("button")) {
      expect(button).toHaveAttribute("type", "button")
    }

    const heroImages = container.querySelectorAll(
      "[aria-label='글결 앱 홈 화면 미리보기']"
    )
    expect(heroImages).toHaveLength(1)

    expect(
      screen.getByRole("img", { name: "글결 레슨 진행 화면" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("img", { name: "글결 코스 대시보드 화면" })
    ).toBeInTheDocument()
  })

  it("footer는 실제 목적지가 있는 메뉴만 제공한다", () => {
    const { container } = render(<LandingPage />)

    const footer = screen.getByRole("contentinfo")
    const features = container.querySelector("#features")

    expect(features).toBeInTheDocument()
    expect(within(footer).getByRole("link", { name: "코스" })).toHaveAttribute(
      "href",
      "/app/courses"
    )
    expect(
      within(footer).getByRole("link", { name: "학습 통계" })
    ).toHaveAttribute("href", "/app")
    expect(within(footer).getByRole("link", { name: "소개" })).toHaveAttribute(
      "href",
      "/#features"
    )
    expect(footer.querySelector('a[href="#"]')).not.toBeInTheDocument()

    for (const label of [
      "레슨",
      "요금제",
      "블로그",
      "채용",
      "문의",
      "도움말",
      "커뮤니티",
      "이용약관",
      "개인정보",
    ]) {
      expect(
        within(footer).queryByRole("link", { name: label })
      ).not.toBeInTheDocument()
    }
  })

  it("motion listener를 passive로 등록하고 unmount에서 정리한다", () => {
    installReducedMotion(false)
    const addEventListener = vi.spyOn(window, "addEventListener")
    const removeEventListener = vi.spyOn(window, "removeEventListener")
    addEventListener.mockClear()
    removeEventListener.mockClear()
    const { unmount } = render(<LandingPage />)

    for (const eventName of ["pointermove", "resize", "scroll"]) {
      const added = addEventListener.mock.calls.filter(
        ([registeredName]) => registeredName === eventName
      )
      expect(added.length).toBeGreaterThan(0)
      if (eventName !== "resize") {
        expect(
          added.every(
            ([, , options]) =>
              typeof options === "object" && options.passive === true
          )
        ).toBe(true)
      }
    }

    unmount()

    for (const eventName of ["pointermove", "resize", "scroll"]) {
      expect(
        removeEventListener.mock.calls.filter(
          ([registeredName]) => registeredName === eventName
        )
      ).toHaveLength(
        addEventListener.mock.calls.filter(
          ([registeredName]) => registeredName === eventName
        ).length
      )
    }
  })

  it("reduced motion에서는 pointer와 parallax listener를 등록하지 않는다", () => {
    installReducedMotion(true)
    const addEventListener = vi.spyOn(window, "addEventListener")
    addEventListener.mockClear()
    render(<LandingPage />)

    expect(
      addEventListener.mock.calls.filter(
        ([registeredName]) => registeredName === "pointermove"
      )
    ).toHaveLength(0)
  })
})

function installReducedMotion(matches: boolean) {
  window.matchMedia = () => ({
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  })
}
