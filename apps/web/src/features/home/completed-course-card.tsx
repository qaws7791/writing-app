"use client"

import Image from "next/image"
import Link from "next/link"

import { createCourseImageUrl } from "@/features/courses/course-visual-assets"
import type { ProgressCourse } from "@/features/courses/course-types"
import { Surface } from "@workspace/ui/components/ui/surface"

type CompletedCourseCardProps = {
  readonly course: ProgressCourse
  readonly priority?: boolean
  readonly variant: "desktop" | "mobile"
}

export function CompletedCourseCard({
  course,
  priority = false,
  variant,
}: CompletedCourseCardProps) {
  const isDesktop = variant === "desktop"
  const courseHref = `/app/courses/${course.id}`

  return (
    <Surface
      variant="panel"
      size="none"
      className={
        isDesktop
          ? "overflow-hidden rounded-[24px] select-none"
          : "flex w-80 shrink-0 flex-col overflow-hidden rounded-[28px] select-none sm:w-[22rem]"
      }
    >
      {isDesktop ? (
        <Link className="flex cursor-pointer text-left" href={courseHref}>
          <div className="relative min-h-28 h-28 w-44 shrink-0 overflow-hidden">
            <Image
              alt={course.title}
              className="object-cover pointer-events-none"
              draggable={false}
              fill
              priority={priority}
              sizes="176px"
              src={createCourseImageUrl(course.visualKey)}
            />
          </div>
          <div className="flex flex-1 min-w-0 items-center px-5 py-4">
            <p
              className="text-body-md font-bold"
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
      ) : (
        <Link className="w-full cursor-pointer text-left" href={courseHref}>
          <div className="relative h-36 w-full overflow-hidden">
            <Image
              alt={course.title}
              className="object-cover pointer-events-none"
              draggable={false}
              fill
              priority={priority}
              sizes="(min-width: 640px) 22rem, 20rem"
              src={createCourseImageUrl(course.visualKey)}
            />
          </div>
          <div className="px-6 py-5">
            <p
              className="text-title-md font-bold"
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
      )}
    </Surface>
  )
}
