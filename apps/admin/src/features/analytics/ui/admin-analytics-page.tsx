import Link from "next/link"
import type { ReactNode } from "react"

import { AdminChartPanel } from "@/entities/admin-analytics/ui/admin-chart-panel"
import { AdminPageHeader } from "@/shared/ui/admin-page-header"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import type { AdminAnalyticsFilters } from "@/features/analytics/model/admin-analytics-filters"
import { createGetFilterHref } from "@/shared/navigation/get-filter-url"
import type {
  AdminAiFeedbackQuality,
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
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/ui/empty"
import { Input } from "@workspace/ui/components/ui/input"
import { Button, buttonVariants } from "@workspace/ui/components/ui/button"

const pageSizeOptions = [10, 20, 50] as const
const fieldLabelClassName =
  "flex w-fit gap-2 text-sm leading-snug font-medium tracking-[-0.005em] text-foreground/90"

export function AdminAnalyticsPage({
  aiFeedbackQualityResult,
  analyticsResult,
  filters,
  lessonAnalyticsResult,
}: {
  readonly aiFeedbackQualityResult: AdminRequestResult<AdminAiFeedbackQuality>
  readonly analyticsResult: AdminRequestResult<AdminAnalytics>
  readonly filters: AdminAnalyticsFilters
  readonly lessonAnalyticsResult: AdminRequestResult<AdminLessonAnalyticsPage>
}) {
  if (analyticsResult.status === "error") {
    return (
      <>
        <AnalyticsHeading />
        <Alert role="alert" variant="destructive">
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
      <AiFeedbackQualityPanel result={aiFeedbackQualityResult} />
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
    <AdminPageHeader
      description={
        analytics === undefined
          ? "가입, 첫 시작, 완료와 D7 재방문을 분석합니다."
          : `${analytics.from}–${analytics.to} · D7 성숙 cohort ${analytics.matureCohortThrough}까지`
      }
    />
  )
}

function AnalyticsEmptyState() {
  return (
    <Card className="mb-4" variant="muted">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>표시할 일별 분석 데이터가 없습니다.</EmptyTitle>
          <EmptyDescription>
            학습자 활동이 기록되면 가입·첫 시작·완료·재방문 추이를 표시합니다.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </Card>
  )
}

function DailyAnalyticsTable({
  analytics,
}: {
  readonly analytics: AdminAnalytics
}) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>
          <h2>일별 분석 데이터</h2>
        </CardTitle>
        <CardDescription>
          세 차트와 같은 값을 표로 확인할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="overflow-x-auto"
          data-slot="analytics-data-table-container"
        >
          <table
            aria-label="일별 가입, 첫 시작, 완료와 D7 재방문"
            className="w-full min-w-[720px] text-sm"
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
      </CardContent>
    </Card>
  )
}

const aiFeedbackFailureLabels = {
  "pending-expired": "처리 중 만료",
  "persistence-failed": "저장 실패",
  "provider-response-invalid": "응답 형식 오류",
  "provider-timeout": "제공자 timeout",
  "provider-unavailable": "제공자 불가",
  "request-aborted": "요청 중단",
} as const satisfies Record<
  AdminAiFeedbackQuality["failureCounts"][number]["code"],
  string
>

function AiFeedbackQualityPanel({
  result,
}: {
  readonly result: AdminRequestResult<AdminAiFeedbackQuality>
}) {
  return (
    <Card aria-label="AI 코칭 서비스 품질" className="mb-4" role="region">
      <CardHeader>
        <CardTitle>
          <h2>AI 코칭 서비스 품질</h2>
        </CardTitle>
        <CardDescription>
          조회 기간의 요청과 실패, 지연, token 사용량입니다. 답안과 피드백
          원문은 포함하지 않습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result.status === "error" ? (
          <Alert role="alert" variant="destructive">
            <AlertDescription>{result.error.message}</AlertDescription>
          </Alert>
        ) : result.value.status === "empty" ? (
          <p className="mt-4 font-semibold text-muted-foreground">
            조회 기간에 AI 코칭 요청이 없습니다.
          </p>
        ) : (
          <>
            <dl className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
              <QualityMetric
                label="요청"
                value={`${formatCount(result.value.requestCount)}건`}
              />
              <QualityMetric
                label="성공"
                value={`${formatCount(result.value.successCount)}건`}
              />
              <QualityMetric
                label="성공률"
                value={
                  result.value.successRate === null
                    ? "집계 중"
                    : `${Math.round(result.value.successRate * 1_000) / 10}%`
                }
              />
              <QualityMetric
                label="실패"
                value={`${formatCount(result.value.failureCount)}건`}
              />
              <QualityMetric
                label="평균 지연"
                value={
                  result.value.latency.averageMs === null
                    ? "표본 없음"
                    : `${formatCount(Math.round(result.value.latency.averageMs))}ms`
                }
              />
              <QualityMetric
                label="재시도"
                value={`${formatCount(result.value.retryCount)}건`}
              />
            </dl>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <QualityMetric
                label="입력 token"
                value={formatCount(result.value.tokens.input)}
              />
              <QualityMetric
                label="출력 token"
                value={formatCount(result.value.tokens.output)}
              />
            </dl>
            <h3 className="mt-6 font-heading text-base font-semibold">
              실패 원인
            </h3>
            {result.value.failureCounts.length === 0 ? (
              <p className="mt-1 font-semibold text-muted-foreground">
                조회 기간에 실패가 없습니다.
              </p>
            ) : (
              <ul className="mt-2 grid list-none gap-1 p-0">
                {result.value.failureCounts.map((failure) => (
                  <li
                    className="flex justify-between gap-4 font-semibold"
                    key={failure.code}
                  >
                    <span>{aiFeedbackFailureLabels[failure.code]}</span>
                    <span>{formatCount(failure.count)}건</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function QualityMetric({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="font-heading text-lg font-semibold">{value}</dd>
    </div>
  )
}

function WorstAiFeedbackLessonsTable({
  lessons,
}: {
  readonly lessons: AdminAnalytics["worstAiFeedbackLessons"]
}) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>
          <h2>AI 실패율 상위 레슨</h2>
        </CardTitle>
        <CardDescription>
          조회 기간의 AI 코칭 요청 중 실패 비율이 높은 현재 레슨입니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table
            aria-label="AI 실패율 상위 레슨"
            className="w-full min-w-[720px] text-sm"
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
      </CardContent>
    </Card>
  )
}

function LessonAnalyticsError({ message }: { readonly message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>레슨별 성과</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert role="alert" variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>레슨별 성과</h2>
        </CardTitle>
        <CardDescription>
          시작·완료·완료율·이탈률을 서버 집계로 조회합니다.
        </CardDescription>
        <CardAction>
          <span className="text-sm font-semibold text-muted-foreground">
            {formatCount(pagination.totalItems)}개
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <LessonAnalyticsFilter filters={filters} />
        <div
          className="overflow-x-auto"
          data-slot="lesson-analytics-table-container"
        >
          <table
            aria-label="레슨별 성과"
            className="w-full min-w-[880px] text-sm"
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
            <span className="text-sm font-medium text-muted-foreground">
              {formatCount(pagination.totalItems)}개 중 {formatCount(firstItem)}
              –{formatCount(lastItem)}
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
              <span className="min-w-20 text-center text-sm font-semibold">
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
      </CardContent>
    </Card>
  )
}

function LessonAnalyticsFilter({
  filters,
}: {
  readonly filters: AdminAnalyticsFilters
}) {
  return (
    <form
      aria-label="레슨 분석 필터"
      className="mb-4 grid grid-cols-[minmax(220px,1fr)_160px_auto_auto] items-end gap-3 rounded-3xl bg-muted p-4 max-lg:grid-cols-1"
      method="get"
    >
      <input name="direction" type="hidden" value={filters.direction} />
      <input name="page" type="hidden" value="1" />
      <input name="sort" type="hidden" value={filters.sort} />
      <div className="relative grid gap-2.5">
        <label className={fieldLabelClassName} htmlFor="lesson-analytics-query">
          레슨 또는 강의 검색
        </label>
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 left-3.5 text-muted-foreground"
          size={16}
        />
        <Input
          aria-label="레슨 또는 강의 검색"
          className="pl-10 font-semibold"
          defaultValue={filters.query}
          id="lesson-analytics-query"
          name="query"
          placeholder="검색어 입력"
        />
      </div>
      <div className="grid gap-2.5">
        <label
          className={fieldLabelClassName}
          htmlFor="lesson-analytics-page-size"
        >
          페이지당 행
        </label>
        <select
          className="squircle h-10 w-full rounded-2xl border border-border/70 bg-input/35 px-4 py-1 text-sm font-medium shadow-2xs outline-none transition-[color,box-shadow,background-color,border-color] hover:border-border hover:bg-input/50 focus-visible:border-ring focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-ring/25 dark:bg-input/25 dark:hover:bg-input/35 dark:focus-visible:bg-input/20"
          defaultValue={String(filters.pageSize)}
          id="lesson-analytics-page-size"
          name="pageSize"
        >
          {pageSizeOptions.map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize}개
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="outline">
        조회
      </Button>
      <Link
        className={buttonVariants({ size: "default", variant: "ghost" })}
        href="/analytics"
      >
        초기화
      </Link>
    </form>
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
