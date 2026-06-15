const defaultCourseImageUrl = "/course-thumbnails/basic-sentence-writing.png"

const courseImageUrls = new Map<string, string>([
  ["c1", defaultCourseImageUrl],
  ["c2", "/course-thumbnails/grammar-complete.png"],
  ["c3", "/course-thumbnails/essay-writing.png"],
  ["c4", "/course-thumbnails/creative-writing.png"],
  ["c5", "/course-thumbnails/expression.png"],
])

export function createCourseImageUrl(id: string): string {
  return courseImageUrls.get(id) ?? defaultCourseImageUrl
}
