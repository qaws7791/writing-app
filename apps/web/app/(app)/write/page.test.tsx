import { render, screen } from "@testing-library/react"

import WriteListPage from "./page"
import { createDeferred } from "@/test-support/async"
import { createMockPhaseOneRepository } from "@/test-support/mock-phase-one-repository"
import { createDraftSummary } from "@/test-support/phase-one-test-fixtures"

const repository = createMockPhaseOneRepository()

vi.mock("@/lib/phase-one-repository", () => ({
  createPhaseOneRepository: () => repository,
}))

describe("write list page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("renders loading state", () => {
    const deferred =
      createDeferred<
        ReturnType<
          typeof repository.listDrafts extends (
            ...args: never[]
          ) => Promise<infer TValue>
            ? () => TValue
            : never
        >
      >()
    repository.listDrafts.mockReturnValue(deferred.promise as never)

    render(<WriteListPage />)

    expect(
      screen.getByText("초안 목록을 불러오는 중입니다.")
    ).toBeInTheDocument()
  })

  test("renders draft list and create entry point", async () => {
    repository.listDrafts.mockResolvedValue([
      createDraftSummary({ id: 4, title: "새 초안", preview: "본문 요약" }),
    ])

    render(<WriteListPage />)

    expect(await screen.findByText("새 초안")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /새 글 시작/i })).toHaveAttribute(
      "href",
      "/write/new"
    )
  })

  test("renders empty and error states", async () => {
    repository.listDrafts.mockResolvedValue([])

    const view = render(<WriteListPage />)

    expect(
      await screen.findByText(
        "아직 작성한 초안이 없습니다. 오늘의 첫 문장을 여기서 시작할 수 있습니다."
      )
    ).toBeInTheDocument()

    view.unmount()
    repository.listDrafts.mockRejectedValue(new Error("boom"))
    render(<WriteListPage />)

    expect(
      await screen.findByText(
        "초안 목록을 불러오지 못했습니다. 그래도 새 글은 바로 시작할 수 있습니다."
      )
    ).toBeInTheDocument()
  })
})
