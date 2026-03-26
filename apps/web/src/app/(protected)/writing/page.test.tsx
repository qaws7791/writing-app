import { render, screen } from "@testing-library/react"

import WritingListPage from "./page"
import { createDeferred } from "@/test-support/async"
import { createMockWritingRepository } from "@/test-support/mock-repository"
import { createWritingSummary } from "@/test-support/test-fixtures"

const push = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

const repository = createMockWritingRepository()

vi.mock("@/features/writing/repositories/writing-repository", () => ({
  createWritingRepository: () => repository,
}))

describe("writing list page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("renders loading state", () => {
    const deferred =
      createDeferred<
        ReturnType<
          typeof repository.listWritings extends (
            ...args: never[]
          ) => Promise<infer TValue>
            ? () => TValue
            : never
        >
      >()
    repository.listWritings.mockReturnValue(deferred.promise as never)

    render(<WritingListPage />)

    expect(screen.getByText("글 목록을 불러오는 중입니다.")).toBeInTheDocument()
  })

  test("renders writing list and create entry point", async () => {
    repository.listWritings.mockResolvedValue([
      createWritingSummary({ id: 4, title: "새 글", preview: "본문 요약" }),
    ])

    render(<WritingListPage />)

    expect(await screen.findByText("새 글")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /새 글 시작/i })
    ).toBeInTheDocument()
  })

  test("renders empty and error states", async () => {
    repository.listWritings.mockResolvedValue([])

    const view = render(<WritingListPage />)

    expect(
      await screen.findByText(
        "아직 작성한 글이 없습니다. 오늘의 첫 문장을 여기서 시작할 수 있습니다."
      )
    ).toBeInTheDocument()

    view.unmount()
    repository.listWritings.mockRejectedValue(new Error("boom"))
    render(<WritingListPage />)

    expect(
      await screen.findByText(
        "글 목록을 불러오지 못했습니다. 그래도 새 글은 바로 시작할 수 있습니다."
      )
    ).toBeInTheDocument()
  })
})
