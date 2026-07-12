import type { AnyRouteConfig } from "@workspace/hono/core"
import {
  adminAiChatConversationDetailDtoSchema,
  adminAiChatConversationListDtoSchema,
  adminAiChatMessageRequestSchema,
  adminIdSchema,
  conversationIdSchema,
  type AdminAiChatConversationDetailDto,
} from "@workspace/contracts/admin"
import type { AdminAiChatUseCase } from "@workspace/core/admin"
import { privateNoStoreCacheControl } from "@workspace/hono/security"
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
import type { AiChatRequestGuard } from "@/routes/ai-chat-request-guard"
import { adminSessionRouteOptions } from "@/routes/admin-route-options"

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

export type AiChatRouteDependencies = {
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

    return context.json(
      await aiChatService.getAiChatConversations({
        adminId: session.admin.id,
        page: query.page,
        pageSize: query.pageSize,
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
    const conversation = await aiChatService.getAiChatConversation({
      adminId: session.admin.id,
      conversationId,
      messagePage: query.messagePage,
      messagePageSize: query.messagePageSize,
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
  aiChatEventLogger,
  aiChatRequestGuard,
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
        aiChatService,
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
  aiChatService,
  adminId,
  conversationId,
  message,
  now,
  permit,
  requestSignal,
}: {
  readonly aiChatAgent: AdminAiChatAgent | undefined
  readonly aiChatEventLogger: AiChatRouteDependencies["aiChatEventLogger"]
  readonly aiChatService: AdminAiChatUseCase
  readonly adminId: z.infer<typeof adminIdSchema>
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
          enqueueSse(controller, encoder, "chunk", { delta })
        }

        if (abortController.signal.aborted) {
          return
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
          messagePage: 1,
          messagePageSize: 100,
        })

        enqueueSse(controller, encoder, "done", {
          conversation: completed?.conversation ?? prepared.conversation,
          message: assistantMessage,
        })
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
          enqueueSse(controller, encoder, "error", {
            code: "AI_STREAM_FAILED",
            message: "AI stream failed",
          })
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
