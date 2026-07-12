import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AdminAiChatPage } from "@/features/chat/admin-ai-chat-page"
import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminAiChatConversationDetail,
  AdminAiChatConversationList,
} from "@/features/chat/admin-ai-chat-api"
import { conversationIdSchema } from "@/lib/api/admin-identity"

const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}))

const conversationDetail: AdminAiChatConversationDetail = {
  conversation: {
    createdAt: "2026-06-14T03:00:00.000Z",
    id: conversationIdSchema.parse("chat-1"),
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
  replaceMock.mockClear()
})

describe("AdminAiChatPage", () => {
  it("대화 목록과 활성 대화 메시지를 렌더링한다", () => {
    render(
      <AdminAiChatPage
        activeConversationResult={ok(conversationDetail)}
        conversationsResult={ok(conversationList)}
      />
    )

    expect(screen.getByText("AI 에이전트")).toBeVisible()
    expect(screen.getByRole("link", { name: /강의 소개 문구/ })).toBeVisible()

    const log = screen.getByRole("log")
    expect(within(log).getByText("강의 소개 문구를 써줘")).toBeVisible()
    expect(
      within(log).getByText("학습 목표가 보이는 소개 문구입니다.")
    ).toBeVisible()
  })

  it("활성 대화 props가 바뀌면 이전 메시지 state를 남기지 않는다", () => {
    const { rerender } = render(
      <AdminAiChatPage
        activeConversationResult={ok(conversationDetail)}
        conversationsResult={ok(conversationList)}
      />
    )
    const nextConversation = {
      conversation: {
        ...conversationDetail.conversation,
        id: conversationIdSchema.parse("chat-2"),
        title: "두 번째 대화",
      },
      messages: [
        {
          content: "두 번째 메시지",
          createdAt: "2026-06-14T04:00:00.000Z",
          id: "message-3",
          role: "user" as const,
        },
      ],
    }

    rerender(
      <AdminAiChatPage
        activeConversationResult={ok(nextConversation)}
        conversationsResult={ok({ items: [nextConversation.conversation] })}
      />
    )

    expect(screen.getByText("두 번째 메시지")).toBeVisible()
    expect(screen.queryByText("강의 소개 문구를 써줘")).not.toBeInTheDocument()
  })

  it("pending 중 반복 submit을 하나의 요청으로 제한하고 unmount에서 취소한다", async () => {
    let capturedSignal: AbortSignal | undefined
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (_input, init) => {
        capturedSignal = init?.signal as AbortSignal
        return new Response(
          new ReadableStream({
            start(controller) {
              capturedSignal?.addEventListener(
                "abort",
                () => controller.close(),
                { once: true }
              )
            },
          }),
          { status: 200 }
        )
      })
    const user = userEvent.setup()
    const { unmount } = render(
      <AdminAiChatPage
        activeConversationResult={null}
        conversationsResult={ok({ items: [] })}
      />
    )
    const input = screen.getByLabelText("AI 채팅 메시지")
    await user.type(input, "중복 요청")
    const form = input.closest("form")
    if (form === null) {
      throw new Error("메시지 입력 form을 찾을 수 없습니다.")
    }

    fireEvent.submit(form)
    fireEvent.submit(form)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    unmount()
    expect(capturedSignal?.aborted).toBe(true)
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
