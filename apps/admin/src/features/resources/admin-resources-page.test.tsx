import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  AdminResourceDetailPage,
  AdminResourcesPage,
} from "@/features/resources/admin-resources-page"
import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminDeleteResourceDocumentResult,
  AdminResourceDocumentDetail,
  AdminResourceDocumentList,
  ReadAdminResourcesInput,
} from "@/lib/api/admin-api"

const filters: ReadAdminResourcesInput = {
  page: 1,
  pageSize: 20,
  query: "",
  status: "all",
}

const documentDetail: AdminResourceDocumentDetail = {
  author: {
    email: "admin@example.com",
    id: "admin-1",
    name: "관리자",
  },
  content: {
    content: [
      {
        content: [
          {
            text: "운영 자료 본문",
            type: "text",
          },
        ],
        type: "paragraph",
      },
    ],
    type: "doc",
  },
  createdAt: "2026-06-14T03:00:00.000Z",
  excerpt: "운영 자료 본문",
  id: "resource-1",
  status: "active",
  title: "운영 자료",
  updatedAt: "2026-06-14T03:00:00.000Z",
}

const documents: AdminResourceDocumentList = {
  items: [documentDetail],
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 1,
    totalPages: 1,
  },
}

describe("AdminResourcesPage", () => {
  it("자료 필터, 생성 폼, 목록을 렌더링하고 생성 결과를 알려준다", async () => {
    const user = userEvent.setup()
    const createResourceDocument = vi.fn<
      (
        formData: FormData
      ) => Promise<AdminApiResult<AdminResourceDocumentDetail>>
    >(async () => ok(documentDetail))

    render(
      <AdminResourcesPage
        createResourceDocument={createResourceDocument}
        documentsResult={ok(documents)}
        filters={filters}
      />
    )

    expect(screen.getByRole("heading", { name: "자료실" })).toBeVisible()
    expect(screen.getByLabelText("자료 검색")).toHaveAttribute("name", "query")
    expect(screen.getByLabelText("상태")).toHaveDisplayValue("전체")
    expect(screen.getByLabelText("페이지 크기")).toHaveDisplayValue("20개")

    const item = screen.getByRole("link", { name: /운영 자료/ })
    expect(within(item).getByText("운영 자료 본문")).toBeVisible()
    expect(within(item).getByText("active")).toBeVisible()

    await user.type(screen.getByLabelText("제목"), "운영 자료")
    await user.type(screen.getByLabelText("본문"), "운영 자료 본문")
    await user.click(screen.getByRole("button", { name: "저장" }))

    expect(createResourceDocument).toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.getByText("자료를 저장했습니다.")).toBeVisible()
    )
  })
})

describe("AdminResourceDetailPage", () => {
  it("자료 상세 수정, 보관, 삭제 액션을 제공한다", async () => {
    const user = userEvent.setup()
    const archiveResourceDocument = vi.fn<
      () => Promise<AdminApiResult<{ readonly archived: true }>>
    >(async () => ok({ archived: true }))
    const deleteResourceDocument = vi.fn<
      () => Promise<AdminApiResult<AdminDeleteResourceDocumentResult>>
    >(async () => ok({ deleted: true }))
    const updateResourceDocument = vi.fn<
      (
        formData: FormData
      ) => Promise<AdminApiResult<AdminResourceDocumentDetail>>
    >(async () => ok(documentDetail))

    render(
      <AdminResourceDetailPage
        archiveResourceDocument={archiveResourceDocument}
        deleteResourceDocument={deleteResourceDocument}
        documentResult={ok(documentDetail)}
        updateResourceDocument={updateResourceDocument}
      />
    )

    expect(screen.getByRole("heading", { name: "운영 자료" })).toBeVisible()
    expect(screen.getByLabelText("본문")).toHaveValue("운영 자료 본문")

    await user.click(screen.getByRole("button", { name: "보관" }))
    await waitFor(() =>
      expect(screen.getByText("자료를 보관했습니다.")).toBeVisible()
    )
    expect(archiveResourceDocument).toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "삭제" }))
    await waitFor(() =>
      expect(screen.getByText("자료를 삭제했습니다.")).toBeVisible()
    )
    expect(deleteResourceDocument).toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "저장" }))
    await waitFor(() =>
      expect(screen.getByText("자료를 수정했습니다.")).toBeVisible()
    )
    expect(updateResourceDocument).toHaveBeenCalled()
  })
})

function ok<TValue>(value: TValue): AdminApiResult<TValue> {
  return {
    status: "ok",
    value,
  }
}
