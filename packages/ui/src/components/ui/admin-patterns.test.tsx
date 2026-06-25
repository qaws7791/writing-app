import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "./button"
import { DataTable, DataTableContainer } from "./data-table"
import { EmptyState } from "./empty-state"
import {
  FilterToolbar,
  FilterToolbarField,
  FilterToolbarLabel,
} from "./filter-toolbar"
import { PageHeader } from "./page-header"
import { SectionHeader } from "./section-header"
import { StatCard, StatGrid } from "./stat-card"

describe("admin-oriented layout patterns", () => {
  it("renders page and section headings with optional actions", () => {
    render(
      <>
        <PageHeader
          title="콘텐츠 관리"
          description="코스를 검색하고 관리합니다."
          actions={<Button>새 코스</Button>}
        />
        <SectionHeader title="코스 목록" description="총 3개" />
      </>
    )

    expect(
      screen.getByRole("heading", { level: 1, name: "콘텐츠 관리" })
    ).toBeInTheDocument()
    expect(screen.getByText("코스를 검색하고 관리합니다.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "새 코스" })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 2, name: "코스 목록" })
    ).toBeInTheDocument()
  })

  it("keeps metric card content explicit", () => {
    render(
      <StatGrid aria-label="주요 지표">
        <StatCard label="총 사용자" value="1,230" detail="최근 7일 활성 42명" />
      </StatGrid>
    )

    const region = screen.getByRole("region", { name: "주요 지표" })

    expect(within(region).getByText("총 사용자")).toBeInTheDocument()
    expect(within(region).getByText("1,230")).toBeInTheDocument()
    expect(within(region).getByText("최근 7일 활성 42명")).toBeInTheDocument()
  })

  it("renders table and toolbar anatomy without app-specific classes", () => {
    render(
      <>
        <FilterToolbar aria-label="코스 필터">
          <FilterToolbarField>
            <FilterToolbarLabel>검색</FilterToolbarLabel>
            <input aria-label="검색" />
          </FilterToolbarField>
        </FilterToolbar>
        <DataTableContainer>
          <DataTable>
            <thead>
              <tr>
                <th scope="col">코스</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>문장 기초</td>
              </tr>
            </tbody>
          </DataTable>
        </DataTableContainer>
      </>
    )

    expect(screen.getByRole("form", { name: "코스 필터" })).toHaveAttribute(
      "data-slot",
      "filter-toolbar"
    )
    expect(screen.getByRole("table")).toHaveAttribute("data-slot", "data-table")
  })

  it("renders empty state title, description, and action", () => {
    render(
      <EmptyState
        title="표시할 항목이 없습니다"
        description="필터를 조정해 다시 확인하세요."
        actions={<Button variant="outline">초기화</Button>}
      />
    )

    expect(screen.getByText("표시할 항목이 없습니다")).toBeInTheDocument()
    expect(
      screen.getByText("필터를 조정해 다시 확인하세요.")
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "초기화" })).toBeInTheDocument()
  })
})
