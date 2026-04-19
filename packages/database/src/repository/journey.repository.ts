import { asc, count, eq, inArray } from "drizzle-orm"

import type {
  JourneyId,
  SessionId,
  StepId,
  JourneyRepository,
  JourneySummary,
  JourneyDetail,
  JourneyFullDetail,
  JourneySessionSummary,
  JourneySessionDetail,
  StepSummary,
  JourneyCategory,
  CreateJourneyInput,
  UpdateJourneyInput,
  CreateSessionInput,
  UpdateSessionInput,
  CreateStepInput,
  UpdateStepInput,
} from "@workspace/core"

import { journeys } from "../schema/journeys"
import { journeySessions } from "../schema/journey-sessions"
import { steps } from "../schema/steps"
import type { DbClient, JourneySessionRow, StepRow } from "../types/index"

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

function mapStepSummary(step: StepRow): StepSummary {
  return {
    id: step.id,
    sessionId: step.sessionId,
    order: step.order,
    type: step.type as StepSummary["type"],
    contentJson: step.contentJson,
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
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category as JourneyCategory,
        thumbnailUrl: row.thumbnailUrl,
        sessionCount: countMap.get(row.id) ?? 0,
      }))
    },

    async getById(journeyId: JourneyId): Promise<JourneyDetail | null> {
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
        category: journey.category as JourneyCategory,
        thumbnailUrl: journey.thumbnailUrl,
        sessionCount: sessions.length,
        sessions: sessions.map(mapSessionSummary),
      }
    },

    async getByIdFull(journeyId: JourneyId): Promise<JourneyFullDetail | null> {
      const journey = await database
        .select()
        .from(journeys)
        .where(eq(journeys.id, journeyId))
        .limit(1)
        .then((rows) => rows[0] ?? null)

      if (!journey) return null

      const sessionRows = await database
        .select()
        .from(journeySessions)
        .where(eq(journeySessions.journeyId, journeyId))
        .orderBy(asc(journeySessions.order))

      const sessionIds = sessionRows.map((s) => s.id)
      const allSteps =
        sessionIds.length > 0
          ? await database
              .select()
              .from(steps)
              .where(
                sessionIds.length === 1
                  ? eq(steps.sessionId, sessionIds[0]!)
                  : inArray(steps.sessionId, sessionIds)
              )
              .orderBy(asc(steps.order))
          : []

      const stepsBySession = new Map<SessionId, StepRow[]>()
      for (const step of allSteps) {
        const list = stepsBySession.get(step.sessionId) ?? []
        list.push(step)
        stepsBySession.set(step.sessionId, list)
      }

      return {
        id: journey.id,
        title: journey.title,
        description: journey.description,
        category: journey.category as JourneyCategory,
        thumbnailUrl: journey.thumbnailUrl,
        sessionCount: sessionRows.length,
        sessions: sessionRows.map((session) => ({
          ...mapSessionSummary(session),
          steps: (stepsBySession.get(session.id) ?? []).map(mapStepSummary),
        })),
      }
    },

    async getSessionDetail(
      sessionId: SessionId
    ): Promise<JourneySessionDetail | null> {
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
        steps: sessionSteps.map(mapStepSummary),
      }
    },

    async listSessions(journeyId: JourneyId): Promise<JourneySessionSummary[]> {
      const rows = await database
        .select()
        .from(journeySessions)
        .where(eq(journeySessions.journeyId, journeyId))
        .orderBy(asc(journeySessions.order))
      return rows.map(mapSessionSummary)
    },

    async create(input: CreateJourneyInput): Promise<JourneySummary> {
      const [row] = await database
        .insert(journeys)
        .values({
          title: input.title,
          description: input.description,
          category: input.category,
          thumbnailUrl: input.thumbnailUrl ?? null,
        })
        .returning()
      return {
        id: row!.id,
        title: row!.title,
        description: row!.description,
        category: row!.category as JourneyCategory,
        thumbnailUrl: row!.thumbnailUrl,
        sessionCount: 0,
      }
    },

    async update(
      journeyId: JourneyId,
      input: UpdateJourneyInput
    ): Promise<JourneySummary | null> {
      const [row] = await database
        .update(journeys)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(journeys.id, journeyId))
        .returning()
      if (!row) return null
      const sessionCount = await database
        .select({ count: count() })
        .from(journeySessions)
        .where(eq(journeySessions.journeyId, journeyId))
        .then((rows) => Number(rows[0]?.count ?? 0))
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category as JourneyCategory,
        thumbnailUrl: row.thumbnailUrl,
        sessionCount,
      }
    },

    async delete(journeyId: JourneyId): Promise<void> {
      await database.delete(journeys).where(eq(journeys.id, journeyId))
    },

    async createSession(
      journeyId: JourneyId,
      input: CreateSessionInput
    ): Promise<JourneySessionSummary> {
      const [row] = await database
        .insert(journeySessions)
        .values({
          journeyId,
          title: input.title,
          description: input.description,
          estimatedMinutes: input.estimatedMinutes,
          order: input.order,
        })
        .returning()
      return mapSessionSummary(row!)
    },

    async updateSession(
      sessionId: SessionId,
      input: UpdateSessionInput
    ): Promise<JourneySessionSummary | null> {
      const [row] = await database
        .update(journeySessions)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(journeySessions.id, sessionId))
        .returning()
      if (!row) return null
      return mapSessionSummary(row)
    },

    async deleteSession(sessionId: SessionId): Promise<void> {
      await database
        .delete(journeySessions)
        .where(eq(journeySessions.id, sessionId))
    },

    async createStep(
      sessionId: SessionId,
      input: CreateStepInput
    ): Promise<StepSummary> {
      const [row] = await database
        .insert(steps)
        .values({
          sessionId,
          type: input.type,
          order: input.order,
          contentJson: input.contentJson,
        })
        .returning()
      return mapStepSummary(row!)
    },

    async updateStep(
      stepId: StepId,
      input: UpdateStepInput
    ): Promise<StepSummary | null> {
      const [row] = await database
        .update(steps)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(steps.id, stepId))
        .returning()
      if (!row) return null
      return mapStepSummary(row)
    },

    async deleteStep(stepId: StepId): Promise<void> {
      await database.delete(steps).where(eq(steps.id, stepId))
    },
  }
}
