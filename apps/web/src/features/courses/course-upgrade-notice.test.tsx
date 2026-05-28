import * as React from "react"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CourseUpgradeNotice } from "@/features/courses/course-upgrade-notice"
import type { CurriculumUpgradeNotice } from "@/lib/api/writing-app-api"

const refresh = vi.fn()
const applyCurriculumUpgrade = vi.fn()
const dismissCurriculumUpgrade = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}))

vi.mock("@/lib/api/get-browser-writing-app-api", () => ({
  getBrowserWritingAppApi: () => ({
    applyCurriculumUpgrade,
    dismissCurriculumUpgrade,
  }),
}))

vi.mock("@workspace/ui/components/ui/button", () => ({
  Button: ({
    children,
    disabled,
    onClick,
  }: React.PropsWithChildren<{
    disabled?: boolean
    onClick?: () => void
  }>) => (
    <button type="button" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}))

vi.mock("@workspace/ui/components/icons", () => ({
  SparklesIcon: () => <span aria-hidden="true" />,
}))

const upgrade = {
  completedCount: 1,
  courseId: "sentence-structure" as never,
  fromVersion: {
    id: "sentence-structure-v1",
    title: "문장 구조의 기본",
    versionNumber: 1,
  },
  message: "새 커리큘럼에는 새 예제와 복습 경로를 추가했습니다.",
  migrationId: "sentence-structure-v1-to-sentence-structure-v2",
  status: "available",
  toVersion: {
    changelog: "새 예제와 복습 경로를 추가했습니다.",
    id: "sentence-structure-v2",
    title: "문장 구조의 기본 v2",
    versionNumber: 2,
  },
  totalLessons: 12,
} satisfies Extract<CurriculumUpgradeNotice, { status: "available" }>

afterEach(() => {
  cleanup()
  refresh.mockReset()
  applyCurriculumUpgrade.mockReset()
  dismissCurriculumUpgrade.mockReset()
})

describe("CourseUpgradeNotice", () => {
  it("hides itself after dismissing the upgrade notice", async () => {
    dismissCurriculumUpgrade.mockResolvedValue({
      status: "ok",
      value: {
        courseId: "sentence-structure",
        dismissedAt: "2026-05-28T00:00:00.000Z",
        fromVersionId: "sentence-structure-v1",
        status: "dismissed",
        toVersionId: "sentence-structure-v2",
      },
    })

    render(<CourseUpgradeNotice upgrade={upgrade} />)

    await userEvent.click(screen.getByRole("button", { name: "나중에 결정" }))

    await waitFor(() => {
      expect(screen.queryByText("새 커리큘럼이 도착했습니다")).toBeNull()
    })
    expect(dismissCurriculumUpgrade).toHaveBeenCalledWith("sentence-structure")
    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
