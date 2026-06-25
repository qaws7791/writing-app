import Image from "next/image"
import Link from "next/link"

import { createCourseImageUrl } from "@/features/courses/course-visual-assets"
import type { CourseSummary } from "@/features/courses/course-types"
import { buttonVariants, Button } from "@workspace/ui/components/ui/button"
import { Input } from "@workspace/ui/components/ui/input"
import { Select } from "@workspace/ui/components/ui/select"

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

  return (
    <div>
      <h1 className="font-bold mb-4" style={{ fontSize: "2.25rem" }}>
        무엇을 써볼까요?
      </h1>
      <p
        className="text-muted font-medium mb-8"
        style={{ fontSize: "1.125rem" }}
      >
        관심 있는 주제를 골라 매일 한 단락씩 글의 결을 다듬어 보세요.
      </p>

      {courses.length === 0 ? (
        <div
          className="rounded-2xl bg-surface px-6 py-8 text-charcoal"
          role="status"
        >
          <h2 className="font-bold mb-2" style={{ fontSize: "1.25rem" }}>
            아직 열려 있는 코스가 없습니다.
          </h2>
          <p className="text-muted font-medium" style={{ fontSize: "1rem" }}>
            새 코스가 공개되면 이곳에서 바로 이어갈 수 있습니다.
          </p>
        </div>
      ) : (
        <>
          <form
            action="/app/courses"
            aria-label="코스 검색과 정렬"
            className="bg-surface rounded-2xl md:rounded-4xl p-4 md:p-5 mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]"
            method="get"
          >
            <input name="category" type="hidden" value={filters.category} />
            <label className="grid gap-2">
              <span className="text-muted font-bold text-sm">검색</span>
              <Input
                defaultValue={filters.query}
                name="query"
                placeholder="제목, 설명, 카테고리 검색"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-muted font-bold text-sm">정렬</span>
              <Select defaultValue={filters.sort} name="sort">
                <option value="latest">최신순</option>
                <option value="title">제목순</option>
                <option value="studyTime">학습시간순</option>
              </Select>
            </label>
            <div className="flex items-end gap-2">
              <Button type="submit">적용</Button>
              {hasActiveFilters ? (
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href="/app/courses"
                >
                  초기화
                </Link>
              ) : null}
            </div>
          </form>
          <div
            aria-label="코스 카테고리"
            className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 md:-mx-10 md:px-10 mb-8 pb-2"
          >
            {["", ...categories].map((category) => (
              <Link
                className={buttonVariants({
                  className: "h-auto px-6 py-3 text-base",
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
            <div
              className="rounded-2xl bg-surface px-6 py-8 text-charcoal"
              role="status"
            >
              <h2 className="font-bold mb-2" style={{ fontSize: "1.25rem" }}>
                조건에 맞는 코스가 없습니다.
              </h2>
              <p className="text-muted font-medium mb-4">
                검색어나 카테고리를 조정하면 더 많은 코스를 볼 수 있습니다.
              </p>
              <Link className={buttonVariants()} href="/app/courses">
                필터 초기화
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {visibleCourses.map((course) => (
                <Link
                  className="bg-surface rounded-2xl md:rounded-4xl overflow-hidden cursor-pointer btn-squish flex flex-row md:flex-col"
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
                    <h2
                      className="font-bold mt-3 mb-1"
                      style={{
                        fontSize: "1.125rem",
                        lineHeight: 1.35,
                      }}
                    >
                      {course.title}
                    </h2>
                    <p
                      className="text-charcoal font-medium leading-relaxed hidden md:block"
                      style={{ fontSize: "0.9375rem" }}
                    >
                      {course.description}
                    </p>
                    <div
                      className="mt-auto pt-2 text-charcoal font-bold"
                      style={{ fontSize: "0.8125rem" }}
                    >
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
