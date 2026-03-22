import type { RecommendationHistoryEntry } from "./daily-recommendation-types"
import { getKstDateString } from "./kst-date"

const MAX_WEIGHT = 100

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime()
  const b = new Date(dateB).getTime()
  return Math.abs(Math.round((b - a) / (1000 * 60 * 60 * 24)))
}

export function selectWeightedPrompts(
  allPromptIds: readonly number[],
  recentHistory: readonly RecommendationHistoryEntry[],
  count: number,
  today: string,
  random: () => number = Math.random
): number[] {
  if (allPromptIds.length <= count) {
    return [...allPromptIds]
  }

  const lastRecommendedMap = new Map<number, number>()
  for (const entry of recentHistory) {
    if (!lastRecommendedMap.has(entry.promptId)) {
      lastRecommendedMap.set(entry.promptId, daysBetween(entry.date, today))
    }
  }

  const remaining = [...allPromptIds]
  const weights = remaining.map((id) => {
    const daysAgo = lastRecommendedMap.get(id)
    if (daysAgo === undefined) return MAX_WEIGHT
    return Math.max(daysAgo, 1)
  })

  const selected: number[] = []

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let r = random() * totalWeight

    for (let j = 0; j < remaining.length; j++) {
      r -= weights[j]!
      if (r <= 0) {
        selected.push(remaining[j]!)
        remaining.splice(j, 1)
        weights.splice(j, 1)
        break
      }
    }
  }

  return selected
}
