import {
  createEmptyWritingContent,
  extractWritingTextMetrics,
  toUserId,
  toWritingId,
  toPromptId,
  type WritingContent,
} from "@workspace/core"
import {
  writingNotFound,
  writingForbidden,
  promptNotFound as writingPromptNotFound,
} from "@workspace/core/modules/writings"
import { promptNotFound } from "@workspace/core/modules/prompts"
import { okAsync, errAsync } from "neverthrow"

import { createApp } from "../app.js"
import { createSilentLogger, type ApiLogger } from "../observability/logger.js"

type TestPrompt = {
  description: string
  id: number
  isTodayRecommended: boolean
  level: 1 | 2 | 3
  outline: string[]
  saved: boolean
  suggestedLengthLabel: "깊이" | "보통" | "짧음"
  tags: string[]
  text: string
  tips: string[]
  topic:
    | "감정"
    | "경험"
    | "관계"
    | "기술"
    | "기억"
    | "문화"
    | "사회"
    | "상상"
    | "성장"
    | "여행"
    | "일상"
    | "자기이해"
    | "진로"
}

type StoredWriting = {
  characterCount: number
  content: WritingContent
  createdAt: string
  id: number
  lastSavedAt: string
  ownerId: string
  preview: string
  sourcePromptId: number | null
  title: string
  updatedAt: string
  wordCount: number
}

const seedPrompts: TestPrompt[] = [
  {
    description: "생각 변화의 계기를 씁니다.",
    id: 1,
    isTodayRecommended: true,
    level: 1,
    outline: [],
    saved: false,
    suggestedLengthLabel: "짧음",
    tags: ["변화", "회고"],
    text: "최근에 내 생각이 바뀐 순간은?",
    tips: ["장면부터 시작하세요."],
    topic: "자기이해",
  },
  {
    description: "익숙함을 떠나기 어려운 이유를 씁니다.",
    id: 2,
    isTodayRecommended: false,
    level: 2,
    outline: [],
    saved: false,
    suggestedLengthLabel: "보통",
    tags: ["관성", "변화"],
    text: "사람들은 왜 익숙한 것을 떠나기 어려울까?",
    tips: ["경험을 먼저 적어보세요."],
    topic: "사회",
  },
  {
    description: "하루의 조용한 순간을 씁니다.",
    id: 3,
    isTodayRecommended: true,
    level: 1,
    outline: [],
    saved: false,
    suggestedLengthLabel: "짧음",
    tags: ["루틴", "감정"],
    text: "내 하루에서 가장 조용한 순간은 언제인가요?",
    tips: ["감각을 함께 써보세요."],
    topic: "일상",
  },
  {
    description: "미래의 나에게 편지를 씁니다.",
    id: 4,
    isTodayRecommended: false,
    level: 2,
    outline: ["지금의 나", "요즘의 고민", "미래에게"],
    saved: false,
    suggestedLengthLabel: "보통",
    tags: ["미래", "편지"],
    text: "10년 후의 나에게 편지를 써보세요",
    tips: ["고민을 숨기지 마세요."],
    topic: "자기이해",
  },
  {
    description: "읽은 글의 인상적 문장을 씁니다.",
    id: 5,
    isTodayRecommended: false,
    level: 1,
    outline: [],
    saved: false,
    suggestedLengthLabel: "짧음",
    tags: ["독서", "문화"],
    text: "최근에 읽은 글에서 가장 인상 깊었던 문장은?",
    tips: ["문장을 만난 장면도 적어보세요."],
    topic: "문화",
  },
  {
    description: "AI가 일상에 들어오며 잃는 것을 씁니다.",
    id: 6,
    isTodayRecommended: true,
    level: 3,
    outline: ["장면", "편리함", "잃는 것", "균형점"],
    saved: false,
    suggestedLengthLabel: "깊이",
    tags: ["기술", "비평", "AI"],
    text: "AI가 일상에 들어오면서 잃어가는 것은?",
    tips: ["양면을 함께 다뤄보세요."],
    topic: "기술",
  },
  {
    description: "최근 고마웠던 순간을 씁니다.",
    id: 7,
    isTodayRecommended: true,
    level: 1,
    outline: [],
    saved: false,
    suggestedLengthLabel: "짧음",
    tags: ["관계", "감사"],
    text: "가장 최근에 누군가에게 고마웠던 순간은 언제인가요?",
    tips: ["감정 변화를 써보세요."],
    topic: "관계",
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

export function createTestApi(input?: {
  homeError?: Error
  logger?: ApiLogger
}) {
  const prompts = seedPrompts.map((prompt) => ({ ...prompt }))
  const writings: StoredWriting[] = []
  let nextWritingId = 1

  function findPrompt(promptId: number) {
    return prompts.find((prompt) => prompt.id === promptId) ?? null
  }

  function serializeWriting(writing: StoredWriting) {
    return {
      characterCount: writing.characterCount,
      content: writing.content,
      createdAt: writing.createdAt,
      id: toWritingId(writing.id),
      lastSavedAt: writing.lastSavedAt,
      preview: writing.preview,
      sourcePromptId:
        writing.sourcePromptId === null
          ? null
          : toPromptId(writing.sourcePromptId),
      title: writing.title,
      updatedAt: writing.updatedAt,
      wordCount: writing.wordCount,
    }
  }

  const app = createApp({
    allowedOrigins: ["http://127.0.0.1:3000", "http://localhost:3000"],
    apiBaseUrl: "http://127.0.0.1:3010",
    authDebugEnabled: false,
    getSession: async (request) => {
      if (request.headers.get("x-test-auth") === "none") {
        return null
      }

      const userId = request.headers.get("x-test-user-id") ?? "dev-user"
      return createTestSession(userId)
    },
    logger: input?.logger ?? createSilentLogger(),
    useCases: {
      aiUseCases: {
        async getSuggestions() {
          return []
        },
        async getDocumentReview() {
          return []
        },
        async getFlowReview() {
          return []
        },
      },
      authHandler: async () =>
        new Response(
          JSON.stringify({
            error: {
              code: "not_found",
              message: "테스트 인증 핸들러가 구성되지 않았습니다.",
            },
          }),
          {
            headers: {
              "content-type": "application/json",
            },
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
        if (current.ownerId !== userId) {
          return errAsync(
            writingForbidden(
              "다른 사용자의 글에는 접근할 수 없습니다.",
              toUserId(current.ownerId)
            )
          )
        }

        const nextContent = autosaveInput.content ?? current.content
        const nextTitle = autosaveInput.title ?? current.title
        const metrics = extractWritingTextMetrics(nextContent)
        const now = new Date().toISOString()

        current.content = nextContent
        current.title = nextTitle
        current.characterCount = metrics.characterCount
        current.lastSavedAt = now
        current.preview = toPreview(metrics.plainText)
        current.updatedAt = now
        current.wordCount = metrics.wordCount

        return okAsync(serializeWriting(current))
      },
      createWritingUseCase(userId, createInput) {
        if (
          createInput.sourcePromptId !== undefined &&
          !findPrompt(Number(createInput.sourcePromptId))
        ) {
          return errAsync(writingPromptNotFound("글감을 찾을 수 없습니다."))
        }

        const content = createInput.content ?? createEmptyWritingContent()
        const metrics = extractWritingTextMetrics(content)
        const now = new Date().toISOString()
        const created: StoredWriting = {
          characterCount: metrics.characterCount,
          content,
          createdAt: now,
          id: nextWritingId++,
          lastSavedAt: now,
          ownerId: userId,
          preview: toPreview(metrics.plainText),
          sourcePromptId:
            createInput.sourcePromptId === undefined
              ? null
              : Number(createInput.sourcePromptId),
          title: createInput.title ?? "",
          updatedAt: now,
          wordCount: metrics.wordCount,
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
        if (writings[index]!.ownerId !== userId) {
          return errAsync(
            writingForbidden(
              "다른 사용자의 글에는 접근할 수 없습니다.",
              toUserId(writings[index]!.ownerId)
            )
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
        if (writing.ownerId !== userId) {
          return errAsync(
            writingForbidden(
              "다른 사용자의 글에는 접근할 수 없습니다.",
              toUserId(writing.ownerId)
            )
          )
        }

        return okAsync(serializeWriting(writing))
      },
      listWritingsUseCase(userId) {
        const items = writings
          .filter((writing) => writing.ownerId === userId)
          .sort((left, right) =>
            left.updatedAt === right.updatedAt
              ? right.id - left.id
              : right.updatedAt.localeCompare(left.updatedAt)
          )
          .map((writing) => ({
            characterCount: writing.characterCount,
            id: toWritingId(writing.id),
            lastSavedAt: writing.lastSavedAt,
            preview: writing.preview,
            sourcePromptId:
              writing.sourcePromptId === null
                ? null
                : toPromptId(writing.sourcePromptId),
            title: writing.title,
            wordCount: writing.wordCount,
          }))
        return okAsync({ items, nextCursor: null, hasMore: false })
      },
      getHomeUseCase(userId) {
        if (input?.homeError) {
          throw input.homeError
        }

        const recentWritings = writings
          .filter((writing) => writing.ownerId === userId)
          .sort((left, right) =>
            left.updatedAt === right.updatedAt
              ? right.id - left.id
              : right.updatedAt.localeCompare(left.updatedAt)
          )
          .map((writing) => ({
            characterCount: writing.characterCount,
            id: toWritingId(writing.id),
            lastSavedAt: writing.lastSavedAt,
            preview: writing.preview,
            sourcePromptId:
              writing.sourcePromptId === null
                ? null
                : toPromptId(writing.sourcePromptId),
            title: writing.title,
            wordCount: writing.wordCount,
          }))

        return okAsync({
          recentWritings,
          resumeWriting: recentWritings[0] ?? null,
          savedPrompts: prompts
            .filter((prompt) => prompt.saved)
            .map((prompt) => ({
              id: toPromptId(prompt.id),
              level: prompt.level,
              saved: true,
              suggestedLengthLabel: prompt.suggestedLengthLabel,
              tags: prompt.tags,
              text: prompt.text,
              topic: prompt.topic,
            })),
          todayPrompts: prompts
            .filter((prompt) => prompt.isTodayRecommended)
            .slice(0, 2)
            .map((prompt) => ({
              id: toPromptId(prompt.id),
              level: prompt.level,
              saved: prompt.saved,
              suggestedLengthLabel: prompt.suggestedLengthLabel,
              tags: prompt.tags,
              text: prompt.text,
              topic: prompt.topic,
            })),
        })
      },
      getPromptUseCase(_userId, promptId) {
        const prompt = findPrompt(Number(promptId))
        if (!prompt) {
          return errAsync(promptNotFound("글감을 찾을 수 없습니다."))
        }

        return okAsync({
          description: prompt.description,
          id: toPromptId(prompt.id),
          level: prompt.level,
          outline: prompt.outline,
          saved: prompt.saved,
          suggestedLengthLabel: prompt.suggestedLengthLabel,
          tags: prompt.tags,
          text: prompt.text,
          tips: prompt.tips,
          topic: prompt.topic,
        })
      },
      listPromptsUseCase(_userId, filters) {
        const query = filters.query?.trim().toLowerCase()

        return okAsync(
          prompts
            .filter((prompt) => {
              if (
                filters.saved !== undefined &&
                prompt.saved !== filters.saved
              ) {
                return false
              }
              if (filters.topic && prompt.topic !== filters.topic) {
                return false
              }
              if (filters.level && prompt.level !== filters.level) {
                return false
              }
              if (!query) {
                return true
              }

              return (
                prompt.text.toLowerCase().includes(query) ||
                prompt.tags.some((tag) => tag.toLowerCase().includes(query))
              )
            })
            .map((prompt) => ({
              id: toPromptId(prompt.id),
              level: prompt.level,
              saved: prompt.saved,
              suggestedLengthLabel: prompt.suggestedLengthLabel,
              tags: prompt.tags,
              text: prompt.text,
              topic: prompt.topic,
            }))
        )
      },
      savePromptUseCase(_userId, promptId) {
        const prompt = findPrompt(Number(promptId))
        if (!prompt) {
          return errAsync(promptNotFound("글감을 찾을 수 없습니다."))
        }

        const savedAt = new Date().toISOString()
        prompt.saved = true

        return okAsync({ savedAt })
      },
      unsavePromptUseCase(_userId, promptId) {
        const prompt = findPrompt(Number(promptId))
        if (!prompt || !prompt.saved) {
          return errAsync(promptNotFound("저장된 글감을 찾을 수 없습니다."))
        }

        prompt.saved = false
        return okAsync(undefined as void)
      },
      readLatestAuthEmail: () => null,
      sqliteVersion: "3.46.0",
      pushTransactionsUseCase() {
        return errAsync(writingNotFound("stub"))
      },
      pullDocumentUseCase() {
        return errAsync(writingNotFound("stub"))
      },
      listVersionsUseCase() {
        return okAsync({ items: [], nextCursor: null, hasMore: false })
      },
      getVersionUseCase() {
        return errAsync(writingNotFound("stub"))
      },
    },
  })

  return {
    app,
    close: () => undefined,
    injectForeignWriting(input: {
      content?: WritingContent
      sourcePromptId?: number | null
      title: string
    }) {
      const content = input.content ?? createEmptyWritingContent()
      const metrics = extractWritingTextMetrics(content)
      const now = new Date().toISOString()
      const created: StoredWriting = {
        characterCount: metrics.characterCount,
        content,
        createdAt: now,
        id: nextWritingId++,
        lastSavedAt: now,
        ownerId: "other-user",
        preview: toPreview(metrics.plainText),
        sourcePromptId: input.sourcePromptId ?? null,
        title: input.title,
        updatedAt: now,
        wordCount: metrics.wordCount,
      }

      writings.push(created)
      return {
        id: created.id,
      }
    },
  }
}
