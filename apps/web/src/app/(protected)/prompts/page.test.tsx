import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import PromptsPage from "./page"
import { createDeferred } from "@/test-support/async"
import { createMockRepository } from "@/test-support/mock-repository"
import { createPromptSummary } from "@/test-support/test-fixtures"

const repository = createMockRepository()

vi.mock("@/lib/repository", () => ({
  createAppRepository: () => repository,
}))

describe("prompts page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("renders loading state while prompts are pending", () => {
    const deferred =
      createDeferred<
        ReturnType<
          typeof repository.listPrompts extends (
            ...args: never[]
          ) => Promise<infer TValue>
            ? () => TValue
            : never
        >
      >()
    repository.listPrompts.mockReturnValue(deferred.promise as never)

    render(<PromptsPage />)

    expect(screen.getByText("글감을 불러오는 중입니다.")).toBeInTheDocument()
  })

  test("filters prompts by search and topic chip", async () => {
    repository.listPrompts.mockImplementation(async (filters) => {
      if (filters?.query === "AI") {
        return [
          createPromptSummary({
            id: 1,
            text: "AI에 대한 생각",
            topic: "기술",
            tags: ["AI"],
          }),
        ]
      }

      if (filters?.topic === "일상") {
        return [
          createPromptSummary({
            id: 2,
            text: "산책의 기억",
            topic: "일상",
            tags: ["기억"],
          }),
        ]
      }

      return [
        createPromptSummary({
          id: 1,
          text: "AI에 대한 생각",
          topic: "기술",
          tags: ["AI"],
        }),
        createPromptSummary({
          id: 2,
          text: "산책의 기억",
          topic: "일상",
          tags: ["기억"],
        }),
      ]
    })

    render(<PromptsPage />)

    expect(await screen.findByText("AI에 대한 생각")).toBeInTheDocument()

    await userEvent.type(
      screen.getByPlaceholderText("주제, 키워드, 감정으로 검색"),
      "AI"
    )

    await waitFor(() => {
      expect(repository.listPrompts).toHaveBeenLastCalledWith({
        query: "AI",
        topic: undefined,
      })
    })
    expect(screen.getByText("AI에 대한 생각")).toBeInTheDocument()
    expect(screen.queryByText("산책의 기억")).not.toBeInTheDocument()

    await userEvent.clear(
      screen.getByPlaceholderText("주제, 키워드, 감정으로 검색")
    )
    await userEvent.click(screen.getByRole("button", { name: "일상" }))

    await waitFor(() => {
      expect(repository.listPrompts).toHaveBeenLastCalledWith({
        query: undefined,
        topic: "일상",
      })
    })
    expect(screen.getByText("산책의 기억")).toBeInTheDocument()
    expect(screen.queryByText("AI에 대한 생각")).not.toBeInTheDocument()
  })

  test("toggles saved state from the list", async () => {
    repository.listPrompts.mockResolvedValue([
      createPromptSummary({ id: 1, saved: false, text: "저장 테스트" }),
    ])
    repository.savePrompt.mockResolvedValue({
      kind: "saved",
      savedAt: "2026-03-20T10:00:00.000Z",
    })

    render(<PromptsPage />)

    await screen.findByText("저장 테스트")
    await userEvent.click(screen.getByRole("button", { name: "글감 저장" }))

    expect(repository.savePrompt).toHaveBeenCalledWith(1)
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "저장 해제" })
      ).toBeInTheDocument()
    })
  })

  test("shows no-result and error states", async () => {
    repository.listPrompts.mockResolvedValue([])

    const view = render(<PromptsPage />)

    expect(
      await screen.findByText(
        "조건에 맞는 글감이 없습니다. 검색어나 주제를 바꿔보세요."
      )
    ).toBeInTheDocument()

    view.unmount()
    repository.listPrompts.mockRejectedValue(new Error("boom"))
    render(<PromptsPage />)

    expect(
      await screen.findByText(
        "글감을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
      )
    ).toBeInTheDocument()
  })
})
