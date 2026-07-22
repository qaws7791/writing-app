import {
  adminAiChatConversationDetailDtoSchema,
  adminAiChatConversationListDtoSchema,
  type AdminAiChatConversationDetailDto,
  type AdminAiChatMessageDto,
} from "@workspace/contracts/operations/admin-ai-chat"
import { conversationIdSchema } from "@workspace/contracts/operations/ai-chat-data"
import {
  adminIdSchema,
  messageIdSchema,
} from "@workspace/contracts/identity/admin-ids"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import {
  type AdminAiChatConversationHistory,
  type AiChatRepository,
} from "@workspace/core/admin"
import { adminRoles } from "@workspace/identity/admin-actor"

import {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "@workspace/identity/sessions"
import { createAdminApp } from "@/http/admin-app"
import type { AdminAiChatAgent } from "@/modules/admin-ai-chat/admin-ai-chat-agent"
import {
  createAiChatRequestGuard,
  type AiChatRequestGuard,
} from "@/modules/admin-ai-chat/ai-chat-request-guard"
import {
  createAdminAiChatRoutes,
  type AdminAiChatRouteDependencies,
} from "@/modules/admin-ai-chat/admin-ai-chat.routes"

type AdminAiChatTargetRouteFixtureJson =
  | null
  | boolean
  | number
  | string
  | readonly AdminAiChatTargetRouteFixtureJson[]
  | { readonly [key: string]: AdminAiChatTargetRouteFixtureJson }

export type AdminAiChatTargetRouteFixture = {
  readonly fetch: (request: Request) => Promise<Response> | Response
  readonly readEffectJournal: () => readonly AdminAiChatTargetRouteFixtureJson[]
}

const fixtureNow = new Date("2026-06-14T03:00:00.000Z")
const conversationDetail = adminAiChatConversationDetailDtoSchema.parse({
  conversation: {
    createdAt: fixtureNow.toISOString(),
    id: conversationIdSchema.parse("chat-1"),
    messageCount: 1,
    title: "소개 문구",
    updatedAt: fixtureNow.toISOString(),
  },
  messages: [
    {
      content: "소개 문구를 써줘",
      createdAt: fixtureNow.toISOString(),
      id: "message-1",
      role: "user",
    },
  ],
})
const assistantMessage: AdminAiChatMessageDto = {
  content: "바로 사용할 수 있는 소개 문구입니다.",
  createdAt: fixtureNow.toISOString(),
  id: messageIdSchema.parse("message-2"),
  role: "assistant",
}
const completedConversationDetail =
  adminAiChatConversationDetailDtoSchema.parse({
    ...conversationDetail,
    conversation: {
      ...conversationDetail.conversation,
      messageCount: 2,
    },
    messages: [...conversationDetail.messages, assistantMessage],
  })
const conversationList = adminAiChatConversationListDtoSchema.parse({
  items: [completedConversationDetail.conversation],
})

export function createAdminAiChatTargetRouteFixture(
  scenario: string
): AdminAiChatTargetRouteFixture {
  const parsedScenario = parseScenario(scenario)
  const journal = createEffectJournal()
  const sessionResolver = createSessionResolver()
  const dependencies: AdminAiChatRouteDependencies = {
    aiChatAgent: createAiChatAgent(parsedScenario, journal),
    aiChatEventLogger: {
      info(event, message) {
        journal.record("ai-chat.log.info", {
          event: toJson(event),
          message,
        })
      },
      warn(event, message) {
        journal.record("ai-chat.log.warn", {
          event: toJson(event),
          message,
        })
      },
    },
    aiChatRequestGuard: createRequestGuard(parsedScenario),
    aiChatRepository: createAiChatRepository(parsedScenario, journal),
    now: () => fixtureNow,
    sessionResolver,
  }
  const app = createAdminApp({
    capabilityRoutes: createAdminAiChatRoutes(dependencies),
    sessionResolver,
  })

  return {
    fetch(request) {
      return app.fetch(request)
    },
    readEffectJournal() {
      return journal.read()
    },
  }
}

function createAiChatAgent(
  scenario: AdminAiChatTargetScenario,
  journal: EffectJournal
): AdminAiChatAgent | undefined {
  if (scenario === "provider-unavailable") return undefined

  return {
    async streamText(prompt, options) {
      journal.record("ai-chat.agent.stream", {
        maxOutputTokens: options.maxOutputTokens,
        promptContainsMessage: prompt.includes("소개 문구를 써줘"),
      })
      if (scenario === "provider-failure") {
        throw new Error("provider failure")
      }

      async function* stream() {
        yield "바로 사용할 수 있는 "
        yield "소개 문구입니다."
      }

      return stream()
    },
  }
}

function createRequestGuard(
  scenario: AdminAiChatTargetScenario
): AiChatRequestGuard {
  if (scenario !== "rate-limited") return createAiChatRequestGuard()

  return {
    acquire() {
      return {
        kind: "rejected",
        reason: "rate-limit",
        retryAfterSeconds: 30,
      }
    },
  }
}

function createAiChatRepository(
  scenario: AdminAiChatTargetScenario,
  journal: EffectJournal
): AiChatRepository {
  const prepared = createHistory(
    scenario === "invalid-response"
      ? createInvalidConversation()
      : conversationDetail
  )
  const completed = createHistory(
    scenario === "invalid-response"
      ? createInvalidConversation()
      : completedConversationDetail
  )

  return {
    async createAiChatUserMessage(input) {
      journal.record("ai-chat.user-message.create", {
        adminId: input.adminId,
        conversationId: input.conversationId,
        message: input.message,
        now: input.now.toISOString(),
      })
      return scenario === "missing-conversation" ? null : prepared
    },
    async readAiChatConversation(input) {
      journal.record("ai-chat.conversation.read", {
        adminId: input.adminId,
        conversationId: input.conversationId,
        messagePage: input.messagePage,
        messagePageSize: input.messagePageSize,
      })
      return scenario === "missing-conversation" ||
        input.conversationId === "missing"
        ? null
        : completed
    },
    async readAiChatConversations(input) {
      journal.record("ai-chat.conversations.read", {
        adminId: input.adminId,
        page: input.page,
        pageSize: input.pageSize,
      })
      return scenario === "invalid-response"
        ? [createInvalidConversation().conversation]
        : conversationList.items
    },
    async saveAiChatAssistantMessage(input) {
      journal.record("ai-chat.assistant-message.save", {
        content: input.content,
        conversationId: input.conversationId,
        now: input.now.toISOString(),
      })
      return assistantMessage
    },
  }
}

function createHistory(
  detail: AdminAiChatConversationDetailDto
): AdminAiChatConversationHistory {
  return {
    conversation: detail.conversation,
    messageItems: detail.messages,
  }
}

function createInvalidConversation(): AdminAiChatConversationDetailDto {
  return {
    ...conversationDetail,
    conversation: {
      ...conversationDetail.conversation,
      messageCount: -1,
    },
  }
}

function createSessionResolver(): AdminSessionResolver {
  const session = {
    admin: {
      email: "admin@example.com",
      id: adminIdSchema.parse("admin-1"),
      name: "관리자",
      role: adminRoles.owner,
    },
    [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
  } as const satisfies AdminAuthenticatedSession

  return {
    async resolveSession(headers) {
      return readAdminSessionToken(headers) === "admin-token" ? session : null
    },
  }
}

function readAdminSessionToken(headers: Headers): string | null {
  const cookies = headers.get("Cookie")
  if (cookies === null) return null

  const token = cookies
    .split(";")
    .map((cookie) => cookie.trim().split("=", 2))
    .find(([name]) => name === adminSessionCookieName)?.[1]

  return token === undefined ? null : decodeURIComponent(token)
}

type AdminAiChatTargetScenario =
  | "default"
  | "invalid-response"
  | "missing-conversation"
  | "provider-failure"
  | "provider-unavailable"
  | "rate-limited"

function parseScenario(scenario: string): AdminAiChatTargetScenario {
  if (
    scenario === "default" ||
    scenario === "invalid-response" ||
    scenario === "missing-conversation" ||
    scenario === "provider-failure" ||
    scenario === "provider-unavailable" ||
    scenario === "rate-limited"
  ) {
    return scenario
  }

  throw new Error(
    `지원하지 않는 target admin AI chat scenario입니다: ${scenario}`
  )
}

type EffectJournal = {
  readonly read: () => readonly AdminAiChatTargetRouteFixtureJson[]
  readonly record: (
    effect: string,
    input: AdminAiChatTargetRouteFixtureJson
  ) => void
}

function createEffectJournal(): EffectJournal {
  const entries: AdminAiChatTargetRouteFixtureJson[] = []
  let sequence = 0

  return {
    read() {
      return entries
    },
    record(effect, input) {
      sequence += 1
      entries.push({ effect, input, sequence })
    },
  }
}

function toJson(
  value: Readonly<Record<string, unknown>>
): AdminAiChatTargetRouteFixtureJson {
  return JSON.parse(JSON.stringify(value)) as AdminAiChatTargetRouteFixtureJson
}
