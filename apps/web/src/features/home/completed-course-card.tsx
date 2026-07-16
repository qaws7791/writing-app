"use client"

import Image from "next/image"
import Link from "next/link"

import { createCourseImageUrl } from "@/features/courses/course-visual-assets"
import type { LearnerProgressCourse } from "@workspace/contracts/learning"
import { Surface } from "@workspace/ui/components/ui/surface"

type CompletedCourseCardProps = {
  readonly course: LearnerProgressCourse
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
            alt={course.title}
            className="object-cover pointer-events-none"
            draggable={false}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 176px, 100vw"
            src={createCourseImageUrl(course.visualKey)}
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
