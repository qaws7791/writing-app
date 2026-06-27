"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { createCourseImageUrl } from "@/features/courses/course-visual-assets"
import type { CourseSummary } from "@/features/courses/course-types"
import { buttonVariants } from "@workspace/ui/components/ui/button"
import { EmptyState } from "@workspace/ui/components/ui/empty-state"
import { SearchIcon, XIcon } from "@workspace/ui/components/icons"

type CoursesPageProps = {
  readonly courses: readonly CourseSummary[]
  readonly filters: CourseListFilters
}

export type CourseListFilters = {
  readonly category: string
  readonly query: string
  readonly sort: "latest" | "studyTime" | "title"
}

export function CoursesPage({ courses, filters }: CoursesPageProps) {
  const router = useRouter()
  const [query, setQuery] = useState(filters.query)
  const [prevFiltersQuery, setPrevFiltersQuery] = useState(filters.query)
  const searchRef = useRef<HTMLInputElement>(null)

  if (filters.query !== prevFiltersQuery) {
    setQuery(filters.query)
    setPrevFiltersQuery(filters.query)
  }

  const categories = Array.from(
    new Set(courses.map((course) => course.category))
  )
  const visibleCourses = sortCourses(
    courses.filter((course) => matchesFilters(course, filters)),
    filters.sort,
    courses
  )
  const hasActiveFilters =
    filters.category !== "" ||
    filters.query.trim() !== "" ||
    filters.sort !== "latest"

  const updateUrl = useCallback(
    (overrides: Partial<CourseListFilters>) => {
      const nextFilters = {
        category: filters.category,
        query,
        sort: filters.sort,
        ...overrides,
      }
      const params = new URLSearchParams()

      if (nextFilters.category !== "") {
        params.set("category", nextFilters.category)
      }

      if (nextFilters.query.trim() !== "") {
        params.set("query", nextFilters.query.trim())
      }

      if (nextFilters.sort !== "latest") {
        params.set("sort", nextFilters.sort)
      }

      const search = params.toString()
      const href = search === "" ? "/app/courses" : `/app/courses?${search}`
      router.replace(href, { scroll: false })
    },
    [filters.category, filters.sort, query, router]
  )

  // 디바운스된 query 값을 통해 URL을 갱신하여 서버 필터링 재호출
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim() !== filters.query.trim()) {
        updateUrl({ query })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, filters.query, updateUrl])

  return (
    <div>
      <h1 className="mb-4 text-heading-lg font-bold">무엇을 써볼까요?</h1>
      <p className="mb-8 text-body-lg font-medium text-fg-muted">
        관심 있는 주제를 골라 매일 한 단락씩 글의 결을 다듬어 보세요.
      </p>

      {courses.length === 0 ? (
        <EmptyState
          description="새 코스가 공개되면 이곳에서 바로 이어갈 수 있습니다."
          role="status"
          title="아직 열려 있는 코스가 없습니다."
        />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <label className="sr-only" htmlFor="course-query">
                검색
              </label>
              <SearchIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none"
                size={16}
              />
              <input
                className="w-full pl-11 pr-10 py-3 rounded-full bg-bg-surface font-medium placeholder:text-fg-muted outline-none focus:ring-2 focus:ring-border-focus/20 transition-shadow text-base md:text-sm text-fg-default border border-border-default"
                id="course-query"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="코스 검색…"
                ref={searchRef}
                style={{ fontSize: "0.9375rem" }}
                value={query}
              />
              {query ? (
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-default transition-colors cursor-pointer"
                  onClick={() => {
                    setQuery("")
                    searchRef.current?.focus()
                  }}
                  type="button"
                >
                  <XIcon size={15} />
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="course-sort">
                정렬
              </label>
              <select
                className="px-4 py-3 rounded-full bg-bg-surface font-bold text-fg-default outline-none cursor-pointer shrink-0 border border-border-default text-base md:text-sm"
                id="course-sort"
                onChange={(e) => {
                  updateUrl({
                    sort: e.target.value as CourseListFilters["sort"],
                  })
                }}
                style={{ fontSize: "0.9375rem" }}
                value={filters.sort}
              >
                <option value="latest">최신순</option>
                <option value="title">제목순</option>
                <option value="studyTime">학습시간순</option>
              </select>
              {hasActiveFilters ? (
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href="/app/courses"
                >
                  초기화
                </Link>
              ) : null}
            </div>
          </div>
          <div
            aria-label="코스 카테고리"
            className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 md:-mx-10 md:px-10 mb-8 pb-2"
          >
            {["", ...categories].map((category) => (
              <Link
                className={buttonVariants({
                  size: "lg",
                  variant:
                    filters.category === category ? "default" : "secondary",
                })}
                href={createCoursesHref(filters, { category })}
                key={category}
              >
                {category === "" ? "전체" : category}
              </Link>
            ))}
          </div>
          {visibleCourses.length === 0 ? (
            <EmptyState
              actions={
                <Link className={buttonVariants()} href="/app/courses">
                  필터 초기화
                </Link>
              }
              description="검색어나 카테고리를 조정하면 더 많은 코스를 볼 수 있습니다."
              role="status"
              title="조건에 맞는 코스가 없습니다."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {visibleCourses.map((course) => (
                <Link
                  className="flex flex-row overflow-hidden rounded-card bg-bg-surface btn-squish md:flex-col"
                  href={`/app/courses/${course.id}`}
                  key={course.id}
                >
                  <div className="relative w-28 shrink-0 md:w-full md:h-44">
                    <Image
                      alt={course.title}
                      className="object-cover"
                      fill
                      sizes="(max-width: 768px) 112px, (max-width: 1024px) 50vw, 33vw"
                      src={createCourseImageUrl(course.visualKey)}
                    />
                  </div>
                  <div className="p-4 md:p-6 flex-1 flex flex-col min-w-0">
                    <h2 className="mb-1 mt-3 text-title-md font-bold">
                      {course.title}
                    </h2>
                    <p className="hidden text-body-sm font-medium text-fg-default md:block">
                      {course.description}
                    </p>
                    <div className="mt-auto pt-2 text-label-sm font-bold text-fg-default">
                      {course.lessonCount}개 레슨
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function matchesFilters(
  course: CourseSummary,
  filters: CourseListFilters
): boolean {
  const query = filters.query.trim().toLowerCase()
  const matchesCategory =
    filters.category === "" || course.category === filters.category
  const matchesQuery =
    query === "" ||
    [course.title, course.description, course.category].some((value) =>
      value.toLowerCase().includes(query)
    )

  return matchesCategory && matchesQuery
}

function sortCourses(
  courses: readonly CourseSummary[],
  sort: CourseListFilters["sort"],
  originalCourses: readonly CourseSummary[]
): readonly CourseSummary[] {
  const originalOrder = new Map(
    originalCourses.map((course, index) => [course.id, index])
  )

  return [...courses].sort((left, right) => {
    if (sort === "title") {
      return left.title.localeCompare(right.title, "ko")
    }

    if (sort === "studyTime") {
      return left.lessonCount - right.lessonCount
    }

    return (
      (originalOrder.get(left.id) ?? 0) - (originalOrder.get(right.id) ?? 0)
    )
  })
}

function createCoursesHref(
  filters: CourseListFilters,
  overrides: Partial<CourseListFilters>
): string {
  const nextFilters = {
    ...filters,
    ...overrides,
  }
  const params = new URLSearchParams()

  if (nextFilters.category !== "") {
    params.set("category", nextFilters.category)
  }

  if (nextFilters.query.trim() !== "") {
    params.set("query", nextFilters.query.trim())
  }

  if (nextFilters.sort !== "latest") {
    params.set("sort", nextFilters.sort)
  }

  const query = params.toString()

  return query === "" ? "/app/courses" : `/app/courses?${query}`
}
