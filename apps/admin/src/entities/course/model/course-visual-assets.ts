import type { CourseVisualKey } from "@workspace/contracts/content/course"

type AdminCourseVisualKey = CourseVisualKey

const courseVisualAssetUrls = {
  "basic-sentence-writing": "/course-thumbnails/basic-sentence-writing.png",
  "creative-writing": "/course-thumbnails/creative-writing.png",
  "essay-writing": "/course-thumbnails/essay-writing.png",
  expression: "/course-thumbnails/expression.png",
  "grammar-complete": "/course-thumbnails/grammar-complete.png",
} satisfies Record<AdminCourseVisualKey, string>

export function createAdminCourseImageUrl(
  visualKey: AdminCourseVisualKey
): string {
  return courseVisualAssetUrls[visualKey]
}
