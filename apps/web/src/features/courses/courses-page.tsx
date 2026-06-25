import Image from "next/image"
import Link from "next/link"

import { createCourseImageUrl } from "@/features/courses/course-visual-assets"
import type { CourseSummary } from "@/features/courses/course-types"
import { buttonVariants, Button } from "@workspace/ui/components/ui/button"
import { EmptyState } from "@workspace/ui/components/ui/empty-state"
import { Field, FieldLabel } from "@workspace/ui/components/ui/field"
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
          <form
            action="/app/courses"
            aria-label="코스 검색과 정렬"
            className="mb-5 grid gap-3 rounded-card bg-bg-surface p-(--surface-padding-md) md:grid-cols-[minmax(0,1fr)_180px_auto]"
            method="get"
          >
            <input name="category" type="hidden" value={filters.category} />
            <Field>
              <FieldLabel htmlFor="course-query">검색</FieldLabel>
              <Input
                defaultValue={filters.query}
                id="course-query"
                name="query"
                placeholder="제목, 설명, 카테고리 검색"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="course-sort">정렬</FieldLabel>
              <Select defaultValue={filters.sort} id="course-sort" name="sort">
                <option value="latest">최신순</option>
                <option value="title">제목순</option>
                <option value="studyTime">학습시간순</option>
              </Select>
            </Field>
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
