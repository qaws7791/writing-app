import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import {
  type FlushPendingWritingResult,
  useEditorLeaveGuard,
} from "./use-editor-leave-guard"

function LeaveGuardHarness({
  flushPendingWriting,
  hasPendingChanges,
  navigate,
  pathname = "/writing/1",
}: {
  flushPendingWriting: () => Promise<FlushPendingWritingResult>
  hasPendingChanges: boolean
  navigate: (href: string) => void
  pathname?: string
}) {
  const {
    cancelPendingNavigation,
    confirmPendingNavigation,
    isLeaveConfirmOpen,
  } = useEditorLeaveGuard({
    flushPendingWriting,
    hasPendingChanges,
    navigate,
    pathname,
  })

  return (
    <div>
      <a href="/writing" onClick={(event) => event.preventDefault()}>
        내 글
      </a>
      <a href="/writing/1#editor" onClick={(event) => event.preventDefault()}>
        현재 해시
      </a>
      <a href="https://example.com" onClick={(event) => event.preventDefault()}>
        외부 이동
      </a>
      {isLeaveConfirmOpen ? (
        <div>
          <button type="button" onClick={cancelPendingNavigation}>
            계속 작성
          </button>
          <button type="button" onClick={confirmPendingNavigation}>
            나가기
          </button>
        </div>
      ) : null}
    </div>
  )
}

describe("useEditorLeaveGuard", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/writing/1")
  })

  test("does not intercept clean internal navigation", async () => {
    const user = userEvent.setup()
    const flushPendingWriting =
      vi.fn<() => Promise<FlushPendingWritingResult>>()
    const navigate = vi.fn()

    render(
      <LeaveGuardHarness
        flushPendingWriting={flushPendingWriting}
        hasPendingChanges={false}
        navigate={navigate}
      />
    )

    await user.click(screen.getByRole("link", { name: "내 글" }))

    expect(flushPendingWriting).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  test("flushes and navigates on dirty internal navigation", async () => {
    const user = userEvent.setup()
    const flushPendingWriting = vi
      .fn<() => Promise<FlushPendingWritingResult>>()
      .mockResolvedValue("saved")
    const navigate = vi.fn()

    render(
      <LeaveGuardHarness
        flushPendingWriting={flushPendingWriting}
        hasPendingChanges
        navigate={navigate}
      />
    )

    await user.click(screen.getByRole("link", { name: "내 글" }))

    await waitFor(() => {
      expect(flushPendingWriting).toHaveBeenCalledTimes(1)
    })
    expect(navigate).toHaveBeenCalledWith("/writing")
  })

  test("opens a confirmation dialog when leave flush is blocked", async () => {
    const user = userEvent.setup()
    const flushPendingWriting = vi
      .fn<() => Promise<FlushPendingWritingResult>>()
      .mockResolvedValue("blocked")
    const navigate = vi.fn()

    render(
      <LeaveGuardHarness
        flushPendingWriting={flushPendingWriting}
        hasPendingChanges
        navigate={navigate}
      />
    )

    await user.click(screen.getByRole("link", { name: "내 글" }))

    expect(await screen.findByRole("button", { name: "나가기" })).toBeVisible()
    expect(navigate).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "계속 작성" }))
    expect(navigate).not.toHaveBeenCalled()

    await user.click(screen.getByRole("link", { name: "내 글" }))
    await user.click(await screen.findByRole("button", { name: "나가기" }))
    expect(navigate).toHaveBeenCalledWith("/writing")
  })

  test("registers beforeunload while there are pending changes", async () => {
    const flushPendingWriting = vi
      .fn<() => Promise<FlushPendingWritingResult>>()
      .mockResolvedValue("saved")
    const navigate = vi.fn()

    render(
      <LeaveGuardHarness
        flushPendingWriting={flushPendingWriting}
        hasPendingChanges
        navigate={navigate}
      />
    )

    const event = new Event("beforeunload", { cancelable: true })
    const dispatchResult = window.dispatchEvent(event)

    expect(dispatchResult).toBe(false)
    await waitFor(() => {
      expect(flushPendingWriting).toHaveBeenCalledTimes(1)
    })
  })

  test("does not warn on beforeunload after rerendering to a clean state", async () => {
    const flushPendingWriting = vi
      .fn<() => Promise<FlushPendingWritingResult>>()
      .mockResolvedValue("saved")
    const navigate = vi.fn()

    const { rerender } = render(
      <LeaveGuardHarness
        flushPendingWriting={flushPendingWriting}
        hasPendingChanges
        navigate={navigate}
      />
    )

    rerender(
      <LeaveGuardHarness
        flushPendingWriting={flushPendingWriting}
        hasPendingChanges={false}
        navigate={navigate}
      />
    )

    const event = new Event("beforeunload", { cancelable: true })
    const dispatchResult = window.dispatchEvent(event)

    expect(dispatchResult).toBe(true)
    expect(flushPendingWriting).not.toHaveBeenCalled()
  })

  test("ignores modified, external, and same-document link clicks", async () => {
    const flushPendingWriting = vi
      .fn<() => Promise<FlushPendingWritingResult>>()
      .mockResolvedValue("saved")
    const navigate = vi.fn()

    render(
      <LeaveGuardHarness
        flushPendingWriting={flushPendingWriting}
        hasPendingChanges
        navigate={navigate}
      />
    )

    fireEvent.click(screen.getByRole("link", { name: "외부 이동" }))
    fireEvent.click(screen.getByRole("link", { name: "내 글" }), {
      ctrlKey: true,
    })
    fireEvent.click(screen.getByRole("link", { name: "현재 해시" }))

    expect(flushPendingWriting).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  test("routes popstate through the leave flow when dirty", async () => {
    const flushPendingWriting = vi
      .fn<() => Promise<FlushPendingWritingResult>>()
      .mockResolvedValue("blocked")
    const navigate = vi.fn()

    render(
      <LeaveGuardHarness
        flushPendingWriting={flushPendingWriting}
        hasPendingChanges
        navigate={navigate}
      />
    )

    window.dispatchEvent(new PopStateEvent("popstate"))

    await waitFor(() => {
      expect(flushPendingWriting).toHaveBeenCalledTimes(1)
    })
    expect(screen.getByRole("button", { name: "나가기" })).toBeVisible()
  })
})
