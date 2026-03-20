import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import Page from "./page"
import { createDeferred } from "@/test-support/async"
import { createMockPhaseOneRepository } from "@/test-support/mock-phase-one-repository"
import { createHomeSnapshot } from "@/test-support/phase-one-test-fixtures"

const repository = createMockPhaseOneRepository()

vi.mock("@/lib/phase-one-repository", () => ({
  createPhaseOneRepository: () => repository,
}))

describe("home page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("renders loading state while home snapshot is pending", () => {
    const deferred = createDeferred<ReturnType<typeof createHomeSnapshot>>()
    repository.getHome.mockReturnValue(deferred.promise)

    render(<Page />)

    expect(
      screen.getByText("오늘의 글감을 불러오는 중입니다.")
    ).toBeInTheDocument()
    expect(
      screen.getByText("작성 중인 글을 불러오는 중입니다.")
    ).toBeInTheDocument()
  })

  test("renders today prompts and resume draft from home snapshot", async () => {
    repository.getHome.mockResolvedValue(createHomeSnapshot())

    render(<Page />)

    expect(await screen.findByText("오늘의 글감 1")).toBeInTheDocument()
    expect(
      screen
        .getAllByRole("link")
        .some((link) => link.getAttribute("href") === "/write/11")
    ).toBe(true)
    expect(screen.getAllByText("이어서 쓰는 초안")).toHaveLength(2)
    expect(
      screen.getByRole("link", { name: /오늘의 글감 1/i })
    ).toHaveAttribute("href", "/prompts/31")
  })

  test("shows saved prompts in saved tab and empty drafts fallback", async () => {
    repository.getHome.mockResolvedValue(
      createHomeSnapshot({
        recentDrafts: [],
        resumeDraft: null,
        savedPrompts: [],
        todayPrompts: [],
      })
    )

    render(<Page />)

    expect(
      await screen.findByText(
        "오늘의 추천이 아직 준비되지 않았습니다. 글감 찾기에서 시작할 수 있습니다."
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText("아직 작성 중인 글이 없습니다.")
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole("tab", { name: "저장한 글감" }))

    expect(screen.getByText("아직 저장한 글감이 없습니다.")).toBeInTheDocument()
  })

  test("shows fallback when home loading fails", async () => {
    repository.getHome.mockRejectedValue(new Error("boom"))

    render(<Page />)

    expect(
      await screen.findByText(
        "추천 글감을 불러오지 못했습니다. 글감 찾기에서 다른 시작점을 찾아보세요."
      )
    ).toBeInTheDocument()
  })
})
