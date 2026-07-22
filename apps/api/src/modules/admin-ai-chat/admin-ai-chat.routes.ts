import type { AnyRouteConfig } from "@workspace/http-platform/core"
import {
  adminAiChatConversationDetailDtoSchema,
  adminAiChatConversationListDtoSchema,
  adminAiChatMessageRequestSchema,
  adminAiChatStreamChunkEventSchema,
  adminAiChatStreamDoneEventSchema,
  adminAiChatStreamErrorEventSchema,
  type AdminAiChatConversationDetailDto,
} from "@workspace/contracts/operations/admin-ai-chat"
import {
  conversationIdSchema,
  type AdminAiChatMessageDto,
} from "@workspace/contracts/operations/ai-chat-data"
import type { AdminId } from "@workspace/contracts/identity/data"
import type {
  AdminAiChatConversationHistory,
  AiChatRepository,
  ReadAdminAiChatConversationsResult,
} from "@workspace/core/admin"
import { privateNoStoreCacheControl } from "@workspace/http-platform/security"
import { z } from "@workspace/http-platform/zod"

import type { AdminSessionResolver } from "@workspace/auth/admin/server"
import {
  defineAdminRoute,
  type AdminRouteHandler,
} from "@/admin/admin-hono-env"
import { notFoundAdminError } from "@/admin/admin-errors"
import {
  adminAuthenticatedResponses,
  errorJsonResponse,
  eventStreamResponse,
  jsonResponse,
} from "@/admin/admin-openapi"
import { adminSessionRouteOptions } from "@/admin/admin-route-options"
import {
  defineAdminRouteGroup,
  type AdminRouteGroup,
} from "@/http/admin-route-group"
import type { AdminAiChatAgent } from "@/modules/admin-ai-chat/admin-ai-chat-agent"
import type { AiChatRequestGuard } from "@/modules/admin-ai-chat/ai-chat-request-guard"

const aiChatParamsSchema = z.object({
  conversationId: conversationIdSchema,
})

const aiChatConversationPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(50),
})

const aiChatMessagePaginationSchema = z.object({
  messagePage: z.coerce.number().int().min(1).max(10_000).default(1),
  messagePageSize: z.coerce.number().int().min(1).max(100).default(100),
})

export type AdminAiChatRouteDependencies = {
  readonly aiChatAgent?: AdminAiChatAgent
  readonly aiChatEventLogger?: {
    readonly info: (
      event: Readonly<Record<string, unknown>>,
      message: string
    ) => void
    readonly warn: (
      event: Readonly<Record<string, unknown>>,
      message: string
    ) => void
  }
  readonly aiChatRequestGuard: AiChatRequestGuard
  readonly aiChatRepository: AiChatRepository
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createAdminAiChatRoutes(
  dependencies: AdminAiChatRouteDependencies
): AdminRouteGroup {
  return defineAdminRouteGroup([
    createListConversationsRoute(dependencies),
    createGetConversationRoute(dependencies),
    createStreamMessageRoute(dependencies),
  ])
}

function createListConversationsRoute({
  aiChatRepository,
  sessionResolver,
}: AdminAiChatRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminAiChatConversations",
    path: "/ai-chat/conversations",
    request: { query: aiChatConversationPaginationSchema },
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
    const query = context.req.valid("query")
    const conversations = await aiChatRepository.readAiChatConversations({
      adminId: session.admin.id,
      page: query.page,
      pageSize: query.pageSize,
    })
    const response = toAiChatConversationListResponse(conversations)

    return context.json(response, 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createGetConversationRoute({
  aiChatRepository,
  sessionResolver,
}: AdminAiChatRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminAiChatConversation",
    path: "/ai-chat/conversations/{conversationId}",
    request: {
      params: aiChatParamsSchema,
      query: aiChatMessagePaginationSchema,
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
    const query = context.req.valid("query")
    const conversation = await aiChatRepository.readAiChatConversation({
      adminId: session.admin.id,
      conversationId,
      messagePage: query.messagePage,
      messagePageSize: query.messagePageSize,
    })

    if (conversation === null) {
      throw notFoundAdminError()
    }
    const response = toAiChatConversationDetailResponse(conversation)

    return context.json(response, 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createStreamMessageRoute({
  aiChatAgent,
  aiChatEventLogger,
  aiChatRequestGuard,
  aiChatRepository,
  now,
  sessionResolver,
}: AdminAiChatRouteDependencies) {
  const routeConfig = {
    method: "post",
    operationId: "streamAdminAiChatMessage",
    path: "/ai-chat/messages/stream",
    request: {
      body: {
        content: {
          "application/json": { schema: adminAiChatMessageRequestSchema },
        },
      },
    },
    responses: {
      ...adminAuthenticatedResponses(
        eventStreamResponse("어드민 AI 채팅 SSE 응답입니다.")
      ),
      400: errorJsonResponse("잘못된 요청입니다."),
      429: errorJsonResponse("AI 채팅 요청 한도를 초과했습니다."),
    },
    summary: "어드민 AI 채팅 메시지 스트리밍",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const body = context.req.valid("json")
    const session = context.get("activeAdminSession")
    const permit = aiChatRequestGuard.acquire({
      adminId: session.admin.id,
      clientIp: readClientIp(context.req.raw),
      conversationId: body.conversationId ?? null,
      now: now(),
    })

    if (permit.kind === "rejected") {
      aiChatEventLogger?.warn(
        {
          adminId: session.admin.id,
          conversationId: body.conversationId ?? null,
          reason: permit.reason,
          retryAfterSeconds: permit.retryAfterSeconds,
        },
        "admin.ai-chat.request.rejected"
      )
      return Response.json(
        {
          code: "AI_CHAT_RATE_LIMITED",
          message: "AI 채팅 요청 한도를 초과했습니다.",
        },
        {
          headers: { "Retry-After": String(permit.retryAfterSeconds) },
          status: 429,
        }
      )
    }

    return new Response(
      createAiChatSseStream({
        aiChatAgent,
        aiChatEventLogger,
        aiChatRepository,
        adminId: session.admin.id,
        conversationId: body.conversationId ?? null,
        message: body.message,
        now,
        permit,
        requestSignal: context.req.raw.signal,
      }),
      {
        headers: {
          "Cache-Control": privateNoStoreCacheControl,
          "Content-Type": "text/event-stream; charset=utf-8",
          Vary: "Cookie",
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
  aiChatEventLogger,
  aiChatRepository,
  adminId,
  conversationId,
  message,
  now,
  permit,
  requestSignal,
}: {
  readonly aiChatAgent: AdminAiChatAgent | undefined
  readonly aiChatEventLogger: AdminAiChatRouteDependencies["aiChatEventLogger"]
  readonly aiChatRepository: AiChatRepository
  readonly adminId: AdminId
  readonly conversationId: z.infer<typeof conversationIdSchema> | null
  readonly message: string
  readonly now: () => Date
  readonly permit: Extract<
    ReturnType<AiChatRequestGuard["acquire"]>,
    { readonly kind: "accepted" }
  >
  readonly requestSignal: AbortSignal
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const abortController = new AbortController()
  const abortFromRequest = () => abortController.abort(requestSignal.reason)
  requestSignal.addEventListener("abort", abortFromRequest, { once: true })
  if (requestSignal.aborted) {
    abortFromRequest()
  }
  const timeout = setTimeout(
    () => abortController.abort("provider-timeout"),
    30_000
  )

  return new ReadableStream({
    async start(controller) {
      try {
        if (aiChatAgent === undefined) {
          enqueueAiChatErrorSse(
            controller,
            encoder,
            "AI_PROVIDER_UNAVAILABLE",
            "AI provider is unavailable"
          )
          return
        }

        const preparedResult = await aiChatRepository.createAiChatUserMessage({
          adminId,
          conversationId,
          message,
          now: now(),
        })

        if (preparedResult === null) {
          enqueueAiChatErrorSse(
            controller,
            encoder,
            "NOT_FOUND",
            "Conversation was not found"
          )
          return
        }
        const prepared = toAiChatConversationDetailResponse(preparedResult)

        const textStream = await aiChatAgent.streamText(
          createAgentPrompt(prepared),
          { maxOutputTokens: 2_000, signal: abortController.signal }
        )
        let assistantContent = ""
        let outputBytes = 0

        for await (const delta of textStream) {
          if (abortController.signal.aborted) {
            return
          }
          outputBytes += encoder.encode(delta).byteLength
          if (outputBytes > 64 * 1024) {
            abortController.abort("output-limit")
            aiChatEventLogger?.warn(
              {
                adminId,
                conversationId: prepared.conversation.id,
                outputBytes,
              },
              "admin.ai-chat.output.limit"
            )
            return
          }
          assistantContent += delta
          enqueueAiChatChunkSse(controller, encoder, delta)
        }

        if (abortController.signal.aborted) {
          return
        }

        const assistantMessage =
          await aiChatRepository.saveAiChatAssistantMessage({
            content: assistantContent,
            conversationId: prepared.conversation.id,
            now: now(),
          })
        const completed = await aiChatRepository.readAiChatConversation({
          adminId,
          conversationId: prepared.conversation.id,
          messagePage: 1,
          messagePageSize: 100,
        })
        const completedResponse =
          completed === null
            ? null
            : toAiChatConversationDetailResponse(completed)

        enqueueAiChatDoneSse(
          controller,
          encoder,
          completedResponse?.conversation ?? prepared.conversation,
          assistantMessage
        )
        aiChatEventLogger?.info(
          {
            adminId,
            conversationId: prepared.conversation.id,
            outputBytes,
          },
          "admin.ai-chat.completed"
        )
      } catch {
        if (!abortController.signal.aborted) {
          enqueueAiChatErrorSse(
            controller,
            encoder,
            "AI_STREAM_FAILED",
            "AI stream failed"
          )
        }
      } finally {
        clearTimeout(timeout)
        requestSignal.removeEventListener("abort", abortFromRequest)
        permit.release()
        if (abortController.signal.reason === "provider-timeout") {
          aiChatEventLogger?.warn(
            { adminId, conversationId },
            "admin.ai-chat.provider.timeout"
          )
        }
        try {
          controller.close()
        } catch {
          // 이미 소비자가 stream을 취소했다.
        }
      }
    },
    cancel() {
      abortController.abort("client-disconnect")
      aiChatEventLogger?.info(
        { adminId, conversationId },
        "admin.ai-chat.client.disconnected"
      )
    },
  })
}

function enqueueAiChatChunkSse(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  delta: string
): void {
  enqueueSse(
    controller,
    encoder,
    "chunk",
    adminAiChatStreamChunkEventSchema.parse({ delta })
  )
}

function enqueueAiChatDoneSse(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  conversation: AdminAiChatConversationDetailDto["conversation"],
  message: AdminAiChatMessageDto
): void {
  enqueueSse(
    controller,
    encoder,
    "done",
    adminAiChatStreamDoneEventSchema.parse({ conversation, message })
  )
}

function enqueueAiChatErrorSse(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  code: string,
  message: string
): void {
  enqueueSse(
    controller,
    encoder,
    "error",
    adminAiChatStreamErrorEventSchema.parse({ code, message })
  )
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

function toAiChatConversationListResponse(
  conversations: ReadAdminAiChatConversationsResult
) {
  return adminAiChatConversationListDtoSchema.parse({ items: conversations })
}

function toAiChatConversationDetailResponse(
  history: AdminAiChatConversationHistory
): AdminAiChatConversationDetailDto {
  return adminAiChatConversationDetailDtoSchema.parse({
    conversation: history.conversation,
    messages: history.messageItems,
  })
}

function createAgentPrompt(
  conversation: AdminAiChatConversationDetailDto
): string {
  const transcript = conversation.messages
    .slice(-20)
    .map((message) => {
      const role = message.role === "user" ? "관리자" : "AI"

      return `${role}: ${message.content}`
    })
    .join("\n\n")
    .slice(-12_000)

  return [
    "다음 대화 맥락을 바탕으로 마지막 관리자 요청에 답하세요.",
    "중복 인사 없이 바로 사용할 수 있는 답변을 작성하세요.",
    "",
    transcript,
  ].join("\n")
}

function readClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  )
}
