import { asc, count, eq } from "drizzle-orm"

import { journeys, type JourneyCategory } from "../schema/journeys"
import { journeySessions } from "../schema/journey-sessions"
import { steps } from "../schema/steps"
import type { DbClient, JourneySessionRow } from "../types/index"

export type JourneySummary = {
  id: number
  title: string
  description: string
  category: string
  thumbnailUrl: string | null
  sessionCount: number
}

export type JourneyDetail = JourneySummary & {
  sessions: JourneySessionSummary[]
}

export type JourneySessionSummary = {
  id: number
  journeyId: number
  order: number
  title: string
  description: string
  estimatedMinutes: number
}

export type JourneySessionDetail = JourneySessionSummary & {
  steps: StepSummary[]
}

export type StepSummary = {
  id: number
  sessionId: number
  order: number
  type: string
  contentJson: unknown
}

export type JourneyRepository = {
  list: (filters?: { category?: JourneyCategory }) => Promise<JourneySummary[]>
  getById: (journeyId: number) => Promise<JourneyDetail | null>
  getSessionDetail: (sessionId: number) => Promise<JourneySessionDetail | null>
}

export function createJourneyRepository(database: DbClient): JourneyRepository {
  return {
    async list(filters = {}) {
      const baseQuery = database.select().from(journeys)

      const rows = filters.category
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
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        thumbnailUrl: row.thumbnailUrl,
        sessionCount: countMap.get(row.id) ?? 0,
      }))
    },

    async getById(journeyId) {
      const journey = await database
        .select()
        .from(journeys)
        .where(eq(journeys.id, journeyId))
        .limit(1)
        .then((rows) => rows[0] ?? null)

      if (!journey) return null

      const sessions = await database
        .select()
        .from(journeySessions)
        .where(eq(journeySessions.journeyId, journeyId))
        .orderBy(asc(journeySessions.order))

      return {
        id: journey.id,
        title: journey.title,
        description: journey.description,
        category: journey.category,
        thumbnailUrl: journey.thumbnailUrl,
        sessionCount: sessions.length,
        sessions: sessions.map(mapSessionSummary),
      }
    },

    async getSessionDetail(sessionId) {
      const session = await database
        .select()
        .from(journeySessions)
        .where(eq(journeySessions.id, sessionId))
        .limit(1)
        .then((rows) => rows[0] ?? null)

      if (!session) return null

      const sessionSteps = await database
        .select()
        .from(steps)
        .where(eq(steps.sessionId, sessionId))
        .orderBy(asc(steps.order))

      return {
        ...mapSessionSummary(session),
        steps: sessionSteps.map((step) => ({
          id: step.id,
          sessionId: step.sessionId,
          order: step.order,
          type: step.type,
          contentJson: step.contentJson,
        })),
      }
    },
  }
}

function mapSessionSummary(row: JourneySessionRow): JourneySessionSummary {
  return {
    id: row.id,
    journeyId: row.journeyId,
    order: row.order,
    title: row.title,
    description: row.description,
    estimatedMinutes: row.estimatedMinutes,
  }
}
