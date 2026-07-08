export function createCourseImageUrl(
  courseId: string,
  width = 600,
  height = 300
): string {
  return `https://picsum.photos/seed/${courseId}/${width}/${height}`
}
