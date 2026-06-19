import { or, isNull, ne } from "drizzle-orm"

import {
  calculateCurrentStreakDays,
  type LearningDateKey,
} from "@workspace/core/modules/learning/domain/learning-date"
import { learnerAccountStatuses } from "@workspace/core/shared/kernel/status"
import { learnerActivityDays, learnerProfiles } from "@workspace/db/schema"

export type PageInput = {
  readonly page: number
  readonly pageSize: number
}

export type PageBounds = {
  readonly offset: number
  readonly page: number
  readonly pageSize: number
  readonly totalItems: number
  readonly totalPages: number
}

export function createPageBounds(
  input: PageInput,
  totalItems: number
): PageBounds {
  const totalPages = Math.max(1, Math.ceil(totalItems / input.pageSize))
  const page = Math.min(Math.max(1, input.page), totalPages)

  return {
    offset: (page - 1) * input.pageSize,
    page,
    pageSize: input.pageSize,
    totalItems,
    totalPages,
  }
}

export function createActiveLearnerCondition() {
  return or(
    isNull(learnerProfiles.status),
    ne(learnerProfiles.status, learnerAccountStatuses.deleted)
  )
}

export function groupActivityDatesByUserId(
  activities: readonly (typeof learnerActivityDays.$inferSelect)[]
): Map<string, LearningDateKey[]> {
  const activityDatesByUserId = new Map<string, LearningDateKey[]>()

  for (const activity of activities) {
    const activityDates = activityDatesByUserId.get(activity.userId) ?? []

    activityDates.push(activity.activityDate as LearningDateKey)
    activityDates.sort((left, right) => right.localeCompare(left))
    activityDatesByUserId.set(activity.userId, activityDates)
  }

  return activityDatesByUserId
}

export { calculateCurrentStreakDays }
