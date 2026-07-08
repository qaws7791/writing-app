"use client"

import { useMemo, useState } from "react"

import {
  AdminCompletionTrendChart,
  AdminSignupTrendChart,
  AdminStreakDistributionChart,
} from "@/components/admin-charts"
import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminAnalytics,
  AdminLessonAnalyticsPage,
} from "@/lib/api/admin-api"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from "@workspace/ui/components/icons"
import { TrendingDown } from "lucide-react"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Input } from "@workspace/ui/components/ui/input"

const PAGE_SIZE = 10

type LessonSortKey =
  | "completionRate"
  | "courseTitle"
  | "dropOffRate"
  | "lessonTitle"

export function AdminAnalyticsPage({
  analyticsResult,
  lessonAnalyticsResult,
}: {
  readonly analyticsResult: AdminApiResult<AdminAnalytics>
  readonly lessonAnalyticsResult: AdminApiResult<AdminLessonAnalyticsPage>
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

  const lessonRows =
    lessonAnalyticsResult.status === "ok"
      ? lessonAnalyticsResult.value.items
      : []

  return (
    <>
      <AnalyticsHeading />
      <section className="mb-4 grid gap-4 lg:grid-cols-2">
        <AdminSignupTrendChart data={analyticsResult.value.dailySeries} />
        <AdminCompletionTrendChart data={analyticsResult.value.dailySeries} />
      </section>
      <section className="mb-4 grid gap-4 lg:grid-cols-2">
        <AdminStreakDistributionChart
          data={analyticsResult.value.streakBuckets}
        />
        <WorstLessonsPanel lessons={analyticsResult.value.worstLessons} />
      </section>
      <LessonAnalyticsTable lessons={lessonRows} />
    </>
  )
}

function AnalyticsHeading() {
  return (
    <header className="mb-6">
      <h1 className="m-0 text-[2rem] font-bold text-foreground">분석</h1>
      <p className="mt-1 text-[1.0625rem] font-medium text-muted-foreground">
        가입, 완료, 이탈 지표를 분석합니다.
      </p>
    </header>
  )
}

function WorstLessonsPanel({
  lessons,
}: {
  readonly lessons: AdminAnalytics["worstLessons"]
}) {
  return (
    <article className="rounded-4xl border border-surface-hover p-6">
      <h2 className="m-0 mb-1 text-[1.125rem] font-bold text-foreground">
        이탈률 상위 레슨
      </h2>
      <p className="mb-4 text-[0.875rem] font-medium text-muted-foreground">
        완료율이 낮거나 이탈이 높은 레슨입니다.
      </p>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {lessons.length === 0 ? (
          <li className="text-[0.875rem] font-medium text-muted-foreground">
            표시할 레슨이 없습니다.
          </li>
        ) : (
          lessons.map((lesson) => (
            <li
              className="flex items-center justify-between gap-3 border-b border-surface-hover pb-3 last:border-0 last:pb-0"
              key={lesson.lessonId}
            >
              <div className="min-w-0">
                <div className="truncate text-[0.9375rem] font-bold text-foreground">
                  {lesson.lessonTitle}
                </div>
                <div className="truncate text-[0.8125rem] font-medium text-muted-foreground">
                  {lesson.courseTitle}
                </div>
              </div>
              <span className="shrink-0 text-[0.8125rem] font-bold text-destructive">
                {lesson.dropOffRate}%
              </span>
            </li>
          ))
        )}
      </ul>
    </article>
  )
}

function LessonAnalyticsTable({
  lessons,
}: {
  readonly lessons: AdminLessonAnalyticsPage["items"]
}) {
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<LessonSortKey>("completionRate")
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const base =
      normalizedQuery.length === 0
        ? lessons
        : lessons.filter(
            (lesson) =>
              lesson.lessonTitle.toLowerCase().includes(normalizedQuery) ||
              lesson.courseTitle.toLowerCase().includes(normalizedQuery)
          )

    return [...base].sort((left, right) => {
      const leftValue = left[sortKey]
      const rightValue = right[sortKey]
      const comparison =
        typeof leftValue === "string"
          ? leftValue.localeCompare(String(rightValue))
          : Number(leftValue) - Number(rightValue)

      return sortAsc ? comparison : -comparison
    })
  }, [lessons, query, sortAsc, sortKey])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const rows = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  )

  return (
    <article className="rounded-4xl border border-surface-hover p-6">
      <h2 className="m-0 mb-1 text-[1.125rem] font-bold text-foreground">
        레슨별 완료율
      </h2>
      <p className="mb-4 text-[0.875rem] font-medium text-muted-foreground">
        강의 전체 레슨의 완료율과 이탈률
      </p>
      <div className="relative mb-4">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={14}
        />
        <Input
          className="pl-8 text-[0.875rem] font-medium"
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(0)
          }}
          placeholder="레슨 또는 강의 검색…"
          value={query}
        />
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          <div className="grid grid-cols-[2fr_1.4fr_1fr_1fr] gap-3 border-b border-background px-2 py-2">
            <SortHeader
              active={sortKey === "lessonTitle"}
              asc={sortAsc}
              label="레슨"
              onClick={() => toggleSort("lessonTitle")}
            />
            <SortHeader
              active={sortKey === "courseTitle"}
              asc={sortAsc}
              label="강의"
              onClick={() => toggleSort("courseTitle")}
            />
            <SortHeader
              active={sortKey === "completionRate"}
              asc={sortAsc}
              label="완료율"
              onClick={() => toggleSort("completionRate")}
            />
            <SortHeader
              active={sortKey === "dropOffRate"}
              asc={sortAsc}
              label="이탈률"
              onClick={() => toggleSort("dropOffRate")}
            />
          </div>
          {rows.length === 0 ? (
            <div className="py-10 text-center text-[0.875rem] text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          ) : (
            rows.map((lesson) => (
              <div
                className="grid grid-cols-[2fr_1.4fr_1fr_1fr] items-center gap-3 border-b border-background px-2 py-3 last:border-0"
                key={lesson.lessonId}
              >
                <span className="truncate text-[0.875rem] font-bold text-foreground">
                  {lesson.lessonTitle}
                </span>
                <span className="truncate text-[0.8125rem] font-medium text-muted-foreground">
                  {lesson.courseTitle}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-2 max-w-[80px] flex-1 overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        background:
                          lesson.completionRate < 50
                            ? "var(--color-coral)"
                            : "var(--color-charcoal)",
                        width: `${lesson.completionRate}%`,
                      }}
                    />
                  </div>
                  <span className="text-[0.8125rem] font-bold text-foreground">
                    {lesson.completionRate}%
                  </span>
                </div>
                <span
                  className="inline-flex items-center gap-1 text-[0.8125rem] font-bold"
                  style={{
                    color:
                      lesson.dropOffRate > 50
                        ? "var(--color-coral-dark)"
                        : "var(--color-muted-foreground)",
                  }}
                >
                  {lesson.dropOffRate > 50 ? (
                    <TrendingDown aria-hidden="true" size={13} />
                  ) : null}
                  {lesson.dropOffRate}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between border-t border-background pt-3">
          <span className="text-[0.8125rem] font-medium text-muted-foreground">
            {filtered.length}개 중 {safePage * PAGE_SIZE + 1}–
            {Math.min((safePage + 1) * PAGE_SIZE, filtered.length)}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl border border-surface-hover p-1.5 transition-colors hover:bg-surface disabled:opacity-30"
              disabled={safePage === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              type="button"
            >
              <ChevronLeftIcon aria-hidden="true" size={14} />
            </button>
            <span className="text-[0.8125rem] font-bold text-foreground">
              {safePage + 1} / {totalPages}
            </span>
            <button
              className="rounded-xl border border-surface-hover p-1.5 transition-colors hover:bg-surface disabled:opacity-30"
              disabled={safePage === totalPages - 1}
              onClick={() =>
                setPage((current) => Math.min(totalPages - 1, current + 1))
              }
              type="button"
            >
              <ChevronRightIcon aria-hidden="true" size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )

  function toggleSort(nextKey: LessonSortKey) {
    if (sortKey === nextKey) {
      setSortAsc((current) => !current)
      return
    }

    setSortKey(nextKey)
    setSortAsc(true)
    setPage(0)
  }
}

function SortHeader({
  active,
  asc,
  label,
  onClick,
}: {
  readonly active: boolean
  readonly asc: boolean
  readonly label: string
  readonly onClick: () => void
}) {
  return (
    <button
      className="flex items-center gap-1 text-[0.8125rem] font-bold text-muted-foreground transition-colors hover:text-foreground"
      onClick={onClick}
      type="button"
    >
      {label}
      {active ? (
        <ChevronDownIcon
          aria-hidden="true"
          className={asc ? "rotate-180" : ""}
          size={12}
        />
      ) : null}
    </button>
  )
}
