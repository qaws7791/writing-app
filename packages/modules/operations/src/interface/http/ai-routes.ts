import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { assertExhaustiveHttpResult } from "@workspace/http-platform/errors"
import {
  eventStreamResponse,
  jsonResponse,
} from "@workspace/http-platform/openapi"
import {
  privateNoStoreCacheControl,
  readTrustedClientIp,
} from "@workspace/http-platform/security"
import { z } from "@workspace/http-platform/zod"
import {
  adminAiChatConversationDetailDtoSchema,
  adminAiChatConversationListDtoSchema,
  adminAiChatConversationQuerySchema,
  adminAiChatMessageQuerySchema,
  adminAiChatMessageRequestSchema,
  adminAiChatStreamChunkEventSchema,
  adminAiChatStreamDoneEventSchema,
  adminAiChatStreamErrorEventSchema,
  type AdminAiChatStreamErrorCode,
} from "@workspace/contracts/operations/admin-ai-chat"
import {
  adminAiChangeProposalDtoSchema,
  aiChangeProposalIdSchema,
} from "@workspace/contracts/operations/admin-ai-proposals"
import { conversationIdSchema } from "@workspace/contracts/identity/admin-ids"
import type { AdminId, ConversationId } from "@workspace/types/ids"

import type { AiChangeProposalApplication } from "#operations/application/ai-change-proposals"
import type {
  AiConversationQueries,
  AiStreamingApplication,
} from "#operations/application/ai-conversations"
import type {
  AiRequestGuard,
  AiRequestPermit,
} from "#operations/application/ai-request-guard"
import type {
  OperationsAdminSessionPort,
  OperationsSecurityAuditPort,
} from "#operations/application/ports/operations-ports"
import type { AiChangeProposal } from "#operations/domain/ai-change-proposal"
import type { OperationsError } from "#operations/domain/operations-error"
import type {
  AiConversationHistory,
  AiConversationSummary,
  AiMessage,
} from "#operations/domain/ai-conversation"
import { operationsSessionRouteOptions } from "#operations/interface/http/operations-http-auth"
import {
  defineOperationsRoute,
  mapOperationsError,
  operationsAuthenticatedResponses,
  operationsErrorResponse,
  type OperationsRouteHandler,
} from "#operations/interface/http/operations-http-support"

const conversationParamsSchema = z.object({
  conversationId: conversationIdSchema,
})
const proposalParamsSchema = z.object({ proposalId: aiChangeProposalIdSchema })

export function createOperationsAiRoutes(input: {
  readonly audit: OperationsSecurityAuditPort
  readonly conversations: AiConversationQueries
  readonly guard: AiRequestGuard
  readonly now: () => Date
  readonly proposals: AiChangeProposalApplication
  readonly session: OperationsAdminSessionPort
  readonly streaming: AiStreamingApplication
}) {
  return Object.freeze([
    createListConversationsRoute(input),
    createReadConversationRoute(input),
    createStreamMessageRoute(input),
    createReadProposalRoute(input),
    createReviewProposalRoute(input, "approve"),
    createReviewProposalRoute(input, "reject"),
  ])
}

function createListConversationsRoute(
  input: Parameters<typeof createOperationsAiRoutes>[0]
) {
  const route = {
    method: "get",
    operationId: "getAdminAiChatConversations",
    path: "/ai-chat/conversations",
    request: { query: adminAiChatConversationQuerySchema },
    responses: operationsAuthenticatedResponses(
      jsonResponse(
        "어드민 AI 채팅 대화 목록입니다.",
        adminAiChatConversationListDtoSchema
      )
    ),
    summary: "어드민 AI 채팅 대화 목록 조회",
    ...operationsSessionRouteOptions(input.session),
  } satisfies AnyRouteConfig
  const handler: OperationsRouteHandler<typeof route> = async (context) => {
    const actor = context.get("operationsActor")
    const result = await input.conversations.readConversations({
      adminId: actor.id,
      ...context.req.valid("query"),
    })
    if (result.isErr()) throw mapOperationsError(result.error)
    return context.json(
      adminAiChatConversationListDtoSchema.parse({
        items: result.value.map(toConversationDto),
      }),
      200
    )
  }
  return defineOperationsRoute({ ...route, handler })
}

function createReadConversationRoute(
  input: Parameters<typeof createOperationsAiRoutes>[0]
) {
  const route = {
    method: "get",
    operationId: "getAdminAiChatConversation",
    path: "/ai-chat/conversations/{conversationId}",
    request: {
      params: conversationParamsSchema,
      query: adminAiChatMessageQuerySchema,
    },
    responses: {
      ...operationsAuthenticatedResponses(
        jsonResponse(
          "어드민 AI 채팅 대화 상세입니다.",
          adminAiChatConversationDetailDtoSchema
        )
      ),
      404: operationsErrorResponse("AI 채팅 대화를 찾을 수 없습니다."),
    },
    summary: "어드민 AI 채팅 대화 상세 조회",
    ...operationsSessionRouteOptions(input.session),
  } satisfies AnyRouteConfig
  const handler: OperationsRouteHandler<typeof route> = async (context) => {
    const result = await input.conversations.readConversation({
      adminId: context.get("operationsActor").id,
      conversationId: context.req.valid("param").conversationId,
      ...context.req.valid("query"),
    })
    if (result.isErr()) throw mapOperationsError(result.error)
    return context.json(toConversationDetailDto(result.value), 200)
  }
  return defineOperationsRoute({ ...route, handler })
}

function createStreamMessageRoute(
  input: Parameters<typeof createOperationsAiRoutes>[0]
) {
  const route = {
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
      200: eventStreamResponse("어드민 AI 채팅 SSE 응답입니다."),
      400: operationsErrorResponse("잘못된 요청입니다."),
      401: operationsErrorResponse("관리자 인증이 필요합니다."),
      403: operationsErrorResponse("관리자 권한이 필요합니다."),
      429: operationsErrorResponse("AI 채팅 요청 한도를 초과했습니다."),
      503: operationsErrorResponse("AI 채팅 요청 한도를 확인할 수 없습니다."),
    },
    summary: "어드민 AI 채팅 메시지 스트리밍",
    ...operationsSessionRouteOptions(input.session),
  } satisfies AnyRouteConfig
  const handler: OperationsRouteHandler<typeof route> = async (context) => {
    const actor = context.get("operationsActor")
    const body = context.req.valid("json")
    const permitResult = await input.guard.acquire({
      adminId: actor.id,
      clientIp: readTrustedClientIp(context.req.raw),
      conversationId: body.conversationId ?? null,
      now: input.now(),
    })
    if (permitResult.isErr()) throw mapOperationsError(permitResult.error)
    const permit = permitResult.value
    if (permit.kind === "rejected") {
      input.audit({
        action: "ai.quota.exceeded",
        actorId: actor.id,
        outcome: "denied",
        reason: permit.reason,
        requestId: context.get("requestId") ?? "untracked",
        target: "operations.ai-chat",
      })
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
      createAiSseStream({
        adminId: actor.id,
        application: input.streaming,
        conversationId: body.conversationId ?? null,
        conversations: input.conversations,
        message: body.message,
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
  return defineOperationsRoute({ ...route, handler })
}

function createReadProposalRoute(
  input: Parameters<typeof createOperationsAiRoutes>[0]
) {
  const route = {
    method: "get",
    operationId: "getAdminAiChangeProposal",
    path: "/ai-chat/proposals/{proposalId}",
    request: { params: proposalParamsSchema },
    responses: {
      ...operationsAuthenticatedResponses(
        jsonResponse("AI 변경안입니다.", adminAiChangeProposalDtoSchema)
      ),
      404: operationsErrorResponse("AI 변경안을 찾을 수 없습니다."),
    },
    summary: "AI 변경안 조회",
    ...operationsSessionRouteOptions(input.session),
  } satisfies AnyRouteConfig
  const handler: OperationsRouteHandler<typeof route> = async (context) => {
    const result = await input.proposals.readProposal(
      context.req.valid("param").proposalId
    )
    if (result.isErr()) throw mapOperationsError(result.error)
    return context.json(toProposalDto(result.value), 200)
  }
  return defineOperationsRoute({ ...route, handler })
}

function createReviewProposalRoute(
  input: Parameters<typeof createOperationsAiRoutes>[0],
  decision: "approve" | "reject"
) {
  const route = {
    method: "post",
    operationId:
      decision === "approve"
        ? "approveAdminAiChangeProposal"
        : "rejectAdminAiChangeProposal",
    path: `/ai-chat/proposals/{proposalId}/${decision}`,
    request: { params: proposalParamsSchema },
    responses: {
      ...operationsAuthenticatedResponses(
        jsonResponse("검토된 AI 변경안입니다.", adminAiChangeProposalDtoSchema)
      ),
      404: operationsErrorResponse("AI 변경안을 찾을 수 없습니다."),
      409: operationsErrorResponse("AI 변경안 상태가 충돌했습니다."),
      422: operationsErrorResponse("변경안을 적용할 수 없습니다."),
    },
    summary: decision === "approve" ? "AI 변경안 승인" : "AI 변경안 거절",
    ...operationsSessionRouteOptions(input.session),
  } satisfies AnyRouteConfig
  const handler: OperationsRouteHandler<typeof route> = async (context) => {
    const actor = context.get("operationsActor")
    const result = await input.proposals.reviewProposal({
      actor,
      decision,
      proposalId: context.req.valid("param").proposalId,
    })
    input.audit({
      action: "ai.change.reviewed",
      actorId: actor.id,
      outcome: result.isOk() ? "succeeded" : "denied",
      reason: result.isErr() ? result.error.kind : undefined,
      requestId: context.get("requestId") ?? "untracked",
      target: `operations.ai-change.${decision}`,
    })
    if (result.isErr()) throw mapOperationsError(result.error)
    return context.json(toProposalDto(result.value), 200)
  }
  return defineOperationsRoute({ ...route, handler })
}

function createAiSseStream(
  input: Readonly<{
    adminId: AdminId
    application: AiStreamingApplication
    conversationId: ConversationId | null
    conversations: AiConversationQueries
    message: string
    permit: Extract<AiRequestPermit, { readonly kind: "accepted" }>
    requestSignal: AbortSignal
  }>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const abortController = new AbortController()
  const abortFromRequest = () =>
    abortController.abort(input.requestSignal.reason)
  input.requestSignal.addEventListener("abort", abortFromRequest, {
    once: true,
  })
  if (input.requestSignal.aborted) abortFromRequest()
  const timeout = setTimeout(
    () => abortController.abort("provider-timeout"),
    30_000
  )

  return new ReadableStream({
    async start(controller) {
      try {
        const started = await input.application.startMessage({
          adminId: input.adminId,
          conversationId: input.conversationId,
          message: input.message,
          signal: abortController.signal,
        })
        if (started.isErr()) {
          if (abortController.signal.aborted) return
          enqueueApplicationError(controller, encoder, started.error)
          return
        }
        let content = ""
        let outputBytes = 0
        for await (const delta of started.value.stream) {
          if (abortController.signal.aborted) return
          outputBytes += encoder.encode(delta).byteLength
          if (outputBytes > 64 * 1024) {
            abortController.abort("output-limit")
            return
          }
          content += delta
          enqueueSse(
            controller,
            encoder,
            "chunk",
            adminAiChatStreamChunkEventSchema.parse({ delta })
          )
        }
        if (abortController.signal.aborted) return
        const saved = await input.application.finishAssistantMessage({
          content,
          conversationId: started.value.history.conversation.conversation.id,
        })
        if (saved.isErr()) {
          enqueueApplicationError(controller, encoder, saved.error)
          return
        }
        const completed = await input.conversations.readConversation({
          adminId: input.adminId,
          conversationId: started.value.history.conversation.conversation.id,
          messagePage: 1,
          messagePageSize: 100,
        })
        const history = completed.isOk()
          ? completed.value
          : started.value.history
        enqueueSse(
          controller,
          encoder,
          "done",
          adminAiChatStreamDoneEventSchema.parse({
            conversation: toConversationDto(history.conversation),
            message: toMessageDto(saved.value),
          })
        )
      } catch {
        if (!abortController.signal.aborted) {
          enqueueError(
            controller,
            encoder,
            "AI_STREAM_FAILED",
            "AI stream failed"
          )
        }
      } finally {
        clearTimeout(timeout)
        input.requestSignal.removeEventListener("abort", abortFromRequest)
        input.permit.release()
        closeStreamController(controller)
      }
    },
    cancel() {
      abortController.abort("client-disconnect")
    },
  })
}

function closeStreamController(
  controller: ReadableStreamDefaultController<Uint8Array>
): void {
  try {
    controller.close()
  } catch {
    return
  }
}

function enqueueApplicationError(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  error: OperationsError
) {
  switch (error.kind) {
    case "provider-unavailable":
      enqueueError(
        controller,
        encoder,
        "AI_PROVIDER_UNAVAILABLE",
        "AI provider is unavailable"
      )
      return
    case "not-found":
      enqueueError(
        controller,
        encoder,
        "NOT_FOUND",
        "Conversation was not found"
      )
      return
    case "provider-timeout":
    case "request-aborted":
    case "conflict":
    case "permission-denied":
    case "persistence-failed":
    case "provider-failed":
    case "quota-exceeded":
    case "reporting-unavailable":
    case "validation-failed":
      enqueueError(controller, encoder, "AI_STREAM_FAILED", "AI stream failed")
      return
  }

  return assertExhaustiveHttpResult(error)
}

function enqueueError(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  code: AdminAiChatStreamErrorCode,
  message: string
) {
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
) {
  controller.enqueue(
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  )
}

function toConversationDto(summary: AiConversationSummary) {
  return {
    createdAt: summary.conversation.createdAt.toISOString(),
    id: summary.conversation.id,
    messageCount: summary.messageCount,
    title: summary.conversation.title,
    updatedAt: summary.conversation.updatedAt.toISOString(),
  }
}

function toMessageDto(message: AiMessage) {
  return {
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    id: message.id,
    role: message.role,
  }
}

function toConversationDetailDto(history: AiConversationHistory) {
  return adminAiChatConversationDetailDtoSchema.parse({
    conversation: toConversationDto(history.conversation),
    messages: history.messages.map(toMessageDto),
  })
}

function toProposalDto(proposal: AiChangeProposal) {
  return adminAiChangeProposalDtoSchema.parse({
    ...proposal,
    createdAt: proposal.createdAt.toISOString(),
    reviewedAt: proposal.reviewedAt?.toISOString() ?? null,
  })
}
