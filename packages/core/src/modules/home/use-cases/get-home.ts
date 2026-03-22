import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type { DraftRepository } from "../../drafts/draft-port"
import type { PromptRepository } from "../../prompts/prompt-port"
import type { HomeSnapshot } from "../home-types"

export type GetHomeDeps = {
  readonly draftRepository: DraftRepository
  readonly promptRepository: PromptRepository
}

export function makeGetHomeUseCase(deps: GetHomeDeps) {
  return (userId: UserId): ResultAsync<HomeSnapshot, never> =>
    ResultAsync.fromSafePromise(
      Promise.all([
        deps.promptRepository.listTodayPrompts(userId, 4),
        deps.draftRepository.resume(userId),
        deps.draftRepository.list(userId, 10),
        deps.promptRepository.listSaved(userId, 10),
      ]).then(([todayPrompts, resumeDraft, recentDrafts, savedPrompts]) => ({
        recentDrafts,
        resumeDraft,
        savedPrompts,
        todayPrompts,
      }))
    )
}
