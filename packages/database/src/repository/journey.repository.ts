import { asc, count, eq } from "drizzle-orm"

import type {
  JourneyId,
  SessionId,
  StepId,
  JourneyRepository,
  JourneySummary,
  JourneyDetail,
  JourneySessionSummary,
  JourneySessionDetail,
  StepSummary,
  JourneyCategory,
} from "@workspace/core"

import { journeys } from "../schema/journeys"
import { journeySessions } from "../schema/journey-sessions"
import { steps } from "../schema/steps"
import type { DbClient, JourneySessionRow } from "../types/index"

function mapSessionSummary(row: JourneySessionRow): JourneySessionSummary {
  return {
    id: row.id as unknown as SessionId,
    journeyId: row.journeyId as unknown as JourneyId,
    order: row.order,
    title: row.title,
    description: row.description,
    estimatedMinutes: row.estimatedMinutes,
  }
}

export function createJourneyRepository(database: DbClient): JourneyRepository {
  return {
    async list(filters?: {
      category?: JourneyCategory
    }): Promise<JourneySummary[]> {
      const baseQuery = database.select().from(journeys)

      const rows = filters?.category
        ? await baseQuery
            .where(eq(journeys.category, filters.category))
            .orderBy(asc(journeys.id))
        : await baseQuery.orderBy(asc(journeys.id))

      const sessionCounts = await database
        .select({
          journeyId: journeySessions.journeyId,
          count: count(),
        })
        .from(journeySessions)
        .groupBy(journeySessions.journeyId)

      const countMap = new Map(
        sessionCounts.map((r) => [r.journeyId, Number(r.count)])
      )

      return rows.map((row) => ({
        id: row.id as unknown as JourneyId,
        title: row.title,
        description: row.description,
        category: row.category as JourneyCategory,
        thumbnailUrl: row.thumbnailUrl,
        sessionCount: countMap.get(row.id) ?? 0,
      }))
    },

    async getById(journeyId: JourneyId): Promise<JourneyDetail | null> {
      const id = journeyId as unknown as number
      const journey = await database
        .select()
        .from(journeys)
        .where(eq(journeys.id, id))
        .limit(1)
        .then((rows) => rows[0] ?? null)

      if (!journey) return null

      const sessions = await database
        .select()
        .from(journeySessions)
        .where(eq(journeySessions.journeyId, id))
        .orderBy(asc(journeySessions.order))

      return {
        id: journey.id as unknown as JourneyId,
        title: journey.title,
        description: journey.description,
        category: journey.category as JourneyCategory,
        thumbnailUrl: journey.thumbnailUrl,
        sessionCount: sessions.length,
        sessions: sessions.map(mapSessionSummary),
      }
    },

    async getSessionDetail(
      sessionId: SessionId
    ): Promise<JourneySessionDetail | null> {
      const id = sessionId as unknown as number
      const session = await database
        .select()
        .from(journeySessions)
        .where(eq(journeySessions.id, id))
        .limit(1)
        .then((rows) => rows[0] ?? null)

      if (!session) return null

      const sessionSteps = await database
        .select()
        .from(steps)
        .where(eq(steps.sessionId, id))
        .orderBy(asc(steps.order))

      return {
        ...mapSessionSummary(session),
        steps: sessionSteps.map((step) => ({
          id: step.id as unknown as StepId,
          sessionId: step.sessionId as unknown as SessionId,
          order: step.order,
          type: step.type as StepSummary["type"],
          contentJson: step.contentJson,
        })),
      }
    },
  }
}
