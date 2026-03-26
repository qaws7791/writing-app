import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import PromptDetailView from "@/views/prompt-detail-view"
import { createDeferred } from "@/test-support/async"
import { createMockPromptRepository } from "@/test-support/mock-repository"
import { createPromptDetail } from "@/test-support/test-fixtures"

const push = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

const repository = createMockPromptRepository()

vi.mock("@/features/prompt/repositories/prompt-repository", () => ({
  createPromptRepository: () => repository,
}))

describe("prompt detail view", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("renders loading state", () => {
    const deferred = createDeferred<ReturnType<typeof createPromptDetail>>()
    repository.getPrompt.mockReturnValue(deferred.promise)

    render(<PromptDetailView promptId={1} />)

    expect(screen.getByText("글감을 불러오는 중입니다.")).toBeInTheDocument()
  })

  test("renders prompt detail and write cta", async () => {
    repository.getPrompt.mockResolvedValue(
      createPromptDetail({
        id: 6,
        text: "AI가 일상에 들어오면서 잃어가는 것은?",
      })
    )

    render(<PromptDetailView promptId={6} />)

    expect(
      await screen.findByText("AI가 일상에 들어오면서 잃어가는 것은?")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /이 글감으로 글 쓰기/i })
    ).toBeInTheDocument()
  })

  test("toggles save state", async () => {
    repository.getPrompt.mockResolvedValue(
      createPromptDetail({ id: 3, saved: false })
    )
    repository.savePrompt.mockResolvedValue({
      kind: "saved",
      savedAt: "2026-03-20T10:00:00.000Z",
    })

    render(<PromptDetailView promptId={3} />)

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

    render(<PromptDetailView promptId={100} />)

    expect(
      await screen.findByText(
        "글감을 불러오지 못했습니다. 목록으로 돌아가 다시 선택해 주세요."
      )
    ).toBeInTheDocument()
  })
})
