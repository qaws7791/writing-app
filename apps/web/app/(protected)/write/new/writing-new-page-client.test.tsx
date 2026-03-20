import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import WritingNewPageClient from "./writing-new-page-client"
import { createMockPhaseOneRepository } from "@/test-support/mock-phase-one-repository"
import {
  createDraftContent,
  createDraftDetail,
  createPromptDetail,
} from "@/test-support/phase-one-test-fixtures"

const repository = createMockPhaseOneRepository()
const replace = vi.fn()
const push = vi.fn()

vi.mock("@/lib/phase-one-repository", () => ({
  createPhaseOneRepository: () => repository,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    replace,
  }),
}))

vi.mock("@/components/writing-body-editor", () => ({
  default: ({
    onContentChange,
  }: {
    onContentChange?: (content: ReturnType<typeof createDraftContent>) => void
  }) => (
    <button
      type="button"
      onClick={() => onContentChange?.(createDraftContent("에디터 변경"))}
    >
      본문 변경
    </button>
  ),
}))

vi.mock("./writing-export-modal", () => ({
  WritingExportModal: () => null,
}))

vi.mock("./writing-version-history-modal", () => ({
  WritingVersionHistoryModal: () => null,
}))

vi.mock("@workspace/ui/components/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock("@workspace/ui/components/button.styles", () => ({
  buttonVariants: () => "button",
}))

vi.mock("@workspace/ui/components/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) => <button onClick={onClick}>{children}</button>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ render }: { render: React.ReactNode }) => (
    <>{render}</>
  ),
}))

vi.mock("@workspace/ui/components/alert-dialog", () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) => <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogMedia: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}))

describe("writing new page client", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    repository.getPrompt.mockResolvedValue(
      createPromptDetail({ id: 1, text: "연결된 글감" })
    )
  })

  test("loads existing draft and prompt context", async () => {
    repository.getDraft.mockResolvedValue(
      createDraftDetail({
        id: 5,
        sourcePromptId: 1,
        title: "기존 초안",
      })
    )

    render(<WritingNewPageClient draftId={5} />)

    expect(await screen.findByText("연결된 글감")).toBeInTheDocument()
    expect(
      screen.getByRole("textbox", { name: "에세이 제목" })
    ).toHaveTextContent("기존 초안")
  })

  test("creates a draft after the first meaningful input", async () => {
    const user = userEvent.setup()

    repository.createDraft.mockResolvedValue(
      createDraftDetail({
        id: 41,
        content: createDraftContent("에디터 변경"),
      })
    )

    render(<WritingNewPageClient initialPromptId={1} />)

    await screen.findByText("연결된 글감")
    await user.click(screen.getByRole("button", { name: "본문 변경" }))

    await waitFor(() => {
      expect(repository.createDraft).toHaveBeenCalled()
    })
    expect(replace).toHaveBeenCalledWith("/write/41")
  })

  test("autosaves an existing draft after debounce and updates save state", async () => {
    repository.getDraft.mockResolvedValue(
      createDraftDetail({
        id: 7,
        sourcePromptId: null,
        title: "자동저장 대상",
      })
    )
    repository.autosaveDraft.mockResolvedValue({
      draft: createDraftDetail({
        id: 7,
        content: createDraftContent("에디터 변경"),
        lastSavedAt: "2026-03-20T12:00:00.000Z",
        title: "자동저장 대상",
      }),
      kind: "autosaved",
    })

    render(<WritingNewPageClient draftId={7} />)

    await screen.findByText("자동저장 대상")
    vi.useFakeTimers()
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "본문 변경" }))
    })

    expect(screen.getByText("임시 저장 중")).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700)
    })

    expect(repository.autosaveDraft).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        content: createDraftContent("에디터 변경"),
      })
    )
    expect(screen.getByText(/임시 저장됨/)).toBeInTheDocument()
    vi.useRealTimers()
  })

  test("deletes a draft and returns to the list", async () => {
    const user = userEvent.setup()

    repository.getDraft.mockResolvedValue(
      createDraftDetail({
        id: 9,
        title: "삭제할 초안",
      })
    )
    repository.deleteDraft.mockResolvedValue()

    render(<WritingNewPageClient draftId={9} />)

    await screen.findByText("삭제할 초안")
    const deleteButtons = screen.getAllByRole("button", { name: "삭제" })
    await user.click(deleteButtons[1]!)

    await waitFor(() => {
      expect(repository.deleteDraft).toHaveBeenCalledWith(9)
    })
    expect(push).toHaveBeenCalledWith("/write")
  })

  test("shows load error when draft fetch fails", async () => {
    repository.getDraft.mockRejectedValue(new Error("boom"))

    render(<WritingNewPageClient draftId={999} />)

    expect(
      await screen.findByText(
        "초안을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
      )
    ).toBeInTheDocument()
  })
})
