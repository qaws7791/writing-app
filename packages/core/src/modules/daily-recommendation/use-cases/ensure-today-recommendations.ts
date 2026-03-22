import type { DailyRecommendationRepository } from "../daily-recommendation-port"
import { getKstDateString } from "../kst-date"
import { selectWeightedPrompts } from "../weighted-selection"

const DAILY_PROMPT_COUNT = 2
const HISTORY_LOOKBACK = 200

export type EnsureTodayRecommendationsDeps = {
  readonly dailyRecommendationRepository: DailyRecommendationRepository
  readonly getNow?: () => Date
}

export function makeEnsureTodayRecommendationsUseCase(
  deps: EnsureTodayRecommendationsDeps
) {
  return async (): Promise<void> => {
    const now = deps.getNow?.() ?? new Date()
    const today = getKstDateString(now)

    const exists = await deps.dailyRecommendationRepository.existsForDate(today)
    if (exists) return

    const [allPromptIds, history] = await Promise.all([
      deps.dailyRecommendationRepository.getAllPromptIds(),
      deps.dailyRecommendationRepository.getRecentHistory(HISTORY_LOOKBACK),
    ])

    if (allPromptIds.length === 0) return

    const selected = selectWeightedPrompts(
      allPromptIds,
      history,
      DAILY_PROMPT_COUNT,
      today
    )

    const entries = selected.map((promptId, index) => ({
      displayOrder: index + 1,
      promptId,
    }))

    await deps.dailyRecommendationRepository.create(today, entries)
    await deps.dailyRecommendationRepository.refreshTodayFlags(entries)
  }
}
