import { err, type Result } from "@workspace/kernel/result"
import type { CourseId, CurriculumVersionId } from "@workspace/types/ids"

import {
  authorizeContentMutation,
  type ContentActor,
} from "#content/domain/content-admin-policy"
import type { ContentError } from "#content/domain/content-error"
import { createCurriculumVersionId } from "#content/domain/content-model"
import { decidePublishCurriculum } from "#content/domain/curriculum"
import type { ContentApplicationDependencies } from "#content/application/ports/content-ports"

export type PublishedCourseResult = Readonly<{
  curriculumVersionId: CurriculumVersionId
  publishedAt: Date
  revision: number
}>

export type PublishCourseUseCase = (command: {
  readonly actor: ContentActor
  readonly courseId: CourseId
  readonly expectedEditVersion: number
}) => Promise<Result<PublishedCourseResult, ContentError>>

export function createPublishCourseUseCase(
  dependencies: ContentApplicationDependencies
): PublishCourseUseCase {
  return async (command) => {
    const authorization = authorizeContentMutation(command.actor)
    if (authorization.isErr()) return err(authorization.error)

    const draftResult = await dependencies.repository.findDraft(
      command.courseId
    )
    if (draftResult.isErr()) return err(draftResult.error)
    const draft = draftResult.value
    if (draft === null) return err({ kind: "content-not-found" })
    if (draft.editVersion !== command.expectedEditVersion) {
      return err({ kind: "content-conflict" })
    }

    const decision = decidePublishCurriculum({
      draft,
      now: dependencies.clock.now(),
    })
    if (decision.isErr()) return err(decision.error)

    const published = await dependencies.repository.publishDraft({
      expectedEditVersion: command.expectedEditVersion,
      nextDraftId: createCurriculumVersionId(
        command.courseId,
        draft.revision + 1
      ),
      publishedRevision: decision.value,
    })
    if (published.isErr()) return err(published.error)

    return published.map((revision) => ({
      curriculumVersionId: revision.curriculumVersionId,
      publishedAt: revision.publishedAt,
      revision: revision.revision,
    }))
  }
}
