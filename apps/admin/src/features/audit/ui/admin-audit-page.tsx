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
import { AdminPageHeader } from "@/shared/ui/admin-page-header"
import { adminAuditCategorySchema } from "@workspace/contracts/operations/admin-audit"
import {
  Alert,
  AlertDescription,
} from "@workspace/ui/components/primitives/alert"
import { Badge } from "@workspace/ui/components/primitives/badge"
import { Button } from "@workspace/ui/components/primitives/button"
import { Card } from "@workspace/ui/components/primitives/card"
import { Field, FieldLabel } from "@workspace/ui/components/primitives/field"
import { Input } from "@workspace/ui/components/primitives/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/primitives/table"

const outcomeBadgeVariants = {
  danger: "destructive",
  neutral: "secondary",
  success: "success",
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
      <AdminPageHeader description="개인정보 조회와 고위험 변경 이력을 최신순으로 확인합니다." />
      <AuditFilterForm filters={filters} />
      {auditResult.status === "error" ? (
        <Alert role="alert" variant="destructive">
          <AlertDescription>{auditResult.error.message}</AlertDescription>
        </Alert>
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <div className="overflow-x-auto">
            <Table aria-label="감사 이력" className="min-w-220">
              <TableHeader>
                <TableRow>
                  <TableHeading>실행 시각</TableHeading>
                  <TableHeading>작업</TableHeading>
                  <TableHeading>대상</TableHeading>
                  <TableHeading>결과</TableHeading>
                  <TableHeading>요청 출처</TableHeading>
                  <TableHeading>요청 식별자</TableHeading>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditResult.value.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="px-4 py-10 text-center font-semibold text-muted-foreground"
                      colSpan={6}
                    >
                      {hasAuditFilter(filters)
                        ? "조건에 맞는 감사 이력이 없습니다."
                        : "아직 감사 이력이 없습니다."}
                    </TableCell>
                  </TableRow>
                ) : (
                  auditResult.value.items.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="px-4 py-3 font-semibold whitespace-nowrap">
                        {formatAuditTime(event.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-semibold">
                        {readAuditActionLabel(event.action)}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-semibold">
                        {readAuditTargetLabel(event.target)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant={
                            outcomeBadgeVariants[
                              readAuditOutcomeTone(event.outcome)
                            ]
                          }
                        >
                          {readAuditOutcomeLabel(event.outcome)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {event.mcp === null ? (
                          <span className="font-medium text-muted-foreground">
                            관리자 화면
                          </span>
                        ) : (
                          <div className="flex min-w-36 flex-col items-start gap-1">
                            <Badge variant="purple">
                              {event.mcp.approvalId === null
                                ? "MCP 자동"
                                : "MCP 승인"}
                            </Badge>
                            <span className="text-xs font-medium text-muted-foreground">
                              {event.mcp.mcpCredentialId}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                              {event.mcp.executionId}
                            </span>
                            {event.mcp.approvalId === null ? null : (
                              <Link
                                className="text-xs font-semibold underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground/70"
                                href={`/mcp-approvals/${event.mcp.approvalId}`}
                              >
                                승인 요청 보기
                              </Link>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-medium whitespace-nowrap text-muted-foreground">
                        {event.requestId}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <AuditPagination
            filters={filters}
            pagination={auditResult.value.pagination}
          />
        </Card>
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
      <Field className="w-auto">
        <FieldLabel htmlFor="audit-from">시작일</FieldLabel>
        <Input
          id="audit-from"
          defaultValue={filters.from}
          name="from"
          type="date"
        />
      </Field>
      <Field className="w-auto">
        <FieldLabel htmlFor="audit-to">종료일</FieldLabel>
        <Input id="audit-to" defaultValue={filters.to} name="to" type="date" />
      </Field>
      <Field className="w-auto">
        <FieldLabel htmlFor="audit-category">작업 종류</FieldLabel>
        <select
          className="h-10 rounded-2xl border border-border/70 bg-input/35 px-4 text-sm font-medium shadow-2xs outline-none hover:border-border focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25"
          defaultValue={filters.category}
          id="audit-category"
          name="category"
        >
          <option value="">전체 종류</option>
          {adminAuditCategorySchema.options.map((category) => (
            <option key={category} value={category}>
              {readAuditCategoryLabel(category)}
            </option>
          ))}
        </select>
      </Field>
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
      className="flex items-center justify-end gap-3 p-4"
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
    <TableHead
      className="px-4 py-3 text-left text-xs font-semibold"
      scope="col"
    >
      {children}
    </TableHead>
  )
}

function formatAuditTime(value: string): string {
  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  })
}
