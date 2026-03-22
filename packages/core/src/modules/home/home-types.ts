import type { DraftSummary } from "../drafts/draft-types"
import type { PromptSummary } from "../prompts/prompt-types"

export type HomeSnapshot = {
  readonly recentDrafts: readonly DraftSummary[]
  readonly resumeDraft: DraftSummary | null
  readonly savedPrompts: readonly PromptSummary[]
  readonly todayPrompts: readonly PromptSummary[]
}
