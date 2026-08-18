import type { CourseVisualKey } from "@workspace/contracts/content/course"

type AdminCourseVisualKey = CourseVisualKey

const courseVisualAssetUrls = {
  "basic-sentence-writing": "/course-thumbnails/basic-sentence-writing.png",
  "business-email": "/course-thumbnails/business-email.png",
  "business-writing": "/course-thumbnails/business-writing.png",
  "creative-writing": "/course-thumbnails/creative-writing.png",
  "emotion-writing": "/course-thumbnails/emotion-writing.png",
  "essay-writing": "/course-thumbnails/essay-writing.png",
  expression: "/course-thumbnails/expression.png",
  "grammar-complete": "/course-thumbnails/grammar-complete.png",
  "reading-comprehension": "/course-thumbnails/reading-comprehension.png",
  "sentence-structure": "/course-thumbnails/sentence-structure.png",
  "vocabulary-basics": "/course-thumbnails/vocabulary-basics.png",
} satisfies Record<AdminCourseVisualKey, string>

export function createAdminCourseImageUrl(
  visualKey: AdminCourseVisualKey
): string {
  return courseVisualAssetUrls[visualKey]
}
