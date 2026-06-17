import { or, isNull, ne } from "drizzle-orm"

import { learnerAccountStatuses } from "@workspace/core/status"
import { addLearningCalendarDays } from "@workspace/db/repositories/activity-date"
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
): Map<string, string[]> {
  const activityDatesByUserId = new Map<string, string[]>()

  for (const activity of activities) {
    const activityDates = activityDatesByUserId.get(activity.userId) ?? []

    activityDates.push(activity.activityDate)
    activityDates.sort((left, right) => right.localeCompare(left))
    activityDatesByUserId.set(activity.userId, activityDates)
  }

  return activityDatesByUserId
}

export function calculateCurrentStreakDays(
  activityDates: readonly string[]
): number {
  if (activityDates.length === 0) {
    return 0
  }

  const activitySet = new Set(activityDates)
  const latestActivityDate = activityDates[0]
  let streak = 0
  let cursor = latestActivityDate

  while (cursor !== undefined && activitySet.has(cursor)) {
    streak += 1
    cursor = addLearningCalendarDays(cursor, -1)
  }

  return streak
}
