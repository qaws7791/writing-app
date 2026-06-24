import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AdminAiChatPage } from "@/features/chat/admin-ai-chat-page"
import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminAiChatConversationDetail,
  AdminAiChatConversationList,
} from "@/lib/api/admin-api"

const conversationDetail: AdminAiChatConversationDetail = {
  conversation: {
    createdAt: "2026-06-14T03:00:00.000Z",
    id: "chat-1",
    messageCount: 2,
    title: "강의 소개 문구",
    updatedAt: "2026-06-14T03:01:00.000Z",
  },
  messages: [
    {
      content: "강의 소개 문구를 써줘",
      createdAt: "2026-06-14T03:00:00.000Z",
      id: "message-1",
      role: "user",
    },
    {
      content: "학습 목표가 보이는 소개 문구입니다.",
      createdAt: "2026-06-14T03:01:00.000Z",
      id: "message-2",
      role: "assistant",
    },
  ],
}

const conversationList: AdminAiChatConversationList = {
  items: [conversationDetail.conversation],
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("AdminAiChatPage", () => {
  it("대화 목록과 활성 대화 메시지를 렌더링한다", () => {
    render(
      <AdminAiChatPage
        activeConversationResult={ok(conversationDetail)}
        conversationsResult={ok(conversationList)}
      />
    )

    expect(screen.getByRole("heading", { name: "AI 채팅" })).toBeVisible()
    expect(screen.getByRole("link", { name: /강의 소개 문구/ })).toBeVisible()

    const log = screen.getByRole("log")
    expect(within(log).getByText("강의 소개 문구를 써줘")).toBeVisible()
    expect(
      within(log).getByText("학습 목표가 보이는 소개 문구입니다.")
    ).toBeVisible()
  })

  it("SSE chunk와 done 이벤트로 스트리밍 응답을 표시한다", async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createSseResponse([
        {
          data: {
            delta: "바로 사용할 수 있는 ",
          },
          type: "chunk",
        },
        {
          data: {
            delta: "소개 문구입니다.",
          },
          type: "chunk",
        },
        {
          data: {
            conversation: {
              createdAt: "2026-06-14T03:00:00.000Z",
              id: "chat-2",
              messageCount: 2,
              title: "소개 문구를 써줘",
              updatedAt: "2026-06-14T03:01:00.000Z",
            },
            message: {
              content: "바로 사용할 수 있는 소개 문구입니다.",
              createdAt: "2026-06-14T03:01:00.000Z",
              id: "message-3",
              role: "assistant",
            },
          },
          type: "done",
        },
      ])
    )

    render(
      <AdminAiChatPage
        activeConversationResult={null}
        conversationsResult={ok({ items: [] })}
      />
    )

    await user.type(screen.getByLabelText("AI 채팅 메시지"), "소개 문구를 써줘")
    await user.click(screen.getByRole("button", { name: "전송" }))

    await waitFor(() =>
      expect(
        screen.getByText("바로 사용할 수 있는 소개 문구입니다.")
      ).toBeVisible()
    )
    expect(screen.getByRole("link", { name: /소개 문구를 써줘/ })).toBeVisible()
  })

  it("SSE error 이벤트를 오류와 재시도 상태로 표시한다", async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createSseResponse([
        {
          data: {
            code: "AI_PROVIDER_UNAVAILABLE",
            message: "AI 제공자를 사용할 수 없습니다.",
          },
          type: "error",
        },
      ])
    )

    render(
      <AdminAiChatPage
        activeConversationResult={null}
        conversationsResult={ok({ items: [] })}
      />
    )

    await user.type(screen.getByLabelText("AI 채팅 메시지"), "운영 문구")
    await user.click(screen.getByRole("button", { name: "전송" }))

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "AI 제공자를 사용할 수 없습니다."
      )
    )
    expect(screen.getByRole("button", { name: "재시도" })).toBeVisible()
  })
})

type SseTestEvent = {
  readonly data: unknown
  readonly type: string
}

function createSseResponse(events: readonly SseTestEvent[]): Response {
  const encoder = new TextEncoder()

  return new Response(
    new ReadableStream({
      start(controller) {
        for (const event of events) {
          controller.enqueue(
            encoder.encode(
              `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
            )
          )
        }

        controller.close()
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
      },
      status: 200,
    }
  )
}

function ok<TValue>(value: TValue): AdminApiResult<TValue> {
  return {
    status: "ok",
    value,
  }
}
