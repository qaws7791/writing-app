import { err, errAsync, ok, ResultAsync } from "neverthrow"
import { match } from "ts-pattern"

import type { DraftId, UserId } from "../../../shared/brand/index"
import type { DraftContent } from "../../../shared/schema/index"
import { extractDraftTextMetrics } from "../../../shared/utilities/draft-content-utilities"
import type { Draft, DraftDetail } from "../draft-types"
import type { DraftRepository } from "../draft-port"
import { updateDraftContent, updateDraftTitle } from "../draft-operations"
import {
  draftForbidden,
  draftNotFound,
  draftValidationFailed,
  type DraftModuleError,
} from "../draft-error"

export type AutosaveDraftInput = {
  readonly content?: DraftContent
  readonly title?: string
}

export type AutosaveDraftDeps = {
  readonly draftRepository: DraftRepository
  readonly getNow: () => string
}

function toDraft(detail: DraftDetail): Draft {
  const metrics = extractDraftTextMetrics(detail.content)

  return {
    characterCount: detail.characterCount,
    content: detail.content,
    createdAt: detail.createdAt,
    id: detail.id,
    lastSavedAt: detail.lastSavedAt,
    plainText: metrics.plainText,
    preview: detail.preview,
    sourcePromptId: detail.sourcePromptId,
    title: detail.title,
    updatedAt: detail.updatedAt,
    wordCount: detail.wordCount,
  }
}

export function makeAutosaveDraftUseCase(deps: AutosaveDraftDeps) {
  return (
    userId: UserId,
    draftId: DraftId,
    input: AutosaveDraftInput
  ): ResultAsync<DraftDetail, DraftModuleError> => {
    if (input.title === undefined && input.content === undefined) {
      return errAsync(
        draftValidationFailed("변경할 제목 또는 본문이 필요합니다.")
      )
    }

    return ResultAsync.fromSafePromise(
      deps.draftRepository.getById(userId, draftId)
    )
      .andThen((existing) =>
        match(existing)
          .with({ kind: "draft" }, ({ draft }) => ok(draft))
          .with({ kind: "not-found" }, () =>
            err(draftNotFound("초안을 찾을 수 없습니다.", draftId))
          )
          .with({ kind: "forbidden" }, ({ ownerId }) =>
            err(
              draftForbidden(
                "다른 사용자의 초안에는 접근할 수 없습니다.",
                ownerId
              )
            )
          )
          .exhaustive()
      )
      .andThen((existingDraft) => {
        const now = deps.getNow()
        const nextTitle = input.title ?? existingDraft.title
        const nextContent = input.content ?? existingDraft.content

        let updated = updateDraftTitle(toDraft(existingDraft), nextTitle, now)
        if (input.content !== undefined) {
          updated = updateDraftContent(updated, nextContent, now)
        }

        return ResultAsync.fromSafePromise(
          deps.draftRepository.replace(userId, draftId, {
            characterCount: updated.characterCount,
            content: updated.content,
            plainText: updated.plainText,
            sourcePromptId: updated.sourcePromptId,
            title: updated.title,
            wordCount: updated.wordCount,
          })
        ).andThen((persisted) =>
          match(persisted)
            .with({ kind: "draft" }, ({ draft }) => ok(draft))
            .with({ kind: "not-found" }, () =>
              err(draftNotFound("초안을 찾을 수 없습니다.", draftId))
            )
            .with({ kind: "forbidden" }, ({ ownerId }) =>
              err(
                draftForbidden(
                  "다른 사용자의 초안에는 접근할 수 없습니다.",
                  ownerId
                )
              )
            )
            .exhaustive()
        )
      })
  }
}
