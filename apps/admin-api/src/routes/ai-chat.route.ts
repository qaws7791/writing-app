import type { AnyRouteConfig } from "@workspace/hono/core"
import {
  adminAiChatConversationDetailDtoSchema,
  adminAiChatConversationListDtoSchema,
  adminAiChatMessageRequestSchema,
  type AdminAiChatConversationDetailDto,
} from "@workspace/contracts/admin"
import type { AdminAiChatUseCase } from "@workspace/core/admin"
import { z } from "@workspace/hono/zod"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import { notFoundAdminError } from "@/errors/admin-errors"
import {
  adminAuthenticatedResponses,
  errorJsonResponse,
  eventStreamResponse,
  jsonRequestBody,
  jsonResponse,
} from "@/http/openapi"
import type { AdminAiChatAgent } from "@/mastra/admin-content-agent"
import { adminSessionRouteOptions } from "@/routes/admin-route-options"

const aiChatParamsSchema = z.object({
  conversationId: z.string(),
})

export type AiChatRouteDependencies = {
  readonly aiChatAgent?: AdminAiChatAgent
  readonly aiChatService: AdminAiChatUseCase
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createAiChatRoutes(dependencies: AiChatRouteDependencies) {
  return [
    createListConversationsRoute(dependencies),
    createGetConversationRoute(dependencies),
    createStreamMessageRoute(dependencies),
  ] as const
}

function createListConversationsRoute({
  aiChatService,
  sessionResolver,
}: AiChatRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminAiChatConversations",
    path: "/ai-chat/conversations",
    responses: adminAuthenticatedResponses(
      jsonResponse(
        "어드민 AI 채팅 대화 목록입니다.",
        adminAiChatConversationListDtoSchema
      )
    ),
    summary: "어드민 AI 채팅 대화 목록 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const session = context.get("activeAdminSession")

    return context.json(
      await aiChatService.getAiChatConversations({
        adminId: session.admin.id,
      }),
      200
    )
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createGetConversationRoute({
  aiChatService,
  sessionResolver,
}: AiChatRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminAiChatConversation",
    path: "/ai-chat/conversations/{conversationId}",
    request: {
      params: aiChatParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "어드민 AI 채팅 대화 상세입니다.",
          adminAiChatConversationDetailDtoSchema
        )
      ),
      404: errorJsonResponse("AI 채팅 대화를 찾을 수 없습니다."),
    },
    summary: "어드민 AI 채팅 대화 상세 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const session = context.get("activeAdminSession")
    const { conversationId } = context.req.valid("param")
    const conversation = await aiChatService.getAiChatConversation({
      adminId: session.admin.id,
      conversationId,
    })

    if (conversation === null) {
      throw notFoundAdminError()
    }

    return context.json(conversation, 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createStreamMessageRoute({
  aiChatAgent,
  aiChatService,
  now,
  sessionResolver,
}: AiChatRouteDependencies) {
  const routeConfig = {
    method: "post",
    operationId: "streamAdminAiChatMessage",
    path: "/ai-chat/messages/stream",
    request: {
      body: jsonRequestBody(adminAiChatMessageRequestSchema),
    },
    responses: {
      ...adminAuthenticatedResponses(
        eventStreamResponse("어드민 AI 채팅 SSE 응답입니다.")
      ),
      400: errorJsonResponse("잘못된 요청입니다."),
    },
    summary: "어드민 AI 채팅 메시지 스트리밍",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const body = context.req.valid("json")
    const session = context.get("activeAdminSession")

    return new Response(
      createAiChatSseStream({
        aiChatAgent,
        aiChatService,
        adminId: session.admin.id,
        conversationId: body.conversationId ?? null,
        message: body.message,
        now,
      }),
      {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "text/event-stream; charset=utf-8",
        },
      }
    )
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createAiChatSseStream({
  aiChatAgent,
  aiChatService,
  adminId,
  conversationId,
  message,
  now,
}: {
  readonly aiChatAgent: AdminAiChatAgent | undefined
  readonly aiChatService: AdminAiChatUseCase
  readonly adminId: string
  readonly conversationId: string | null
  readonly message: string
  readonly now: () => Date
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        if (aiChatAgent === undefined) {
          enqueueSse(controller, encoder, "error", {
            code: "AI_PROVIDER_UNAVAILABLE",
            message: "AI provider is unavailable",
          })
          return
        }

        const prepared = await aiChatService.createAiChatUserMessage({
          adminId,
          conversationId,
          message,
          now: now(),
        })

        if (prepared === null) {
          enqueueSse(controller, encoder, "error", {
            code: "NOT_FOUND",
            message: "Conversation was not found",
          })
          return
        }

        const textStream = await aiChatAgent.streamText(
          createAgentPrompt(prepared)
        )
        let assistantContent = ""

        for await (const delta of textStream) {
          assistantContent += delta
          enqueueSse(controller, encoder, "chunk", { delta })
        }

        const assistantMessage = await aiChatService.saveAiChatAssistantMessage(
          {
            content: assistantContent,
            conversationId: prepared.conversation.id,
            now: now(),
          }
        )
        const completed = await aiChatService.getAiChatConversation({
          adminId,
          conversationId: prepared.conversation.id,
        })

        enqueueSse(controller, encoder, "done", {
          conversation: completed?.conversation ?? prepared.conversation,
          message: assistantMessage,
        })
      } catch {
        enqueueSse(controller, encoder, "error", {
          code: "AI_STREAM_FAILED",
          message: "AI stream failed",
        })
      } finally {
        controller.close()
      }
    },
  })
}

function enqueueSse(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  event: "chunk" | "done" | "error",
  data: unknown
): void {
  controller.enqueue(
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  )
}

function createAgentPrompt(
  conversation: AdminAiChatConversationDetailDto
): string {
  const transcript = conversation.messages
    .map((message) => {
      const role = message.role === "user" ? "관리자" : "AI"

      return `${role}: ${message.content}`
    })
    .join("\n\n")

  return [
    "다음 대화 맥락을 바탕으로 마지막 관리자 요청에 답하세요.",
    "중복 인사 없이 바로 사용할 수 있는 답변을 작성하세요.",
    "",
    transcript,
  ].join("\n")
}
