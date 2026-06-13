export function createCourseImageUrl(
  id: string,
  width: number,
  height: number
): string {
  return `https://picsum.photos/seed/${id}/${width}/${height}`
}
