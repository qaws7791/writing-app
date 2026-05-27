import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { AdminUserListDto } from "@workspace/core/admin"

import { AdminUsersPage } from "@/features/users/admin-users-page"

type DivProps = React.ComponentProps<"div">
type SpanProps = React.ComponentProps<"span">
type TableProps = React.ComponentProps<"table">
type TableBodyProps = React.ComponentProps<"tbody">
type TableCellProps = React.ComponentProps<"td">
type TableHeadProps = React.ComponentProps<"th">
type TableHeaderProps = React.ComponentProps<"thead">
type TableRowProps = React.ComponentProps<"tr">

vi.mock("@workspace/ui/components/ui/badge", async () => {
  const ReactModule = await import("react")

  return {
    Badge: ({ children, ...props }: SpanProps) =>
      ReactModule.createElement("span", props, children),
  }
})

vi.mock("@workspace/ui/components/ui/empty", async () => {
  const ReactModule = await import("react")
  const DivComponent = ({ children, ...props }: DivProps) =>
    ReactModule.createElement("div", props, children)

  return {
    Empty: DivComponent,
    EmptyDescription: DivComponent,
    EmptyHeader: DivComponent,
    EmptyTitle: DivComponent,
  }
})

vi.mock("@workspace/ui/components/ui/table", async () => {
  const ReactModule = await import("react")

  return {
    Table: ({ children, ...props }: TableProps) =>
      ReactModule.createElement("table", props, children),
    TableBody: ({ children, ...props }: TableBodyProps) =>
      ReactModule.createElement("tbody", props, children),
    TableCell: ({ children, ...props }: TableCellProps) =>
      ReactModule.createElement("td", props, children),
    TableHead: ({ children, ...props }: TableHeadProps) =>
      ReactModule.createElement("th", props, children),
    TableHeader: ({ children, ...props }: TableHeaderProps) =>
      ReactModule.createElement("thead", props, children),
    TableRow: ({ children, ...props }: TableRowProps) =>
      ReactModule.createElement("tr", props, children),
  }
})

vi.mock("@/components/admin-header", async () => {
  const ReactModule = await import("react")

  return {
    AdminHeader: ({
      description,
      title,
    }: {
      description?: string
      title: string
    }) =>
      ReactModule.createElement("header", null, [
        ReactModule.createElement("h1", { key: "title" }, title),
        description
          ? ReactModule.createElement("p", { key: "description" }, description)
          : null,
      ]),
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("AdminUsersPage", () => {
  it("renders user name, email, verification status, and joined date", () => {
    const createdAt = "2026-05-20T09:00:00.000Z"
    const users: AdminUserListDto["users"] = [
      {
        id: "user-1",
        name: "김관리",
        email: "user@example.com",
        emailVerified: true,
        image: null,
        createdAt,
        updatedAt: "2026-05-21T09:00:00.000Z",
      },
    ]

    render(<AdminUsersPage users={users} />)

    expect(screen.getByRole("heading", { name: "사용자" })).toBeTruthy()
    expect(
      screen.getByText(
        "학습자 계정의 기본 정보와 이메일 인증 상태를 확인합니다."
      )
    ).toBeTruthy()
    expect(screen.getByText("김관리")).toBeTruthy()
    expect(screen.getByText("user@example.com")).toBeTruthy()
    expect(screen.getByText("인증됨")).toBeTruthy()
    expect(
      screen.getByText(
        new Intl.DateTimeFormat("ko-KR").format(new Date(createdAt))
      )
    ).toBeTruthy()
  })

  it("renders an accessible empty state when there are no users", () => {
    render(<AdminUsersPage users={[]} />)

    expect(screen.getByRole("status", { name: "사용자 없음" })).toBeTruthy()
    expect(screen.getByText("조회할 사용자가 없습니다.")).toBeTruthy()
  })
})
