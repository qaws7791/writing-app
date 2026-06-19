import type { CourseVisualKey } from "@/features/courses/course-types"

const courseVisualAssetUrls = {
  "basic-sentence-writing": "/course-thumbnails/basic-sentence-writing.png",
  "creative-writing": "/course-thumbnails/creative-writing.png",
  "essay-writing": "/course-thumbnails/essay-writing.png",
  expression: "/course-thumbnails/expression.png",
  "grammar-complete": "/course-thumbnails/grammar-complete.png",
} satisfies Record<CourseVisualKey, string>

export function createCourseImageUrl(visualKey: CourseVisualKey): string {
  return courseVisualAssetUrls[visualKey]
}
