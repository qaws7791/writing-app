import { err, type Result } from "@workspace/kernel/result"

import {
  authorizeContentMutation,
  type ContentActor,
} from "#content/domain/content-admin-policy"
import type { ContentError } from "#content/domain/content-error"
import { createCurriculumDraft } from "#content/domain/curriculum"
import type {
  ContentApplicationDependencies,
  CourseEditorDocument,
} from "#content/application/ports/content-ports"

export type SaveCourseEditorUseCase = (command: {
  readonly actor: ContentActor
  readonly document: CourseEditorDocument
  readonly expectedEditVersion: number
}) => Promise<Result<CourseEditorDocument, ContentError>>

export function createSaveCourseEditorUseCase(
  dependencies: ContentApplicationDependencies
): SaveCourseEditorUseCase {
  return async (command) => {
    const authorization = authorizeContentMutation(command.actor)
    if (authorization.isErr()) return err(authorization.error)

    const currentResult = await dependencies.repository.findDraft(
      command.document.courseId
    )
    if (currentResult.isErr()) return err(currentResult.error)
    const current = currentResult.value
    if (current === null) return err({ kind: "content-not-found" })
    if (
      current.curriculumVersionId !== command.document.curriculumVersionId ||
      current.revision !== command.document.revision
    ) {
      return err({
        kind: "content-validation-failed",
        reason: "invalid-course-reference",
      })
    }
    if (
      current.editVersion !== command.expectedEditVersion ||
      command.document.editVersion !== command.expectedEditVersion
    ) {
      return err({ kind: "content-conflict" })
    }

    const draft = createCurriculumDraft({
      ...command.document,
      visualKey: current.visualKey,
    })
    if (draft.isErr()) return err(draft.error)

    return (
      await dependencies.repository.saveDraft({
        draft: draft.value,
        expectedEditVersion: command.expectedEditVersion,
        now: dependencies.clock.now(),
      })
    ).map(({ visualKey: _visualKey, ...document }) => document)
  }
}
