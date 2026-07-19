import { describe, expect, it } from "vitest"

import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import {
  adminTargetContractProtocolVersion,
  type AdminTargetContractRunInput,
  type AdminTargetContractSemanticObservation,
} from "@/test-support/admin-target-contract"
import {
  assertAdminTargetContract,
  type AdminTargetContractEvidence,
} from "@/test-support/admin-target-contract-harness"

const adminOrigin = localRuntimeDefaults.adminWebOrigin
const adminCookie = `${adminSessionCookieName}=admin-token`

const adminAiChatTargetContractInput = {
  cases: [
    {
      id: "conversations-list",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/ai-chat/conversations?page=1&pageSize=10",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "conversations-list-invalid-page",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/ai-chat/conversations?page=0&pageSize=51",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "conversation-detail",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/ai-chat/conversations/chat-1?messagePage=1&messagePageSize=100",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "conversation-missing",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/ai-chat/conversations/chat-1",
      },
      responseBody: "json",
      scenario: "missing-conversation",
    },
    {
      id: "stream-success",
      request: streamRequest('{"message":"소개 문구를 써줘"}'),
      responseBody: "sse",
      scenario: "default",
    },
    {
      id: "stream-provider-unavailable",
      request: streamRequest('{"message":"소개 문구를 써줘"}'),
      responseBody: "sse",
      scenario: "provider-unavailable",
    },
    {
      id: "stream-provider-failure",
      request: streamRequest('{"message":"소개 문구를 써줘"}'),
      responseBody: "sse",
      scenario: "provider-failure",
    },
    {
      id: "stream-conversation-missing",
      request: streamRequest(
        '{"conversationId":"chat-1","message":"소개 문구를 써줘"}'
      ),
      responseBody: "sse",
      scenario: "missing-conversation",
    },
    {
      id: "stream-rate-limited",
      request: streamRequest('{"message":"소개 문구를 써줘"}'),
      responseBody: "json",
      scenario: "rate-limited",
    },
    {
      id: "stream-unauthenticated",
      request: {
        body: { encoding: "utf8", value: '{"message":"소개 문구를 써줘"}' },
        headers: [
          ["Content-Type", "application/json"],
          ["Origin", adminOrigin],
          ["Sec-Fetch-Site", "same-origin"],
        ],
        method: "POST",
        path: "/ai-chat/messages/stream",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "stream-invalid-message",
      request: streamRequest('{"message":"   "}'),
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "ai-chat-openapi",
      openApiProjection: {
        components: [
          {
            names: ["adminSessionCookie"],
            section: "securitySchemes",
          },
        ],
        paths: [
          "/api/admin/ai-chat/conversations",
          "/api/admin/ai-chat/conversations/{conversationId}",
          "/api/admin/ai-chat/messages/stream",
        ],
      },
      request: { method: "GET", path: "/openapi" },
      responseBody: "openapi",
      scenario: "default",
    },
  ],
  protocolVersion: adminTargetContractProtocolVersion,
  suite: "admin-ai-chat",
} as const satisfies AdminTargetContractRunInput

describe("관리자 AI chat delivery의 통합 runtime target 계약", () => {
  it("목록·상세, validation·권한, SSE event 순서, provider 실패와 OpenAPI 계약을 workspace 격리 상태에서 보존한다", async () => {
    const evidence = await assertAdminTargetContract(
      adminAiChatTargetContractInput
    )

    expect(evidence.caseCount).toBe(adminAiChatTargetContractInput.cases.length)
    expect(readObservation(evidence, "conversations-list")).toMatchObject({
      body: {
        kind: "json",
        value: {
          items: [
            {
              id: "chat-1",
              messageCount: 2,
              title: "소개 문구",
            },
          ],
        },
      },
      effectJournal: [
        {
          effect: "ai-chat.conversations.read",
          input: {
            adminId: "admin-1",
            page: 1,
            pageSize: 10,
          },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(
      readObservation(evidence, "conversations-list-invalid-page")
    ).toMatchObject({
      body: {
        kind: "json",
        value: {
          code: "VALIDATION_FAILED",
          message: "Request validation failed",
        },
      },
      effectJournal: [],
      status: 400,
    })
    expect(readObservation(evidence, "conversation-detail")).toMatchObject({
      body: {
        kind: "json",
        value: {
          conversation: { id: "chat-1", messageCount: 2 },
          messages: [
            { id: "message-1", role: "user" },
            { id: "message-2", role: "assistant" },
          ],
        },
      },
      effectJournal: [
        {
          effect: "ai-chat.conversation.read",
          input: {
            adminId: "admin-1",
            conversationId: "chat-1",
            messagePage: 1,
            messagePageSize: 100,
          },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "conversation-missing")).toMatchObject({
      body: {
        kind: "json",
        value: { code: "NOT_FOUND", message: "Not Found" },
      },
      status: 404,
    })
    expect(readObservation(evidence, "stream-success")).toMatchObject({
      body: {
        events: [
          {
            data: { kind: "json", value: { delta: "바로 사용할 수 있는 " } },
            event: "chunk",
          },
          {
            data: { kind: "json", value: { delta: "소개 문구입니다." } },
            event: "chunk",
          },
          {
            data: {
              kind: "json",
              value: {
                conversation: { id: "chat-1", messageCount: 2 },
                message: { id: "message-2", role: "assistant" },
              },
            },
            event: "done",
          },
        ],
        kind: "sse",
      },
      effectJournal: [
        {
          effect: "ai-chat.user-message.create",
          sequence: 1,
        },
        { effect: "ai-chat.agent.stream", sequence: 2 },
        { effect: "ai-chat.assistant-message.save", sequence: 3 },
        { effect: "ai-chat.conversation.read", sequence: 4 },
        { effect: "ai-chat.log.info", sequence: 5 },
      ],
      headers: {
        "cache-control": ["private, no-store"],
        vary: ["Cookie, Origin"],
      },
      status: 200,
    })
    expect(
      readObservation(evidence, "stream-provider-unavailable")
    ).toMatchObject({
      body: {
        events: [
          {
            data: {
              kind: "json",
              value: {
                code: "AI_PROVIDER_UNAVAILABLE",
                message: "AI provider is unavailable",
              },
            },
            event: "error",
          },
        ],
        kind: "sse",
      },
      effectJournal: [],
      status: 200,
    })
    for (const id of [
      "stream-provider-failure",
      "stream-conversation-missing",
    ] as const) {
      expect(readObservation(evidence, id)).toMatchObject({
        body: { events: [{ event: "error" }], kind: "sse" },
        status: 200,
      })
    }
    expect(readObservation(evidence, "stream-rate-limited")).toMatchObject({
      body: {
        kind: "json",
        value: {
          code: "AI_CHAT_RATE_LIMITED",
          message: "AI 채팅 요청 한도를 초과했습니다.",
        },
      },
      effectJournal: [{ effect: "ai-chat.log.warn", sequence: 1 }],
      headers: { "retry-after": ["30"] },
      status: 429,
    })
    for (const id of [
      "stream-unauthenticated",
      "stream-invalid-message",
    ] as const) {
      expect(readObservation(evidence, id)).toMatchObject({
        body: {
          kind: "json",
          value: {
            code:
              id === "stream-unauthenticated"
                ? "UNAUTHORIZED"
                : "VALIDATION_FAILED",
            message:
              id === "stream-unauthenticated"
                ? "Unauthorized"
                : "Request validation failed",
          },
        },
        effectJournal: [],
        status: id === "stream-unauthenticated" ? 401 : 400,
      })
    }
  }, 15_000)
})

function streamRequest(body: string) {
  return {
    body: { encoding: "utf8" as const, value: body },
    headers: [
      ["Content-Type", "application/json"],
      ["Cookie", adminCookie],
      ["Origin", adminOrigin],
      ["Sec-Fetch-Site", "same-origin"],
    ] as const,
    method: "POST",
    path: "/ai-chat/messages/stream",
  }
}

function readObservation(
  evidence: AdminTargetContractEvidence,
  id: string
): AdminTargetContractSemanticObservation {
  const observation = evidence.target.observations.find(
    (candidate) => candidate.id === id
  )

  if (observation === undefined) {
    throw new Error(`target contract 관찰값을 찾을 수 없습니다: ${id}`)
  }

  return observation
}
