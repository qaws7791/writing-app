import Link from "next/link"

import type {
  AdminAuditEvents,
  ReadAdminAuditEventsInput,
} from "@/entities/admin-audit/model/admin-audit"
import {
  readAuditActionLabel,
  readAuditCategoryLabel,
  readAuditOutcomeLabel,
  readAuditOutcomeTone,
  readAuditTargetLabel,
} from "@/features/audit/model/admin-audit-presentation"
import { createGetFilterHref } from "@/shared/navigation/get-filter-url"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import { adminAuditCategorySchema } from "@workspace/contracts/operations/admin-audit"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import {
  FilterToolbarField,
  FilterToolbarLabel,
} from "@workspace/ui/components/ui/filter-toolbar"
import { Input } from "@workspace/ui/components/ui/input"
import { PageHeader } from "@workspace/ui/components/ui/page-header"
import { Surface } from "@workspace/ui/components/ui/surface"
import { cn } from "@workspace/ui/lib/utils"

const outcomeToneClassNames = {
  danger: "bg-danger text-danger-foreground",
  neutral: "bg-surface text-muted-foreground",
  success: "bg-success text-success-foreground",
} as const

export function AdminAuditPage({
  auditResult,
  filters,
}: {
  readonly auditResult: AdminRequestResult<AdminAuditEvents>
  readonly filters: ReadAdminAuditEventsInput
}) {
  return (
    <>
      <PageHeader
        description="개인정보 조회와 고위험 변경 이력을 최신순으로 확인합니다."
        title="감사 이력"
      />
      <AuditFilterForm filters={filters} />
      {auditResult.status === "error" ? (
        <Alert role="alert" tone="danger">
          <AlertDescription>{auditResult.error.message}</AlertDescription>
        </Alert>
      ) : (
        <Surface variant="panel">
          <div className="overflow-x-auto">
            <table
              aria-label="감사 이력"
              className="w-full min-w-180 text-body-sm"
            >
              <thead>
                <tr className="border-b border-border">
                  <TableHeading>실행 시각</TableHeading>
                  <TableHeading>작업</TableHeading>
                  <TableHeading>대상</TableHeading>
                  <TableHeading>결과</TableHeading>
                  <TableHeading>요청 식별자</TableHeading>
                </tr>
              </thead>
              <tbody>
                {auditResult.value.items.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-10 text-center font-semibold text-muted-foreground"
                      colSpan={5}
                    >
                      {hasAuditFilter(filters)
                        ? "조건에 맞는 감사 이력이 없습니다."
                        : "아직 감사 이력이 없습니다."}
                    </td>
                  </tr>
                ) : (
                  auditResult.value.items.map((event) => (
                    <tr className="border-b border-border/60" key={event.id}>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">
                        {formatAuditTime(event.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {readAuditActionLabel(event.action)}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {readAuditTargetLabel(event.target)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-[0.75rem] font-bold",
                            outcomeToneClassNames[
                              readAuditOutcomeTone(event.outcome)
                            ]
                          )}
                        >
                          {readAuditOutcomeLabel(event.outcome)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap text-muted-foreground">
                        {event.requestId}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <AuditPagination
            filters={filters}
            pagination={auditResult.value.pagination}
          />
        </Surface>
      )}
    </>
  )
}

function hasAuditFilter(filters: ReadAdminAuditEventsInput): boolean {
  return filters.category !== "" || filters.from !== "" || filters.to !== ""
}

function AuditFilterForm({
  filters,
}: {
  readonly filters: ReadAdminAuditEventsInput
}) {
  return (
    <form
      aria-label="감사 이력 필터"
      className="mb-4 flex flex-wrap items-end gap-3"
      method="get"
    >
      <input name="page" type="hidden" value="1" />
      <FilterToolbarField className="gap-1">
        <FilterToolbarLabel>시작일</FilterToolbarLabel>
        <Input defaultValue={filters.from} name="from" type="date" />
      </FilterToolbarField>
      <FilterToolbarField className="gap-1">
        <FilterToolbarLabel>종료일</FilterToolbarLabel>
        <Input defaultValue={filters.to} name="to" type="date" />
      </FilterToolbarField>
      <FilterToolbarField className="gap-1">
        <FilterToolbarLabel>작업 종류</FilterToolbarLabel>
        <select
          className="h-10 rounded-xl border border-border bg-background px-3 font-semibold"
          defaultValue={filters.category}
          name="category"
        >
          <option value="">전체 종류</option>
          {adminAuditCategorySchema.options.map((category) => (
            <option key={category} value={category}>
              {readAuditCategoryLabel(category)}
            </option>
          ))}
        </select>
      </FilterToolbarField>
      <Button type="submit" variant="outline">
        조회
      </Button>
    </form>
  )
}

function AuditPagination({
  filters,
  pagination,
}: {
  readonly filters: ReadAdminAuditEventsInput
  readonly pagination: AdminAuditEvents["pagination"]
}) {
  if (pagination.totalPages <= 1) return null

  const pageHref = (page: number) =>
    createGetFilterHref(
      [
        ["from", filters.from],
        ["to", filters.to],
        ["category", filters.category],
        ["pageSize", filters.pageSize],
      ],
      { page }
    )

  return (
    <nav
      aria-label="감사 이력 페이지"
      className="mt-4 flex items-center justify-end gap-3"
    >
      {pagination.page > 1 ? (
        <Link className="font-bold" href={pageHref(pagination.page - 1)}>
          이전 페이지
        </Link>
      ) : null}
      <span className="text-sm font-bold text-muted-foreground">
        {pagination.page} / {pagination.totalPages}
      </span>
      {pagination.page < pagination.totalPages ? (
        <Link className="font-bold" href={pageHref(pagination.page + 1)}>
          다음 페이지
        </Link>
      ) : null}
    </nav>
  )
}

function TableHeading({ children }: { readonly children: string }) {
  return (
    <th
      className="px-4 py-3 text-left text-label-sm font-bold text-muted-foreground"
      scope="col"
    >
      {children}
    </th>
  )
}

function formatAuditTime(value: string): string {
  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  })
}
