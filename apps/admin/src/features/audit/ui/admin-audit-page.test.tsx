// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type {
  AdminAuditEvents,
  ReadAdminAuditEventsInput,
} from "@/entities/admin-audit/model/admin-audit"
import { AdminAuditPage } from "@/features/audit/ui/admin-audit-page"
import type {
  AdminRequestError,
  AdminRequestResult,
} from "@/shared/http/admin-api-client"

const events: AdminAuditEvents = {
  items: [
    {
      action: "learner.detail.read",
      actorId: "admin-1",
      category: "privacy-access",
      clientIp: null,
      createdAt: "2026-07-31T02:30:00.000Z",
      id: "audit-1",
      outcome: "succeeded",
      requestId: "req-1",
      retentionUntil: "2027-07-31T02:30:00.000Z",
      target: { id: "learner-1", type: "learner" },
    },
    {
      action: "course.publish",
      actorId: "admin-1",
      category: "content-mutation",
      clientIp: null,
      createdAt: "2026-07-31T03:00:00.000Z",
      id: "audit-2",
      outcome: "started",
      requestId: "req-2",
      retentionUntil: "2027-07-31T03:00:00.000Z",
      target: { id: "course-1", type: "course" },
    },
  ],
  pagination: { page: 1, pageSize: 50, totalItems: 2, totalPages: 1 },
}

const filters: ReadAdminAuditEventsInput = {
  category: "",
  from: "",
  page: 1,
  pageSize: 50,
  to: "",
}

describe("AdminAuditPage", () => {
  it("작업·대상·결과를 한국어로 옮기고 원문 식별자를 노출하지 않는다", () => {
    render(<AdminAuditPage auditResult={ok(events)} filters={filters} />)

    const table = within(screen.getByRole("table", { name: "감사 이력" }))
    expect(table.getByText("학습자 상세 조회")).toBeVisible()
    expect(table.getByText("커리큘럼 발행")).toBeVisible()
    expect(table.getByText("학습자")).toBeVisible()
    expect(table.getByText("성공")).toBeVisible()
    expect(table.getByText("진행 중")).toBeVisible()
    expect(table.getByText("req-1")).toBeVisible()
    expect(table.queryByText("learner-1")).not.toBeInTheDocument()
    expect(table.queryByText("admin-1")).not.toBeInTheDocument()
  })

  it("이력이 없으면 빈 상태를 보여준다", () => {
    render(
      <AdminAuditPage
        auditResult={ok({
          items: [],
          pagination: { page: 1, pageSize: 50, totalItems: 0, totalPages: 1 },
        })}
        filters={filters}
      />
    )

    expect(screen.getByText("아직 감사 이력이 없습니다.")).toBeVisible()
  })

  it("조회 실패는 오류로 표시하고 표를 열지 않는다", () => {
    render(
      <AdminAuditPage
        auditResult={{ error: networkError(), status: "error" }}
        filters={filters}
      />
    )

    expect(screen.getByRole("alert")).toHaveTextContent(
      "네트워크 연결을 확인해 주세요."
    )
    expect(
      screen.queryByRole("table", { name: "감사 이력" })
    ).not.toBeInTheDocument()
  })
})

function ok<TValue>(value: TValue): AdminRequestResult<TValue> {
  return { status: "ok", value }
}

function networkError() {
  return {
    code: "NETWORK_ERROR",
    kind: "network",
    message: "네트워크 연결을 확인해 주세요.",
    requestId: "client",
    retryAfterSeconds: null,
    status: null,
  } satisfies AdminRequestError
}
