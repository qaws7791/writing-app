import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ResourceWorkspace } from "@/features/resource-library/ui/resource-workspace"
import type { AdminApiBaseUrl } from "@/shared/config/admin-api-url"

const { getResourceTreeMock, pushMock } = vi.hoisted(() => ({
  getResourceTreeMock: vi.fn(async () => ({
    status: "ok" as const,
    value: { nodes: [] },
  })),
  pushMock: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/resources/trash",
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}))

vi.mock("@/features/resource-library/api/resource-library-api", () => ({
  createBrowserResourceLibraryApi: () => ({
    getResourceTree: getResourceTreeMock,
  }),
}))

describe("ResourceWorkspace", () => {
  it("URL에 맞는 휴지통 범위를 표시하고 탭 이동을 URL에 반영한다", async () => {
    const user = userEvent.setup()

    render(
      <ResourceWorkspace
        apiBaseUrl={"https://admin-api.example.test" as AdminApiBaseUrl}
        initialScope="trash"
        initialTree={{
          nodes: [
            {
              hasChildren: false,
              id: "trashed-document",
              kind: "document",
              name: "삭제된 문서",
              parentId: null,
              status: "trashed",
            },
          ],
        }}
      >
        <h1>휴지통</h1>
      </ResourceWorkspace>
    )

    expect(screen.getByRole("button", { name: "휴지통" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: "자료" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
    expect(screen.getByRole("button", { name: "새 폴더" })).toBeDisabled()
    expect(screen.getByText("삭제된 문서")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "자료" }))

    expect(pushMock).toHaveBeenCalledWith("/resources")
  })
})
