import { ResultAsync } from "neverthrow"

import type { UserId } from "../../../shared/brand/index"
import type { JourneySummary } from "../../journeys/journey-types"
import type { ProgressRepository } from "../progress-port"

export type ListUserJourneysDeps = {
  readonly progressRepository: ProgressRepository
}

export function makeListUserJourneysUseCase(deps: ListUserJourneysDeps) {
  return (
    userId: UserId,
    status: "in_progress" | "completed"
  ): ResultAsync<JourneySummary[], never> =>
    ResultAsync.fromSafePromise(
      deps.progressRepository
        .listUserJourneyItems(userId, status)
        .then((items) =>
          items.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            thumbnailUrl: item.thumbnailUrl,
            sessionCount: item.sessionCount,
          }))
        )
    )
}
