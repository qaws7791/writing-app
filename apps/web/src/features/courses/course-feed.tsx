import Link from "next/link"

import { ChevronRightIcon } from "@workspace/ui/components/icons"

import { CourseCard } from "@/features/courses/course-card"
import type { CourseCategory } from "@/features/courses/course-data"

interface CourseFeedProps {
  categories: readonly CourseCategory[]
}

interface CourseSectionProps {
  category: CourseCategory
}

export function CourseFeed({ categories }: CourseFeedProps) {
  return (
    <div className="flex flex-col gap-12 md:gap-16">
      {categories.map((category) => (
        <CourseSection key={category.id} category={category} />
      ))}
    </div>
  )
}

function CourseSection({ category }: CourseSectionProps) {
  return (
    <section
      className="flex flex-col gap-5"
      aria-labelledby={`section-title-${category.id}`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2
          className="m-0 text-xl/7 font-bold tracking-normal md:text-2xl/8"
          id={`section-title-${category.id}`}
        >
          {category.title}
        </h2>
        <Link
          href={`/app/courses?category=${category.id}`}
          className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          id={`see-all-${category.id}`}
          aria-label={`${category.title} 전체 보기`}
        >
          <span>전체 보기</span>
          <ChevronRightIcon
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      <div
        className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 min-[900px]:grid-cols-3 md:gap-6"
        role="list"
      >
        {category.courses.map((course) => (
          <div key={course.id} role="listitem">
            <CourseCard course={course} />
          </div>
        ))}
      </div>
    </section>
  )
}
