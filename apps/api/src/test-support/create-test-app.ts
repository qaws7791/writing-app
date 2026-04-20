import {
  createValidationError,
  type DomainError,
  toJourneyId,
  toPromptId,
  toSessionId,
  toStepId,
  toUserId,
  toWritingId,
} from "@workspace/core/shared"
import {
  writingNotFound,
  writingForbidden,
} from "@workspace/core/modules/writings"
import { promptNotFound } from "@workspace/core/modules/prompts"
import { journeyNotFound } from "@workspace/core/modules/journeys"
import { okAsync, errAsync } from "neverthrow"
import { cors } from "hono/cors"

import {
  createUseCaseMiddleware,
  createTimeoutMiddleware,
  handleRequestError,
} from "../app.js"
import { createApp } from "../lib/hono/create-app.js"
import { createRequestLoggerMiddleware } from "../middleware/request-logger.js"
import { createResolveSessionMiddleware } from "../middleware/resolve-session.js"
import { createSilentLogger, type ApiLogger } from "../observability/logger.js"
import { createMemoryRateLimitBackend } from "../rate-limit/rate-limit-backend.js"
import { allRoutes } from "../routes/index.js"
import type { AppEnv } from "../app-env.js"

type TestPrompt = {
  id: number
  promptType: "sensory" | "reflection" | "opinion"
  title: string
  body: string
  thumbnailUrl: string
  responseCount: number
  isBookmarked: boolean
}

type StoredWriting = {
  bodyJson: unknown
  bodyPlainText: string
  createdAt: string
  id: number
  ownerId: string
  preview: string
  sourcePromptId: number | null
  title: string
  updatedAt: string
  wordCount: number
}

const seedPrompts: TestPrompt[] = [
  {
    id: 1,
    promptType: "reflection",
    title: "생각이 바뀐 순간",
    body: "최근에 내 생각이 바뀐 순간은?",
    thumbnailUrl: "",
    responseCount: 0,
    isBookmarked: false,
  },
  {
    id: 2,
    promptType: "opinion",
    title: "익숙함을 떠나기 어려운 이유",
    body: "사람들은 왜 익숙한 것을 떠나기 어려울까?",
    thumbnailUrl: "",
    responseCount: 0,
    isBookmarked: false,
  },
  {
    id: 3,
    promptType: "sensory",
    title: "하루의 조용한 순간",
    body: "내 하루에서 가장 조용한 순간은 언제인가요?",
    thumbnailUrl: "",
    responseCount: 0,
    isBookmarked: false,
  },
]

function toPreview(plainText: string): string {
  return plainText.length <= 120 ? plainText : `${plainText.slice(0, 120)}...`
}

function createTestSession(userId: string) {
  return {
    session: {
      createdAt: "2026-03-20T00:00:00.000Z",
      expiresAt: "2026-03-27T00:00:00.000Z",
      id: `session-${userId}`,
      ipAddress: null,
      token: `token-${userId}`,
      updatedAt: "2026-03-20T00:00:00.000Z",
      userAgent: "vitest",
      userId,
    },
    user: {
      email: `${userId}@example.com`,
      emailVerified: true,
      id: userId,
      image: null,
      name: "테스트 사용자",
    },
  }
}

function createStubSessionRuntime(userId: string, sessionId: number) {
  return {
    id: toSessionId(sessionId),
    journeyId: toJourneyId(1),
    order: 1,
    title: "테스트 세션",
    description: "테스트용 세션 설명",
    estimatedMinutes: 10,
    steps: [
      {
        id: toStepId(1),
        sessionId: toSessionId(sessionId),
        order: 1,
        type: "WRITING" as const,
        contentJson: {
          cta: { label: "다음", variant: "primary" as const },
          content: {
            type: "WRITING" as const,
            guideline: "테스트 가이드",
            minLength: 1,
            prompt: "테스트 글을 작성해 주세요.",
            recommendedLength: 10,
            timeLimitSeconds: 0,
          },
          type: "WRITING" as const,
        },
      },
      {
        id: toStepId(2),
        sessionId: toSessionId(sessionId),
        order: 2,
        type: "AI_FEEDBACK" as const,
        contentJson: {
          cta: { label: "다음", variant: "primary" as const },
          content: {
            type: "AI_FEEDBACK" as const,
            loadingMessage: "AI가 분석 중입니다.",
            targetStepId: "1",
          },
          type: "AI_FEEDBACK" as const,
        },
      },
    ],
    currentStepOrder: 1,
    status: "in_progress" as const,
    stepResponsesJson: {},
    stepAiStates: [],
  }
}

export function createTestApi(input?: {
  homeError?: Error
  logger?: ApiLogger
  sessionDetailError?: DomainError
}) {
  const prompts = seedPrompts.map((prompt) => ({ ...prompt }))
  const writings: StoredWriting[] = []
  let nextWritingId = 1

  function findPrompt(promptId: number) {
    return prompts.find((prompt) => prompt.id === promptId) ?? null
  }

  function serializeWriting(writing: StoredWriting) {
    return {
      id: toWritingId(writing.id),
      title: writing.title,
      preview: writing.preview,
      wordCount: writing.wordCount,
      sourcePromptId:
        writing.sourcePromptId === null
          ? null
          : toPromptId(writing.sourcePromptId),
      createdAt: writing.createdAt,
      updatedAt: writing.updatedAt,
      bodyJson: writing.bodyJson,
      bodyPlainText: writing.bodyPlainText,
    }
  }

  const allowedOrigins = new Set([
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ])
  const logger = input?.logger ?? createSilentLogger()
  const rateLimitBackend = createMemoryRateLimitBackend()

  const app = createApp<AppEnv>({
    globalMiddleware: [
      cors({
        allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        origin: (origin) => {
          if (!origin) return null
          return allowedOrigins.has(origin) ? origin : null
        },
      }),
      createRequestLoggerMiddleware(logger),
      createResolveSessionMiddleware(async (request) => {
        if (request.headers.get("x-test-auth") === "none") {
          return null
        }
        const userId = request.headers.get("x-test-user-id") ?? "dev-user"
        return createTestSession(userId)
      }),
      createUseCaseMiddleware({
        authHandler: async () =>
          new Response(
            JSON.stringify({
              error: {
                code: "not_found",
                message: "테스트 인증 핸들러가 구성되지 않았습니다.",
              },
            }),
            {
              headers: { "content-type": "application/json" },
              status: 404,
            }
          ),
        autosaveWritingUseCase(userId, writingId, autosaveInput) {
          const current = writings.find(
            (writing) => writing.id === Number(writingId)
          )
          if (!current) {
            return errAsync(writingNotFound("글을 찾을 수 없습니다."))
          }
          if (current.ownerId !== String(userId)) {
            return errAsync(
              writingForbidden("다른 사용자의 글에는 접근할 수 없습니다.")
            )
          }

          const nextTitle = autosaveInput.title ?? current.title
          const nextBodyPlainText =
            autosaveInput.bodyPlainText ?? current.bodyPlainText
          const now = new Date().toISOString()

          current.bodyJson = autosaveInput.bodyJson ?? current.bodyJson
          current.bodyPlainText = nextBodyPlainText
          current.title = nextTitle
          current.preview = toPreview(nextBodyPlainText)
          current.updatedAt = now
          current.wordCount = autosaveInput.wordCount ?? current.wordCount

          return okAsync(serializeWriting(current))
        },
        countWritingsUseCase(userId) {
          return okAsync(
            writings.filter((writing) => writing.ownerId === String(userId))
              .length
          )
        },
        createWritingUseCase(userId, createInput) {
          const bodyPlainText = createInput.bodyPlainText ?? ""
          const now = new Date().toISOString()
          const created: StoredWriting = {
            bodyJson: createInput.bodyJson ?? null,
            bodyPlainText,
            createdAt: now,
            id: nextWritingId++,
            ownerId: String(userId),
            preview: toPreview(bodyPlainText),
            sourcePromptId:
              createInput.sourcePromptId === undefined
                ? null
                : Number(createInput.sourcePromptId),
            title: createInput.title ?? "",
            updatedAt: now,
            wordCount: createInput.wordCount ?? 0,
          }

          writings.push(created)
          return okAsync(serializeWriting(created))
        },
        deleteWritingUseCase(userId, writingId) {
          const index = writings.findIndex(
            (writing) => writing.id === Number(writingId)
          )
          if (index === -1) {
            return errAsync(writingNotFound("글을 찾을 수 없습니다."))
          }
          const writing = writings[index]
          if (!writing) {
            return errAsync(writingNotFound("글을 찾을 수 없습니다."))
          }
          if (writing.ownerId !== String(userId)) {
            return errAsync(
              writingForbidden("다른 사용자의 글에는 접근할 수 없습니다.")
            )
          }

          writings.splice(index, 1)
          return okAsync(undefined as void)
        },
        getWritingUseCase(userId, writingId) {
          const writing = writings.find((item) => item.id === Number(writingId))
          if (!writing) {
            return errAsync(writingNotFound("글을 찾을 수 없습니다."))
          }
          if (writing.ownerId !== String(userId)) {
            return errAsync(
              writingForbidden("다른 사용자의 글에는 접근할 수 없습니다.")
            )
          }

          return okAsync(serializeWriting(writing))
        },
        listWritingsUseCase(userId) {
          const items = writings
            .filter((writing) => writing.ownerId === String(userId))
            .sort((l, r) =>
              l.updatedAt === r.updatedAt
                ? r.id - l.id
                : r.updatedAt.localeCompare(l.updatedAt)
            )
            .map((writing) => ({
              id: toWritingId(writing.id),
              title: writing.title,
              preview: writing.preview,
              wordCount: writing.wordCount,
              sourcePromptId:
                writing.sourcePromptId === null
                  ? null
                  : toPromptId(writing.sourcePromptId),
              createdAt: writing.createdAt,
              updatedAt: writing.updatedAt,
            }))
          return okAsync({ items, nextCursor: null })
        },
        getHomeUseCase(_userId) {
          if (input?.homeError) {
            throw input.homeError
          }
          return okAsync({
            activeJourneys: [],
            showStartJourneyCta: true,
            showWritingSuggestion: true,
          })
        },
        healthCheckUseCase() {
          return {
            ai: {
              reason: "probe_not_configured" as const,
              status: "degraded" as const,
            },
            db: {
              latencyMs: 1,
              status: "ok" as const,
            },
            sqliteVersion: "3.46.0",
            status: "ok" as const,
          }
        },
        listPromptWritingsUseCase(_promptId, _userId, _params) {
          return okAsync({ items: [], nextCursor: null, hasMore: false })
        },
        getPromptUseCase(promptId, _userId) {
          const prompt = findPrompt(Number(promptId))
          if (!prompt) {
            return errAsync(promptNotFound("글감을 찾을 수 없습니다."))
          }

          return okAsync({
            id: toPromptId(prompt.id),
            promptType: prompt.promptType,
            title: prompt.title,
            body: prompt.body,
            thumbnailUrl: prompt.thumbnailUrl ?? "",
            responseCount: prompt.responseCount,
            isBookmarked: prompt.isBookmarked,
          })
        },
        listPromptsUseCase(_userId, filters) {
          const filtered = prompts
            .filter((prompt) => {
              if (
                filters?.promptType &&
                prompt.promptType !== filters.promptType
              ) {
                return false
              }
              if (
                filters?.cursor !== undefined &&
                prompt.id <= Number(filters.cursor)
              ) {
                return false
              }
              return true
            })
            .sort((left, right) => left.id - right.id)
          const limit = filters?.limit ?? 20
          const pageItems = filtered.slice(0, limit)
          const hasMore = filtered.length > limit
          const mappedItems = pageItems.map((prompt) => ({
            id: toPromptId(prompt.id),
            promptType: prompt.promptType,
            title: prompt.title,
            body: prompt.body,
            thumbnailUrl: prompt.thumbnailUrl ?? "",
            responseCount: prompt.responseCount,
            isBookmarked: prompt.isBookmarked,
          }))
          const lastItem = mappedItems[mappedItems.length - 1]
          return okAsync({
            items: mappedItems,
            nextCursor: hasMore && lastItem ? lastItem.id : null,
          })
        },
        bookmarkPromptUseCase(_userId, promptId) {
          const prompt = findPrompt(Number(promptId))
          if (!prompt) {
            return errAsync(promptNotFound("글감을 찾을 수 없습니다."))
          }
          const savedAt = new Date().toISOString()
          prompt.isBookmarked = true
          return okAsync({ savedAt })
        },
        unbookmarkPromptUseCase(_userId, promptId) {
          const prompt = findPrompt(Number(promptId))
          if (prompt) prompt.isBookmarked = false
          return okAsync(undefined as void)
        },
        listJourneysUseCase() {
          return okAsync([])
        },
        listCompletedJourneysUseCase() {
          return okAsync([])
        },
        listUserJourneysUseCase() {
          return okAsync([])
        },
        getJourneyUseCase(journeyId) {
          return errAsync(
            journeyNotFound("여정을 찾을 수 없습니다.", journeyId)
          )
        },
        getSessionDetailUseCase(_userId, sessionId) {
          if (input?.sessionDetailError) {
            return errAsync(input.sessionDetailError)
          }

          return okAsync(
            createStubSessionRuntime("dev-user", Number(sessionId))
          )
        },
        enrollJourneyUseCase(userId, journeyId) {
          return okAsync({
            userId: toUserId(String(userId)),
            journeyId,
            currentSessionOrder: 1,
            completionRate: 0,
            status: "in_progress" as const,
          })
        },
        startSessionUseCase(userId, sessionId) {
          return okAsync(
            createStubSessionRuntime(String(userId), Number(sessionId))
          )
        },
        submitStepUseCase(userId, sessionId, _input) {
          if (_input.stepOrder === 1) {
            if (_input.response?.type !== "WRITING") {
              return errAsync(
                createValidationError(
                  "현재 스텝 타입과 맞지 않는 응답입니다.",
                  "response"
                )
              )
            }
          }

          if (_input.stepOrder === 2 && _input.response !== undefined) {
            return errAsync(
              createValidationError(
                "응답을 제출할 수 없는 스텝입니다.",
                "response"
              )
            )
          }

          return okAsync({
            acceptedAi: false,
            runtime: createStubSessionRuntime(
              String(userId),
              Number(sessionId)
            ),
          })
        },
        retrySessionStepAiUseCase(userId, sessionId, _input) {
          return okAsync(
            createStubSessionRuntime(String(userId), Number(sessionId))
          )
        },
        completeSessionUseCase() {
          return okAsync(undefined as void)
        },
        generateFeedbackUseCase() {
          return okAsync({
            strengths: [],
            improvements: [],
            question: "테스트 질문입니다.",
          })
        },
        compareRevisionsUseCase() {
          return okAsync({
            improvements: [],
            summary: "테스트 요약입니다.",
          })
        },
        readLatestAuthEmail: () => null,
        sqliteVersion: "3.46.0",
      }),
      createTimeoutMiddleware(),
    ],
    errorHandler: (error, c) => {
      if (error instanceof Error && error.name === "TimeoutError") {
        return c.json(
          { error: { code: "request_timeout", message: error.message } },
          408
        )
      }
      return handleRequestError(c, error, logger, "request failed")
    },
    openapi: {
      description: "테스트용 OpenAPI 문서",
      title: "writing-app test api",
      version: "0.0.0-test",
    },
    routes: [...allRoutes({ rateLimitBackend })],
    notFound: (c) =>
      c.json(
        {
          error: {
            code: "not_found",
            message: "요청한 경로를 찾을 수 없습니다.",
          },
        },
        404
      ),
  })

  return {
    app,
    close: () => undefined,
    injectForeignWriting(foreignInput: {
      bodyPlainText?: string
      sourcePromptId?: number | null
      title: string
    }) {
      const bodyPlainText = foreignInput.bodyPlainText ?? ""
      const now = new Date().toISOString()
      const created: StoredWriting = {
        bodyJson: null,
        bodyPlainText,
        createdAt: now,
        id: nextWritingId++,
        ownerId: "other-user",
        preview: toPreview(bodyPlainText),
        sourcePromptId: foreignInput.sourcePromptId ?? null,
        title: foreignInput.title,
        updatedAt: now,
        wordCount: 0,
      }

      writings.push(created)
      return { id: created.id }
    },
  }
}
