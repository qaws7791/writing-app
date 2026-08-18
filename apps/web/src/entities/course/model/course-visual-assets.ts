import type { LearnerCourseSummary } from "@workspace/contracts/learning/learner-content"

type CourseVisualKey = LearnerCourseSummary["visualKey"]

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
} satisfies Record<CourseVisualKey, string>

function createCourseImageUrl(visualKey: CourseVisualKey): string {
  return courseVisualAssetUrls[visualKey]
}

export function resolveCourseImage(course: {
  readonly cover: null | Readonly<{ altText: string; url: string }>
  readonly title: string
  readonly visualKey: CourseVisualKey
}): Readonly<{ alt: string; src: string }> {
  return course.cover === null
    ? {
        alt: course.title,
        src: createCourseImageUrl(course.visualKey),
      }
    : {
        alt: course.cover.altText,
        src: course.cover.url,
      }
}
