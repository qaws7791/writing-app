"use client"

import { useState } from "react"

import Image from "next/image"
import Link from "next/link"

import { createCourseImageUrl } from "@/features/courses/course-visual-assets"
import type { CourseSummary } from "@/features/courses/course-types"

type CoursesPageProps = {
  readonly courses: readonly CourseSummary[]
}

function cx(...classes: Array<false | null | string | undefined>): string {
  return classes.filter(Boolean).join(" ")
}

export function CoursesPage({ courses }: CoursesPageProps) {
  const categories = Array.from(
    new Set(courses.map((course) => course.category))
  )
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? "")
  const visibleCourses = courses.filter(
    (course) => course.category === activeCategory
  )

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
          <div
            aria-label="코스 카테고리"
            className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 md:-mx-10 md:px-10 mb-8 pb-2"
          >
            {categories.map((category) => (
              <button
                className={cx(
                  "px-6 py-3 rounded-full font-bold whitespace-nowrap btn-squish",
                  activeCategory === category
                    ? "bg-charcoal text-cream"
                    : "bg-surface text-charcoal"
                )}
                key={category}
                onClick={() => setActiveCategory(category)}
                style={{ fontSize: "1rem" }}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
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
        </>
      )}
    </div>
  )
}
