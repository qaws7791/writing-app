import Link from "next/link"
import type { ReactNode } from "react"

import { AdminChartPanel } from "@/entities/admin-analytics/ui/admin-chart-panel"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import type { AdminAnalyticsFilters } from "@/features/analytics/model/admin-analytics-filters"
import { createGetFilterHref } from "@/shared/navigation/get-filter-url"
import type {
  AdminAnalytics,
  AdminLessonAnalyticsPage,
} from "@/entities/admin-analytics/model/admin-analytics"
import type { AdminLessonAnalyticsSort } from "@workspace/contracts/operations/analytics-query"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from "@workspace/ui/components/icons"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/ui/empty"
import {
  FilterToolbar,
  FilterToolbarField,
  FilterToolbarLabel,
} from "@workspace/ui/components/ui/filter-toolbar"
import { Input } from "@workspace/ui/components/ui/input"
import { PageHeader } from "@workspace/ui/components/ui/page-header"
import { Surface } from "@workspace/ui/components/ui/surface"
import { Button, buttonVariants } from "@workspace/ui/components/ui/button"

const pageSizeOptions = [10, 20, 50] as const

export function AdminAnalyticsPage({
  analyticsResult,
  filters,
  lessonAnalyticsResult,
}: {
  readonly analyticsResult: AdminRequestResult<AdminAnalytics>
  readonly filters: AdminAnalyticsFilters
  readonly lessonAnalyticsResult: AdminRequestResult<AdminLessonAnalyticsPage>
}) {
  if (analyticsResult.status === "error") {
    return (
      <>
        <AnalyticsHeading />
        <Alert role="alert" tone="danger">
          <AlertDescription>{analyticsResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  const analytics = analyticsResult.value

  return (
    <>
      <AnalyticsHeading analytics={analytics} />
      {analytics.dailySeries.length === 0 ? (
        <AnalyticsEmptyState />
      ) : (
        <>
          <section
            aria-label="핵심 추이"
            className="mb-4 grid gap-4 xl:grid-cols-3"
          >
            <AdminChartPanel
              data={analytics.dailySeries}
              kind="signup-activation"
            />
            <AdminChartPanel
              data={analytics.dailySeries}
              kind="start-completion"
            />
            <AdminChartPanel data={analytics.dailySeries} kind="d7-return" />
          </section>
          <DailyAnalyticsTable analytics={analytics} />
        </>
      )}
      <WorstLessonsTable lessons={analytics.worstLessons} />
      <WorstAiFeedbackLessonsTable lessons={analytics.worstAiFeedbackLessons} />
      {lessonAnalyticsResult.status === "error" ? (
        <LessonAnalyticsError message={lessonAnalyticsResult.error.message} />
      ) : (
        <LessonAnalyticsTable
          filters={filters}
          page={lessonAnalyticsResult.value}
        />
      )}
    </>
  )
}

function AnalyticsHeading({
  analytics,
}: {
  readonly analytics?: AdminAnalytics
}) {
  return (
    <PageHeader
      description={
        analytics === undefined
          ? "가입, 첫 시작, 완료와 D7 재방문을 분석합니다."
          : `${analytics.from}–${analytics.to} · D7 성숙 cohort ${analytics.matureCohortThrough}까지`
      }
      title="분석"
    />
  )
}

function AnalyticsEmptyState() {
  return (
    <Surface className="mb-4" variant="panel">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>표시할 일별 분석 데이터가 없습니다.</EmptyTitle>
          <EmptyDescription>
            학습자 활동이 기록되면 가입·첫 시작·완료·재방문 추이를 표시합니다.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </Surface>
  )
}

function DailyAnalyticsTable({
  analytics,
}: {
  readonly analytics: AdminAnalytics
}) {
  return (
    <Surface className="mb-4" variant="panel">
      <h2 className="m-0 text-title-md font-black">일별 분석 데이터</h2>
      <p className="mt-1 text-body-sm font-semibold text-muted-foreground">
        세 차트와 같은 값을 표로 확인할 수 있습니다.
      </p>
      <div
        className="mt-4 overflow-x-auto"
        data-slot="analytics-data-table-container"
      >
        <table
          aria-label="일별 가입, 첫 시작, 완료와 D7 재방문"
          className="w-full min-w-[720px] text-body-sm"
        >
          <thead>
            <tr className="border-b border-border">
              <TableHeading>날짜</TableHeading>
              <TableHeading>가입</TableHeading>
              <TableHeading>첫 시작</TableHeading>
              <TableHeading>완료</TableHeading>
              <TableHeading>D7 재방문</TableHeading>
            </tr>
          </thead>
          <tbody>
            {analytics.dailySeries.map((point) => (
              <tr
                className="border-b border-border last:border-0"
                key={point.date}
              >
                <th
                  className="px-4 py-3 text-left font-black text-foreground"
                  scope="row"
                >
                  {point.date}
                </th>
                <TableNumber value={`${formatCount(point.signups)}명`} />
                <TableNumber value={`${formatCount(point.starts)}명`} />
                <TableNumber value={`${formatCount(point.completions)}건`} />
                <TableNumber value={formatReturnValue(point)} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Surface>
  )
}

function WorstAiFeedbackLessonsTable({
  lessons,
}: {
  readonly lessons: AdminAnalytics["worstAiFeedbackLessons"]
}) {
  return (
    <Surface className="mb-4" variant="panel">
      <h2 className="m-0 text-title-md font-black">AI 실패율 상위 레슨</h2>
      <p className="mt-1 text-body-sm font-semibold text-muted-foreground">
        조회 기간의 AI 코칭 요청 중 실패 비율이 높은 현재 레슨입니다.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table
          aria-label="AI 실패율 상위 레슨"
          className="w-full min-w-[720px] text-body-sm"
        >
          <thead>
            <tr className="border-b border-border">
              <TableHeading>레슨</TableHeading>
              <TableHeading>강의</TableHeading>
              <TableHeading>요청</TableHeading>
              <TableHeading>실패</TableHeading>
              <TableHeading>실패율</TableHeading>
            </tr>
          </thead>
          <tbody>
            {lessons.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center font-semibold text-muted-foreground"
                  colSpan={5}
                >
                  조회 기간에 AI 실패가 발생한 레슨이 없습니다.
                </td>
              </tr>
            ) : (
              lessons.map((lesson) => (
                <tr
                  className="border-b border-border last:border-0"
                  key={`${lesson.courseId}:${lesson.lessonId}`}
                >
                  <th
                    className="px-4 py-3 text-left font-black text-foreground"
                    scope="row"
                  >
                    {lesson.lessonTitle}
                  </th>
                  <td className="px-4 py-3 font-semibold text-muted-foreground">
                    {lesson.courseTitle}
                  </td>
                  <TableNumber
                    value={`${formatCount(lesson.requestCount)}건`}
                  />
                  <TableNumber
                    value={`${formatCount(lesson.failureCount)}건`}
                  />
                  <TableNumber value={`${lesson.failureRate}%`} />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Surface>
  )
}

function WorstLessonsTable({
  lessons,
}: {
  readonly lessons: AdminAnalytics["worstLessons"]
}) {
  return (
    <Surface className="mb-4" variant="panel">
      <h2 className="m-0 text-title-md font-black">이탈률 상위 레슨</h2>
      <p className="mt-1 text-body-sm font-semibold text-muted-foreground">
        완료율이 낮아 콘텐츠 점검이 우선인 레슨입니다.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table
          aria-label="이탈률 상위 레슨"
          className="w-full min-w-[680px] text-body-sm"
        >
          <thead>
            <tr className="border-b border-border">
              <TableHeading>레슨</TableHeading>
              <TableHeading>강의</TableHeading>
              <TableHeading>시작</TableHeading>
              <TableHeading>완료</TableHeading>
              <TableHeading>이탈률</TableHeading>
            </tr>
          </thead>
          <tbody>
            {lessons.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center font-semibold text-muted-foreground"
                  colSpan={5}
                >
                  표시할 이탈 레슨이 없습니다.
                </td>
              </tr>
            ) : (
              lessons.map((lesson) => (
                <tr
                  className="border-b border-border last:border-0"
                  key={lesson.lessonId}
                >
                  <th
                    className="px-4 py-3 text-left font-black text-foreground"
                    scope="row"
                  >
                    {lesson.lessonTitle}
                  </th>
                  <td className="px-4 py-3 font-semibold text-muted-foreground">
                    {lesson.courseTitle}
                  </td>
                  <TableNumber value={`${formatCount(lesson.started)}명`} />
                  <TableNumber value={`${formatCount(lesson.completed)}명`} />
                  <TableNumber value={`${lesson.dropOffRate}%`} />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Surface>
  )
}

function LessonAnalyticsError({ message }: { readonly message: string }) {
  return (
    <Surface variant="panel">
      <h2 className="m-0 mb-3 text-title-md font-black">레슨별 성과</h2>
      <Alert role="alert" tone="danger">
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </Surface>
  )
}

function LessonAnalyticsTable({
  filters,
  page,
}: {
  readonly filters: AdminAnalyticsFilters
  readonly page: AdminLessonAnalyticsPage
}) {
  const { pagination } = page
  const firstItem =
    pagination.totalItems === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1
  const lastItem = Math.min(
    pagination.page * pagination.pageSize,
    pagination.totalItems
  )

  return (
    <Surface variant="panel">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-title-md font-black">레슨별 성과</h2>
          <p className="mt-1 text-body-sm font-semibold text-muted-foreground">
            시작·완료·완료율·이탈률을 서버 집계로 조회합니다.
          </p>
        </div>
        <span className="text-label-md font-black text-muted-foreground">
          {formatCount(pagination.totalItems)}개
        </span>
      </div>
      <LessonAnalyticsFilter filters={filters} />
      <div
        className="overflow-x-auto"
        data-slot="lesson-analytics-table-container"
      >
        <table
          aria-label="레슨별 성과"
          className="w-full min-w-[880px] text-body-sm"
        >
          <thead>
            <tr className="border-b border-border">
              <SortableHeading filters={filters} label="레슨" sort="lesson" />
              <SortableHeading filters={filters} label="강의" sort="course" />
              <TableHeading>시작</TableHeading>
              <TableHeading>완료</TableHeading>
              <SortableHeading
                filters={filters}
                label="완료율"
                sort="completionRate"
              />
              <SortableHeading
                filters={filters}
                label="이탈률"
                sort="dropOff"
              />
            </tr>
          </thead>
          <tbody>
            {page.items.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center font-semibold text-muted-foreground"
                  colSpan={6}
                >
                  검색 조건에 맞는 레슨이 없습니다.
                </td>
              </tr>
            ) : (
              page.items.map((lesson) => (
                <tr
                  className="border-b border-border last:border-0"
                  key={lesson.lessonId}
                >
                  <th
                    className="px-4 py-3 text-left font-black text-foreground"
                    scope="row"
                  >
                    {lesson.lessonTitle}
                  </th>
                  <td className="px-4 py-3 font-semibold text-muted-foreground">
                    {lesson.courseTitle}
                  </td>
                  <TableNumber value={`${formatCount(lesson.started)}명`} />
                  <TableNumber value={`${formatCount(lesson.completed)}명`} />
                  <TableNumber value={`${lesson.completionRate}%`} />
                  <TableNumber value={`${lesson.dropOffRate}%`} />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination.totalPages === 0 ? null : (
        <nav
          aria-label="레슨 분석 페이지"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
        >
          <span className="text-label-md font-bold text-muted-foreground">
            {formatCount(pagination.totalItems)}개 중 {formatCount(firstItem)}–
            {formatCount(lastItem)}
          </span>
          <div className="flex items-center gap-2">
            <PaginationLink
              disabled={pagination.page <= 1}
              href={createAnalyticsHref(filters, {
                page: Math.max(1, pagination.page - 1),
              })}
              label="이전 페이지"
            >
              <ChevronLeftIcon aria-hidden="true" size={16} />
            </PaginationLink>
            <span className="min-w-20 text-center text-label-md font-black">
              {pagination.page} / {pagination.totalPages}
            </span>
            <PaginationLink
              disabled={pagination.page >= pagination.totalPages}
              href={createAnalyticsHref(filters, {
                page: Math.min(pagination.totalPages, pagination.page + 1),
              })}
              label="다음 페이지"
            >
              <ChevronRightIcon aria-hidden="true" size={16} />
            </PaginationLink>
          </div>
        </nav>
      )}
    </Surface>
  )
}

function LessonAnalyticsFilter({
  filters,
}: {
  readonly filters: AdminAnalyticsFilters
}) {
  return (
    <FilterToolbar
      aria-label="레슨 분석 필터"
      className="grid-cols-[minmax(220px,1fr)_160px_auto_auto] max-lg:grid-cols-1"
      method="get"
    >
      <input name="direction" type="hidden" value={filters.direction} />
      <input name="page" type="hidden" value="1" />
      <input name="sort" type="hidden" value={filters.sort} />
      <FilterToolbarField className="relative">
        <FilterToolbarLabel>레슨 또는 강의 검색</FilterToolbarLabel>
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 left-3.5 text-muted-foreground"
          size={16}
        />
        <Input
          aria-label="레슨 또는 강의 검색"
          className="pl-10 font-semibold"
          defaultValue={filters.query}
          name="query"
          placeholder="검색어 입력"
        />
      </FilterToolbarField>
      <FilterToolbarField>
        <FilterToolbarLabel>페이지당 행</FilterToolbarLabel>
        <select
          aria-label="페이지당 행"
          className="h-11 rounded-control border border-field-border bg-transparent px-4 text-body-sm font-semibold text-foreground focus-visible:ring-3 focus-visible:ring-focus"
          defaultValue={filters.pageSize}
          name="pageSize"
        >
          {pageSizeOptions.map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize}개
            </option>
          ))}
        </select>
      </FilterToolbarField>
      <Button type="submit" variant="outline">
        조회
      </Button>
      <Link
        className={buttonVariants({ size: "default", variant: "ghost" })}
        href="/analytics"
      >
        초기화
      </Link>
    </FilterToolbar>
  )
}

function SortableHeading({
  filters,
  label,
  sort,
}: {
  readonly filters: AdminAnalyticsFilters
  readonly label: string
  readonly sort: AdminLessonAnalyticsSort
}) {
  const active = filters.sort === sort
  const nextDirection = active && filters.direction === "asc" ? "desc" : "asc"

  return (
    <th
      aria-sort={
        active
          ? filters.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      className="px-4 py-3 text-left"
      scope="col"
    >
      <Link
        aria-label={`${label} ${nextDirection === "asc" ? "오름차순" : "내림차순"} 정렬`}
        className="inline-flex items-center gap-1 font-black text-muted-foreground hover:text-foreground"
        href={createAnalyticsHref(filters, {
          direction: nextDirection,
          page: 1,
          sort,
        })}
      >
        {label}
        {active ? (
          <ChevronDownIcon
            aria-hidden="true"
            className={filters.direction === "asc" ? "rotate-180" : undefined}
            size={14}
          />
        ) : null}
      </Link>
    </th>
  )
}

function PaginationLink({
  children,
  disabled,
  href,
  label,
}: {
  readonly children: ReactNode
  readonly disabled: boolean
  readonly href: string
  readonly label: string
}) {
  const className = buttonVariants({
    className: disabled ? "pointer-events-none opacity-40" : undefined,
    size: "icon-sm",
    variant: "outline",
  })

  return disabled ? (
    <span
      aria-disabled="true"
      aria-label={label}
      className={className}
      role="link"
    >
      {children}
    </span>
  ) : (
    <Link aria-label={label} className={className} href={href}>
      {children}
    </Link>
  )
}

function TableHeading({ children }: { readonly children: ReactNode }) {
  return (
    <th
      className="px-4 py-3 text-left font-black text-muted-foreground"
      scope="col"
    >
      {children}
    </th>
  )
}

function TableNumber({ value }: { readonly value: string }) {
  return (
    <td className="px-4 py-3 font-bold tabular-nums text-foreground">
      {value}
    </td>
  )
}

function formatReturnValue(
  point: AdminAnalytics["dailySeries"][number]
): string {
  if (point.returnStatus === "immature") return "집계 중"
  if (point.returnStatus === "empty") return "표본 없음"
  return point.returns === null
    ? "표본 없음"
    : `${formatCount(point.returns)}명`
}

function formatCount(value: number): string {
  return value.toLocaleString("ko-KR")
}

function createAnalyticsHref(
  filters: AdminAnalyticsFilters,
  overrides: Readonly<Record<string, string | number>> = {}
): string {
  return createGetFilterHref(
    [
      ["direction", filters.direction],
      ["page", filters.page],
      ["pageSize", filters.pageSize],
      ["query", filters.query],
      ["sort", filters.sort],
    ],
    overrides
  )
}
