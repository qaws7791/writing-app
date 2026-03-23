import { act, renderHook } from "@testing-library/react"

import { useWritingPage } from "./use-writing-page"
import { createMockRepository } from "@/test-support/mock-repository"
import { createDraftDetail } from "@/test-support/test-fixtures"

const push = vi.fn()

vi.mock("next/navigation", () => ({
  usePathname: () => "/write/1",
  useRouter: () => ({ push }),
}))

const repository = createMockRepository()

vi.mock("@/lib/repository", () => ({
  createAppRepository: () => repository,
}))

vi.mock("@/lib/draft-sync", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/draft-sync")>()
  return {
    ...original,
    consumeRedirectDraftSnapshot: () => null,
  }
})

async function setupLoadedHook() {
  const draft = createDraftDetail({ id: 1 })
  repository.getDraft.mockResolvedValue(draft)

  const hook = renderHook(() => useWritingPage({ draftId: 1 }))

  // flush 마이크로태스크로 loadDraft를 완료
  await act(async () => {})

  return hook
}

describe("useWritingPage autosave", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test("autosave fires after title change", async () => {
    const updatedDraft = createDraftDetail({ id: 1, title: "새 제목" })
    repository.autosaveDraft.mockResolvedValue({
      kind: "autosaved",
      draft: updatedDraft,
    })

    const { result } = await setupLoadedHook()

    expect(result.current.loading).toBe(false)

    // 제목 변경 시뮬레이션
    act(() => {
      result.current.handleTitleInput({
        currentTarget: { textContent: "새 제목" },
      } as unknown as React.FormEvent<HTMLHeadingElement>)
    })

    // 타이머 틱 + 마이크로태스크 flush
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(repository.autosaveDraft).toHaveBeenCalledTimes(1)
    expect(result.current.syncState).toBe("saved")
  })

  test("autosave triggers after noop flush on subsequent timer tick", async () => {
    const updatedDraft = createDraftDetail({ id: 1, title: "수정됨" })
    repository.autosaveDraft.mockResolvedValue({
      kind: "autosaved",
      draft: updatedDraft,
    })

    const { result } = await setupLoadedHook()

    expect(result.current.loading).toBe(false)

    // 변경 없이 첫 번째 타이머 틱 (noop)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(repository.autosaveDraft).not.toHaveBeenCalled()

    // noop 후 제목 변경
    act(() => {
      result.current.handleTitleInput({
        currentTarget: { textContent: "수정됨" },
      } as unknown as React.FormEvent<HTMLHeadingElement>)
    })

    // 다음 타이머 틱 - noop 후에도 autosave가 호출되어야 함
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(repository.autosaveDraft).toHaveBeenCalledTimes(1)
    expect(result.current.syncState).toBe("saved")
  })

  test("multiple autosaves work across timer ticks", async () => {
    repository.autosaveDraft.mockImplementation(async (_id, input) => ({
      kind: "autosaved",
      draft: createDraftDetail({ id: 1, title: input.title ?? "" }),
    }))

    const { result } = await setupLoadedHook()

    // 첫 번째 제목 변경
    act(() => {
      result.current.handleTitleInput({
        currentTarget: { textContent: "제목 1" },
      } as unknown as React.FormEvent<HTMLHeadingElement>)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(repository.autosaveDraft).toHaveBeenCalledTimes(1)

    // noop 틱
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    expect(repository.autosaveDraft).toHaveBeenCalledTimes(1)

    // 두 번째 제목 변경
    act(() => {
      result.current.handleTitleInput({
        currentTarget: { textContent: "제목 2" },
      } as unknown as React.FormEvent<HTMLHeadingElement>)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    // 두 번째 autosave도 호출되어야 함 (ref가 정상 정리됨)
    expect(repository.autosaveDraft).toHaveBeenCalledTimes(2)
  })
})
