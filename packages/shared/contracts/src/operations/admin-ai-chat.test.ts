import { describe, expect, it } from "vitest"

import {
  adminAiChatConversationDetailDtoSchema,
  adminAiChatConversationListDtoSchema,
  adminAiChatMessageRequestSchema,
  adminAiChatStreamEventSchema,
} from "#contracts/operations/admin-ai-chat"

const conversation = {
  createdAt: "2026-06-14T03:00:00.000Z",
  id: "chat-1",
  messageCount: 2,
  title: "강의 소개 문구",
  updatedAt: "2026-06-14T03:01:00.000Z",
}

const messages = [
  {
    content: "소개 문구를 써줘",
    createdAt: "2026-06-14T03:00:00.000Z",
    id: "message-1",
    role: "user",
  },
  {
    content: "바로 사용할 수 있는 소개 문구입니다.",
    createdAt: "2026-06-14T03:01:00.000Z",
    id: "message-2",
    role: "assistant",
  },
]

describe("admin AI chat contracts", () => {
  it("대화 목록, 상세, 메시지 생성 요청을 파싱한다", () => {
    expect(
      adminAiChatConversationListDtoSchema.parse({
        items: [conversation],
      })
    ).toEqual({
      items: [conversation],
    })

    expect(
      adminAiChatConversationDetailDtoSchema.parse({
        conversation,
        messages,
      })
    ).toEqual({
      conversation,
      messages,
    })

    expect(
      adminAiChatMessageRequestSchema.parse({
        conversationId: "chat-1",
        message: " 소개 문구를 써줘 ",
      })
    ).toEqual({
      conversationId: "chat-1",
      message: "소개 문구를 써줘",
    })
  })

  it("SSE 이벤트 형식을 chunk, done, error로 제한한다", () => {
    expect(
      adminAiChatStreamEventSchema.parse({
        data: {
          delta: "문구",
        },
        type: "chunk",
      })
    ).toEqual({
      data: {
        delta: "문구",
      },
      type: "chunk",
    })

    expect(
      adminAiChatStreamEventSchema.parse({
        data: {
          conversation,
          message: messages[1],
        },
        type: "done",
      })
    ).toEqual({
      data: {
        conversation,
        message: messages[1],
      },
      type: "done",
    })

    expect(
      adminAiChatStreamEventSchema.parse({
        data: {
          code: "AI_PROVIDER_UNAVAILABLE",
          message: "AI 제공자를 사용할 수 없습니다.",
        },
        type: "error",
      })
    ).toEqual({
      data: {
        code: "AI_PROVIDER_UNAVAILABLE",
        message: "AI 제공자를 사용할 수 없습니다.",
      },
      type: "error",
    })

    expect(() =>
      adminAiChatStreamEventSchema.parse({
        data: {},
        type: "debug",
      })
    ).toThrow()
  })
})
