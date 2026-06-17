import { serve } from "bun"
import OpenAI from "openai"
import {
  createAiFeedbackService,
  defaultAiFeedbackAttemptPolicy,
} from "@workspace/core/ai-feedback"
import {
  calculateCurrentStreakDays,
  createLearningService,
  type LearningDateKey,
  type ProgressReader,
} from "@workspace/core/learning"
import { contentStatuses, lessonProgressStatuses } from "@workspace/core/status"
import {
  createDrizzleAiFeedbackRepository,
  createDrizzleContentRepository,
  createDrizzleLearningRepository,
  createKwepDatabase,
  learnerActivityDays,
  learnerLessonProgress,
  lessons,
} from "@workspace/db"
import {
  createAppLogger,
  createRequestLogger,
  defaultRequestLoggingRuntime,
} from "@workspace/logger"
import { and, count, desc, eq } from "drizzle-orm"

import { createApp } from "@/app"
import { createLearnerAuth, createLearnerSessionResolver } from "@/auth/auth"
import { parseApiEnv } from "@/env"
import {
  createOpenAiFeedbackProvider,
  createUnavailableAiFeedbackProvider,
} from "@/openai/openai-feedback-provider"
import type { ProfileReader } from "@/routes/profile.route"

const env = parseApiEnv(process.env)
const database = createKwepDatabase(env.databaseUrl)
const logger = createAppLogger()
const contentRepository = createDrizzleContentRepository(database.db)
const feedbackRepository = createDrizzleAiFeedbackRepository(database.db)
const learningRepository = createDrizzleLearningRepository(database.db)
const progressReader = createProgressReader(database.db)
const auth = createLearnerAuth({
  authBaseUrl: env.authBaseUrl,
  cookieDomain: env.cookieDomain,
  db: database.db,
  googleClientId: env.googleClientId,
  googleClientSecret: env.googleClientSecret,
  secret: env.betterAuthSecret,
  webOrigin: env.webOrigin,
})
const aiFeedbackProvider =
  env.openAiApiKey === undefined
    ? createUnavailableAiFeedbackProvider()
    : createOpenAiFeedbackProvider({
        client: new OpenAI({
          apiKey: env.openAiApiKey,
        }),
        model: env.openAiModel,
      })
const app = createApp({
  aiFeedbackService: createAiFeedbackService({
    attemptPolicy: defaultAiFeedbackAttemptPolicy,
    contentRepository,
    feedbackRepository,
    provider: aiFeedbackProvider,
  }),
  authHandler: auth.handler,
  contentRepository,
  learningService: createLearningService({
    contentRepository,
    learningRepository,
  }),
  profileReader: createProfileReader(database.db),
  progressReader,
  requestLogger: createRequestLogger(logger),
  requestLoggingRuntime: defaultRequestLoggingRuntime,
  sessionResolver: createLearnerSessionResolver(auth, database.db),
  webOrigin: env.webOrigin,
})

if (import.meta.main) {
  serve({
    fetch: app.fetch,
    port: env.port,
  })
}

export { app }

function createProfileReader(db: typeof database.db): ProfileReader {
  return {
    async readProfileStats(userId) {
      const [completedLessons, totalLessons, activity] = await Promise.all([
        countCompletedLessons(db, userId),
        countActiveLessons(db),
        readActivity(db, userId),
      ])

      return {
        completedLessons,
        currentStreakDays: calculateCurrentStreakDays(
          activity.map((day) => day.activityDate)
        ),
        lastActiveDate: activity[0]?.activityDate ?? null,
        progressPercent:
          totalLessons === 0
            ? 0
            : Math.round((completedLessons / totalLessons) * 100),
        totalLessons,
      }
    },
  }
}

function createProgressReader(db: typeof database.db): ProgressReader {
  return {
    async readLearnerProgress(userId) {
      const [progressRows, activity] = await Promise.all([
        Promise.resolve(
          db
            .select({
              currentStepIndex: learnerLessonProgress.currentStepIndex,
              lessonId: learnerLessonProgress.lessonId,
              status: learnerLessonProgress.status,
            })
            .from(learnerLessonProgress)
            .where(eq(learnerLessonProgress.userId, userId))
            .all()
        ),
        readActivity(db, userId),
      ])

      return {
        currentStreakDays: calculateCurrentStreakDays(
          activity.map((day) => day.activityDate)
        ),
        lessonProgress: progressRows,
      }
    },
  }
}

function countCompletedLessons(
  db: typeof database.db,
  userId: string
): Promise<number> {
  return Promise.resolve(
    db
      .select({ value: count() })
      .from(learnerLessonProgress)
      .where(
        and(
          eq(learnerLessonProgress.userId, userId),
          eq(learnerLessonProgress.status, lessonProgressStatuses.completed)
        )
      )
      .get()?.value ?? 0
  )
}

function countActiveLessons(db: typeof database.db): Promise<number> {
  return Promise.resolve(
    db
      .select({ value: count() })
      .from(lessons)
      .where(eq(lessons.status, contentStatuses.active))
      .get()?.value ?? 0
  )
}

function readActivity(db: typeof database.db, userId: string) {
  return Promise.resolve(
    db
      .select({ activityDate: learnerActivityDays.activityDate })
      .from(learnerActivityDays)
      .where(eq(learnerActivityDays.userId, userId))
      .orderBy(desc(learnerActivityDays.activityDate))
      .all()
      .map((activity) => ({
        activityDate: activity.activityDate as LearningDateKey,
      }))
  )
}
