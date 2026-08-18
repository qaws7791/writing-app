import Link from "next/link"

import { HomeCourseImage } from "@/features/learner-home/ui/home-course-image"
import type { LearnerProgressCourseDto } from "@/shared/http/learner-api-client"
import { cardVariants } from "@workspace/ui/components/primitives/card"
import { cn } from "@workspace/ui/lib/utils"

type CompletedCourseCardProps = {
  readonly course: LearnerProgressCourseDto
}

export function CompletedCourseCard({ course }: CompletedCourseCardProps) {
  const courseHref = `/app/courses/${course.id}`
  const totalLessons = course.learning.totalLessons

  return (
    <article
      className={cn(
        cardVariants({ size: "sm", variant: "surface" }),
        "flex-row items-center gap-4 rounded-[1.75rem] py-4"
      )}
    >
      <Link
        className="flex w-full items-center gap-4 px-(--card-spacing) outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
        href={courseHref}
      >
        <HomeCourseImage course={course} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
            <span className="tabular-nums normal-case tracking-normal">
              완료
            </span>
          </p>
          <h3 className="mt-1 font-heading text-base font-semibold tracking-[-0.02em] text-balance">
            {course.title}
          </h3>
          <p className="mt-1 text-xs tabular-nums text-muted-foreground">
            {totalLessons}레슨
          </p>
        </div>
      </Link>
    </article>
  )
}
