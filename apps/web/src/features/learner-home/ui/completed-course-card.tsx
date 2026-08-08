import Image from "next/image"
import Link from "next/link"

import { resolveCourseImage } from "@/entities/course/model/course-visual-assets"
import type { LearnerProgressCourseDto } from "@/shared/http/learner-api-client"
import { Card, CardContent } from "@workspace/ui/components/ui/card"

type CompletedCourseCardProps = {
  readonly course: LearnerProgressCourseDto
  readonly priority?: boolean
}

export function CompletedCourseCard({
  course,
  priority = false,
}: CompletedCourseCardProps) {
  const courseHref = `/app/courses/${course.id}`

  return (
    <Card className="w-full min-w-0 gap-0 py-0 select-none" size="sm">
      <Link
        className="flex w-full cursor-pointer flex-col text-left lg:flex-row"
        href={courseHref}
      >
        <div className="relative h-36 w-full shrink-0 overflow-hidden lg:h-28 lg:min-h-28 lg:w-44">
          <Image
            alt={resolveCourseImage(course).alt}
            className="object-cover pointer-events-none"
            draggable={false}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 176px, 100vw"
            src={resolveCourseImage(course).src}
          />
        </div>
        <CardContent className="py-5 lg:flex lg:min-w-0 lg:flex-1 lg:items-center lg:py-4">
          <p
            className="font-heading text-base font-semibold tracking-[-0.014em]"
            style={{
              display: "-webkit-box",
              overflow: "hidden",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
            }}
          >
            {course.title}
          </p>
        </CardContent>
      </Link>
    </Card>
  )
}
