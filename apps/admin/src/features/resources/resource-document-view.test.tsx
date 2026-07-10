import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ResourceDocumentView } from "@/features/resources/resource-document-view"

describe("자료 문서 읽기 화면", () => {
  it("긴 경로를 점진적으로 공개하고 휴지통 문서를 GFM으로 렌더링한다", async () => {
    render(
      <ResourceDocumentView
        document={{
          contentMarkdown: "| 항목 | 값 |\n| --- | --- |\n| 상태 | 완료 |",
          contentRevision: 3,
          createdAt: "2026-07-01T00:00:00.000Z",
          createdBy: {
            email: "creator@example.com",
            id: "admin-1",
            name: "생성 관리자",
          },
          id: "document-1",
          name: "운영 문서",
          parentId: "folder-4",
          path: [
            { id: "folder-1", name: "회사" },
            { id: "folder-2", name: "운영" },
            { id: "folder-3", name: "정책" },
            { id: "folder-4", name: "2026년" },
          ],
          status: "archived",
          updatedAt: "2026-07-09T00:00:00.000Z",
          updatedBy: {
            email: "editor@example.com",
            id: "admin-2",
            name: "수정 관리자",
          },
        }}
      />
    )

    expect(screen.getByRole("heading", { name: "운영 문서" })).toBeVisible()
    expect(screen.getByText("휴지통", { selector: "span" })).toBeVisible()
    expect(screen.getByRole("table")).toBeVisible()
    expect(
      screen.queryByText("운영", { selector: "span" })
    ).not.toBeInTheDocument()

    fireEvent.mouseEnter(
      screen.getByRole("button", { name: "축약된 자료 경로 보기" })
    )

    expect(await screen.findByText("운영", { selector: "span" })).toBeVisible()
    expect(screen.getByText("정책", { selector: "span" })).toBeVisible()
  })
})
