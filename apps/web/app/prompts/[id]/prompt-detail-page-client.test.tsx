import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import PromptDetailPageClient from "./prompt-detail-page-client"
import { createDeferred } from "@/test-support/async"
import { createMockPhaseOneRepository } from "@/test-support/mock-phase-one-repository"
import { createPromptDetail } from "@/test-support/phase-one-test-fixtures"

const repository = createMockPhaseOneRepository()

vi.mock("@/lib/phase-one-repository", () => ({
  createPhaseOneRepository: () => repository,
}))

describe("prompt detail page client", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("renders loading state", () => {
    const deferred = createDeferred<ReturnType<typeof createPromptDetail>>()
    repository.getPrompt.mockReturnValue(deferred.promise)

    render(<PromptDetailPageClient promptId={1} />)

    expect(screen.getByText("글감을 불러오는 중입니다.")).toBeInTheDocument()
  })

  test("renders prompt detail and write cta", async () => {
    repository.getPrompt.mockResolvedValue(
      createPromptDetail({
        id: 6,
        text: "AI가 일상에 들어오면서 잃어가는 것은?",
      })
    )

    render(<PromptDetailPageClient promptId={6} />)

    expect(
      await screen.findByText("AI가 일상에 들어오면서 잃어가는 것은?")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "이 글감으로 글 쓰기" })
    ).toHaveAttribute("href", "/write/new?prompt=6")
  })

  test("toggles save state", async () => {
    repository.getPrompt.mockResolvedValue(
      createPromptDetail({ id: 3, saved: false })
    )
    repository.savePrompt.mockResolvedValue({
      kind: "saved",
      savedAt: "2026-03-20T10:00:00.000Z",
    })

    render(<PromptDetailPageClient promptId={3} />)

    await screen.findByText("기본 글감")
    await userEvent.click(screen.getByRole("button", { name: "글감 저장" }))

    expect(repository.savePrompt).toHaveBeenCalledWith(3)
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "저장 해제" })
      ).toBeInTheDocument()
    })
  })

  test("shows error state when prompt loading fails", async () => {
    repository.getPrompt.mockRejectedValue(new Error("boom"))

    render(<PromptDetailPageClient promptId={100} />)

    expect(
      await screen.findByText(
        "글감을 불러오지 못했습니다. 목록으로 돌아가 다시 선택해 주세요."
      )
    ).toBeInTheDocument()
  })
})
