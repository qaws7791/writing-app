import Image from "next/image"

import { resolveCourseImage } from "@/entities/course/model/course-visual-assets"
import type { LearnerProgressCourseDto } from "@/shared/http/learner-api-client"

export function HomeCourseImage({
  course,
}: {
  readonly course: Pick<
    LearnerProgressCourseDto,
    "cover" | "title" | "visualKey"
  >
}) {
  const image = resolveCourseImage(course)

  return (
    <div
      aria-hidden="true"
      className="relative size-20 shrink-0 overflow-hidden rounded-3xl bg-muted @[32rem]:size-24"
    >
      <Image
        alt=""
        className="object-cover"
        fill
        sizes="(min-width: 32rem) 96px, 80px"
        src={image.src}
      />
    </div>
  )
}
