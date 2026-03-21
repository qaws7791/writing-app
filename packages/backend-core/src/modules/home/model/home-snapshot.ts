import type { DraftSummary, PromptSummary } from "../../../shared/ports/index"

/**
 * Home page snapshot.
 * Contains curated content for the home screen.
 */
export type HomeSnapshot = {
  readonly recentDrafts: readonly DraftSummary[]
  readonly resumeDraft: DraftSummary | null
  readonly savedPrompts: readonly PromptSummary[]
  readonly todayPrompts: readonly PromptSummary[]
}
