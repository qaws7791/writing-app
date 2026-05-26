import Image from "next/image"
import Link from "next/link"

import { Card, CardContent } from "@workspace/ui/components/ui/card"
import { BookOpenIcon } from "@workspace/ui/components/icons"

import type { Course } from "@/features/courses/course-data"

interface CourseCardProps {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link
      href={`/app/courses/${course.id}`}
      className="group block h-full rounded-3xl outline-none transition-transform active:scale-[0.99] focus-visible:ring-3 focus-visible:ring-ring/30"
      aria-label={`${course.title} — 레슨 ${course.lessonCount}개`}
      id={`course-card-${course.id}`}
    >
      <Card
        variant="filled"
        size="sm"
        className="h-full gap-0 rounded-3xl bg-transparent py-0 transition-colors group-hover:bg-muted/60"
      >
        <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-muted">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 559px) calc(100vw - 32px), (max-width: 899px) calc((100vw - 72px) / 2), 352px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        </div>

        <CardContent className="flex flex-1 flex-col gap-1.5 px-1 pt-4 pb-2">
          <h3 className="m-0 line-clamp-2 text-base/6 font-bold tracking-normal transition-colors group-hover:text-primary md:text-lg/7">
            {course.title}
          </h3>
          <div className="flex items-center gap-1 text-[13px]/5 font-semibold text-muted-foreground">
            <BookOpenIcon className="size-3.5 opacity-70" aria-hidden="true" />
            <span>{course.lessonCount}개 레슨</span>
          </div>
          <p className="m-0 line-clamp-3 text-sm/6 text-muted-foreground">
            {course.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
