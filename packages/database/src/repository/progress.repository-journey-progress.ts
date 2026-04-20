import { and, count, eq } from "drizzle-orm"

import type {
  JourneyId,
  JourneyProgressStatus,
  ProgressRepository,
  UserId,
} from "@workspace/core"

import { journeySessions } from "../schema/journey-sessions"
import { journeys } from "../schema/journeys"
import { userJourneyProgress } from "../schema/user-journey-progress"
import type { DbExecutor } from "../types/index"
import {
  mapJourneyProgress,
  mapUserJourneyListItem,
} from "./progress.repository-mappers"

type JourneyProgressMethods = Pick<
  ProgressRepository,
  | "enrollJourney"
  | "getJourneyProgress"
  | "listActiveJourneys"
  | "listCompletedJourneys"
  | "listUserJourneyItems"
  | "updateJourneyProgress"
>

export function createJourneyProgressMethods(
  database: DbExecutor
): JourneyProgressMethods {
  const journeySessionCountSq = database
    .select({
      journeyId: journeySessions.journeyId,
      sessionCount: count().as("sessionCount"),
    })
    .from(journeySessions)
    .groupBy(journeySessions.journeyId)
    .as("journey_session_count_sq")

  return {
    async getJourneyProgress(userId: UserId, journeyId: JourneyId) {
      const row = await database
        .select()
        .from(userJourneyProgress)
        .where(
          and(
            eq(userJourneyProgress.userId, userId),
            eq(userJourneyProgress.journeyId, journeyId)
          )
        )
        .limit(1)
        .then((rows) => rows[0] ?? null)

      return row ? mapJourneyProgress(row) : null
    },

    async listActiveJourneys(userId: UserId) {
      const rows = await database
        .select()
        .from(userJourneyProgress)
        .where(
          and(
            eq(userJourneyProgress.userId, userId),
            eq(userJourneyProgress.status, "in_progress")
          )
        )

      return rows.map(mapJourneyProgress)
    },

    async listCompletedJourneys(userId: UserId) {
      const rows = await database
        .select()
        .from(userJourneyProgress)
        .where(
          and(
            eq(userJourneyProgress.userId, userId),
            eq(userJourneyProgress.status, "completed")
          )
        )

      return rows.map(mapJourneyProgress)
    },

    async listUserJourneyItems(userId: UserId, status: JourneyProgressStatus) {
      const rows = await database
        .select({
          journeyId: userJourneyProgress.journeyId,
          currentSessionOrder: userJourneyProgress.currentSessionOrder,
          completionRate: userJourneyProgress.completionRate,
          status: userJourneyProgress.status,
          title: journeys.title,
          description: journeys.description,
          category: journeys.category,
          thumbnailUrl: journeys.thumbnailUrl,
          sessionCount: journeySessionCountSq.sessionCount,
        })
        .from(userJourneyProgress)
        .innerJoin(journeys, eq(userJourneyProgress.journeyId, journeys.id))
        .leftJoin(
          journeySessionCountSq,
          eq(journeySessionCountSq.journeyId, journeys.id)
        )
        .where(
          and(
            eq(userJourneyProgress.userId, userId),
            eq(userJourneyProgress.status, status)
          )
        )

      return rows.map(mapUserJourneyListItem)
    },

    async enrollJourney(userId: UserId, journeyId: JourneyId) {
      const now = new Date()
      const row = await database
        .insert(userJourneyProgress)
        .values({
          userId,
          journeyId,
          currentSessionOrder: 1,
          completionRate: 0,
          status: "in_progress",
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing()
        .returning()
        .then((rows) => rows[0] ?? null)

      if (row) {
        return mapJourneyProgress(row)
      }

      const existing = await this.getJourneyProgress(userId, journeyId)
      if (!existing) {
        throw new Error("여정 진행 상태를 찾지 못했습니다.")
      }

      return existing
    },

    async updateJourneyProgress(userId, journeyId, update) {
      await database
        .update(userJourneyProgress)
        .set({
          ...(update.currentSessionOrder !== undefined && {
            currentSessionOrder: update.currentSessionOrder,
          }),
          ...(update.completionRate !== undefined && {
            completionRate: update.completionRate,
          }),
          ...(update.status !== undefined && { status: update.status }),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userJourneyProgress.userId, userId),
            eq(userJourneyProgress.journeyId, journeyId)
          )
        )
    },
  }
}
