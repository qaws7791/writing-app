"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { getCourses } from "@workspace/http-client/learner"
import { resolveCourseImage } from "@/entities/course/model/course-visual-assets"
import type { CourseListFilters } from "@/features/course-catalog/model/course-list-filters"
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
  type LearnerCourseSummaryDto,
} from "@/shared/http/learner-api-client"
import { buttonVariants } from "@workspace/ui/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/ui/empty"
import { SearchIcon, XIcon } from "@workspace/ui/components/icons"

const eagerCourseImageCount = 3

export type CoursesPageProps = {
  readonly categories: readonly string[]
  readonly courses: readonly LearnerCourseSummaryDto[]
  readonly filters: CourseListFilters
  readonly nextCursor?: string | null
}

export function CourseCatalogClient({
  categories,
  courses,
  filters,
  nextCursor: initialNextCursor = null,
}: CoursesPageProps) {
  const router = useRouter()
  const [query, setQuery] = useState(filters.query)
  const [visibleCourses, setVisibleCourses] = useState(courses)
  const [nextCursor, setNextCursor] = useState(initialNextCursor)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const [prevFiltersQuery, setPrevFiltersQuery] = useState(filters.query)
  const searchRef = useRef<HTMLInputElement>(null)

  const loadMore = useCallback(async () => {
    if (nextCursor === null || isLoadingMore) return
    setIsLoadingMore(true)
    setLoadMoreError(null)
    const result = await settleLearnerApiRequest(
      getCourses({
        ...(filters.category === "" ? {} : { category: filters.category }),
        cursor: nextCursor,
        ...(filters.query === "" ? {} : { query: filters.query }),
      })
    )
    setIsLoadingMore(false)
    if (result.status === "error") {
      if (isLearnerApiAuthenticationError(result.error)) {
        router.refresh()
        return
      }
      setLoadMoreError(result.error.message)
      return
    }
    setVisibleCourses((current) => [
      ...current,
      ...result.value.items.filter(
        (item) => !current.some((existing) => existing.id === item.id)
      ),
    ])
    setNextCursor(result.value.nextCursor)
  }, [filters.category, filters.query, isLoadingMore, nextCursor, router])

  if (filters.query !== prevFiltersQuery) {
    setQuery(filters.query)
    setPrevFiltersQuery(filters.query)
  }

  const updateUrl = useCallback(
    (overrides: Partial<CourseListFilters>) => {
      const nextFilters = {
        category: filters.category,
        query,
        ...overrides,
      }
      const params = new URLSearchParams()

      if (nextFilters.category !== "") {
        params.set("category", nextFilters.category)
      }

      if (nextFilters.query.trim() !== "") {
        params.set("query", nextFilters.query.trim())
      }

      const search = params.toString()
      const href = search === "" ? "/app/courses" : `/app/courses?${search}`
      router.replace(href, { scroll: false })
    },
    [filters.category, query, router]
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
      {visibleCourses.length === 0 &&
      filters.category === "" &&
      filters.query === "" ? (
        <Empty role="status">
          <EmptyHeader>
            <EmptyTitle>아직 열려 있는 코스가 없습니다.</EmptyTitle>
            <EmptyDescription>
              새 코스가 공개되면 이곳에서 바로 이어갈 수 있습니다.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="mb-5 flex items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <label className="sr-only" htmlFor="course-query">
                검색
              </label>
              <SearchIcon
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                className="w-full rounded-full bg-surface py-3 pl-11 pr-10 text-body-sm font-medium text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-charcoal/20"
                id="course-query"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="코스 검색…"
                ref={searchRef}
                value={query}
              />
              {query ? (
                <button
                  aria-label="검색어 지우기"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
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
          </div>
          <div
            aria-label="코스 카테고리"
            className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:-mx-12 md:px-12 mb-8 pb-2"
          >
            {["", ...categories].map((category) => (
              <Link
                className={buttonVariants({
                  className:
                    "rounded-full px-6 py-3 h-auto text-body-sm font-bold",
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
            <Empty role="status">
              <EmptyHeader>
                <EmptyTitle>조건에 맞는 코스가 없습니다.</EmptyTitle>
                <EmptyDescription>
                  검색어나 카테고리를 조정하면 더 많은 코스를 볼 수 있습니다.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link className={buttonVariants()} href="/app/courses">
                  필터 초기화
                </Link>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {visibleCourses.map((course, index) => (
                  <Link
                    className={buttonVariants({
                      className:
                        "h-auto w-full flex-row items-stretch justify-start overflow-hidden whitespace-normal rounded-2xl border-0 bg-surface p-0 text-left text-foreground hover:bg-surface md:flex-col md:rounded-4xl",
                      variant: "secondary",
                    })}
                    href={`/app/courses/${course.id}`}
                    key={course.id}
                  >
                    <div className="relative w-28 shrink-0 md:w-full md:h-44">
                      <Image
                        alt={resolveCourseImage(course).alt}
                        draggable="false"
                        className="object-cover select-none"
                        fill
                        loading={
                          index < eagerCourseImageCount ? "eager" : "lazy"
                        }
                        preload={index === 0}
                        sizes="(max-width: 768px) 112px, (max-width: 1024px) 50vw, 33vw"
                        src={resolveCourseImage(course).src}
                      />
                    </div>
                    <div className="p-4 md:p-6 flex-1 flex flex-col min-w-0">
                      <h2 className="mb-1 mt-3 text-title-md font-bold">
                        {course.title}
                      </h2>
                      <p className="hidden text-body-sm font-medium text-foreground md:block">
                        {course.description}
                      </p>
                      <div className="mt-auto pt-2 text-label-sm font-bold text-foreground">
                        {course.lessonCount}개 레슨
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {nextCursor === null ? null : (
                <div className="mt-8 flex flex-col items-center gap-2">
                  {loadMoreError === null ? null : (
                    <p
                      className="text-body-sm font-bold text-destructive"
                      role="alert"
                    >
                      {loadMoreError}
                    </p>
                  )}
                  <button
                    className={buttonVariants({ variant: "secondary" })}
                    disabled={isLoadingMore}
                    onClick={() => void loadMore()}
                    type="button"
                  >
                    {isLoadingMore ? "불러오는 중" : "코스 더 보기"}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
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

  const query = params.toString()

  return query === "" ? "/app/courses" : `/app/courses?${query}`
}
