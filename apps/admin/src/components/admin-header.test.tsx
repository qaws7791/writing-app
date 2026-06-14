import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdminHeader } from "@/components/admin-header"

describe("AdminHeader", () => {
  it("현재 화면 제목과 관리자 상태를 보여준다", () => {
    render(
      <AdminHeader description="콘텐츠를 관리합니다." title="콘텐츠 관리" />
    )

    expect(
      screen.getByRole("heading", { name: "콘텐츠 관리" })
    ).toBeInTheDocument()
    expect(screen.getByText("콘텐츠를 관리합니다.")).toBeInTheDocument()
    expect(screen.getByText("관리자 세션")).toBeInTheDocument()
  })
})
