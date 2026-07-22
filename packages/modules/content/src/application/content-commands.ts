import type { ContentApplication } from "#content/application/content-application"

export type ContentChangeCommandPort = Readonly<{
  saveCourseEditor: ContentApplication["saveCourseEditor"]
}>

export function createContentChangeCommandPort(
  application: ContentApplication
): ContentChangeCommandPort {
  return Object.freeze({
    saveCourseEditor: application.saveCourseEditor,
  })
}
