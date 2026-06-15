"use client"

/* eslint-disable react/button-has-type */

import { useState } from "react"

import Image from "next/image"
import { useRouter } from "next/navigation"

import { createCourseImageUrl } from "@/features/courses/course-image-url"
import type { CourseSummary } from "@/features/courses/course-types"

type CoursesPageProps = {
  readonly courses: readonly CourseSummary[]
}

const fallbackCourses: readonly CourseSummary[] = [
  {
    category: "입문자를 위한 코스",
    description:
      "문장의 기본부터 한 문단을 완성하기까지, 매일 조금씩 쓰는 습관을 만듭니다.",
    id: "c1",
    lessonCount: 10,
    status: "active",
    title: "글쓰기 첫걸음 30일",
  },
  {
    category: "문법 심화",
    description:
      "주술 호응, 시제, 조사 사용까지 한국어 문장을 단단하게 만드는 문법.",
    id: "c2",
    lessonCount: 8,
    status: "active",
    title: "문장의 기본 문법",
  },
  {
    category: "실전 글쓰기",
    description:
      "주장, 근거, 반론의 구조를 파악하고 명확한 문장 모델을 설치합니다.",
    id: "c3",
    lessonCount: 8,
    status: "active",
    title: "글과 논증을 잘하는 30일",
  },
  {
    category: "중급 글쓰기",
    description:
      "독자의 눈높이를 파악하고, 흥미를 유지하며, 기억에 남는 글을 쓰는 전략.",
    id: "c4",
    lessonCount: 9,
    status: "active",
    title: "독자를 사로잡는 글쓰기",
  },
  {
    category: "심화 글쓰기",
    description: "초고를 완성된 글로 다듬는 5단계 퇴고법과 자기 피드백 훈련.",
    id: "c5",
    lessonCount: 9,
    status: "active",
    title: "퇴고와 완성의 기술",
  },
]

function cx(...classes: Array<false | null | string | undefined>): string {
  return classes.filter(Boolean).join(" ")
}

export function CoursesPage({ courses }: CoursesPageProps) {
  const router = useRouter()
  const resolvedCourses = courses.length > 0 ? courses : fallbackCourses
  const categories = Array.from(
    new Set(resolvedCourses.map((course) => course.category))
  )
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? "")

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
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-2">
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
          >
            {category}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {resolvedCourses
          .filter((course) => course.category === activeCategory)
          .map((course) => (
            <div
              className="bg-surface rounded-2xl md:rounded-4xl overflow-hidden cursor-pointer btn-squish flex flex-row md:flex-col"
              key={course.id}
              onClick={() => router.push(`/app/courses/${course.id}`)}
            >
              <div className="relative w-28 shrink-0 md:w-full md:h-44">
                <Image
                  alt={course.title}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 112px, (max-width: 1024px) 50vw, 33vw"
                  src={createCourseImageUrl(course.id)}
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
            </div>
          ))}
      </div>
    </div>
  )
}
