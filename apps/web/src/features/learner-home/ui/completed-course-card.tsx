import Image from "next/image"
import Link from "next/link"

import { resolveCourseImage } from "@/entities/course/model/course-visual-assets"
import type { LearnerProgressCourseDto } from "@/shared/http/learner-api-client"
import { Surface } from "@workspace/ui/components/ui/surface"

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
    <Surface
      variant="panel"
      size="none"
      className="flex w-full min-w-0 flex-col overflow-hidden rounded-[28px] select-none lg:rounded-[24px]"
    >
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
        <div className="px-6 py-5 lg:flex lg:min-w-0 lg:flex-1 lg:items-center lg:px-5 lg:py-4">
          <p
            className="text-title-md font-bold lg:text-body-md"
            style={{
              display: "-webkit-box",
              overflow: "hidden",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
            }}
          >
            {course.title}
          </p>
        </div>
      </Link>
    </Surface>
  )
}
