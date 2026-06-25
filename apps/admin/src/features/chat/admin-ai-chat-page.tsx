"use client"

import { Bot, MessageSquarePlus, Send } from "lucide-react"
import Link from "next/link"
import { useMemo, useState, useTransition } from "react"

import { AdminHeader } from "@/components/admin-header"
import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminAiChatConversation,
  AdminAiChatConversationDetail,
  AdminAiChatConversationList,
  AdminAiChatMessage,
} from "@/lib/api/admin-api"
import { Button, buttonVariants } from "@workspace/ui/components/ui/button"
import { Textarea } from "@workspace/ui/components/ui/textarea"

type UiMessage = AdminAiChatMessage | PendingMessage

type PendingMessage = {
  readonly content: string
  readonly createdAt: string
  readonly id: string
  readonly role: "assistant" | "user"
}

type StreamEvent =
  | {
      readonly data: {
        readonly delta: string
      }
      readonly type: "chunk"
    }
  | {
      readonly data: {
        readonly conversation: AdminAiChatConversation
        readonly message: AdminAiChatMessage
      }
      readonly type: "done"
    }
  | {
      readonly data: {
        readonly code: string
        readonly message: string
      }
      readonly type: "error"
    }

type ChunkStreamData = Extract<StreamEvent, { readonly type: "chunk" }>["data"]
type DoneStreamData = Extract<StreamEvent, { readonly type: "done" }>["data"]
type ErrorStreamData = Extract<StreamEvent, { readonly type: "error" }>["data"]

export function AdminAiChatPage({
  activeConversationResult,
  conversationsResult,
}: {
  readonly activeConversationResult: AdminApiResult<AdminAiChatConversationDetail> | null
  readonly conversationsResult: AdminApiResult<AdminAiChatConversationList>
}) {
  const initialConversation =
    activeConversationResult?.status === "ok"
      ? activeConversationResult.value
      : null
  const [activeConversationId, setActiveConversationId] = useState(
    initialConversation?.conversation.id ?? null
  )
  const [conversations, setConversations] = useState(
    conversationsResult.status === "ok" ? conversationsResult.value.items : []
  )
  const [messages, setMessages] = useState<readonly UiMessage[]>(
    initialConversation?.messages ?? []
  )
  const [draft, setDraft] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(
    activeConversationResult?.status === "error"
      ? activeConversationResult.error.message
      : conversationsResult.status === "error"
        ? conversationsResult.error.message
        : null
  )
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null
  )
  const [isPending, startTransition] = useTransition()
  const canSend = draft.trim().length > 0 && !isPending
  const visibleMessages = useMemo(() => messages, [messages])

  return (
    <>
      <AdminHeader
        description="운영 자료와 교육 콘텐츠 초안을 대화로 작성합니다."
        title="AI 채팅"
      />
      <div className="admin-chat-layout">
        <aside className="admin-panel admin-chat-sidebar-panel">
          <div className="admin-section-heading">
            <h2>대화</h2>
            <p>{conversations.length}개 대화</p>
          </div>
          <Link className={buttonVariants({ variant: "outline" })} href="/chat">
            <MessageSquarePlus aria-hidden="true" size={16} />새 대화
          </Link>
          <div className="admin-chat-conversation-list">
            {conversations.map((conversation) => (
              <Link
                className={
                  activeConversationId === conversation.id
                    ? "admin-chat-conversation is-active"
                    : "admin-chat-conversation"
                }
                href={`/chat?conversationId=${conversation.id}`}
                key={conversation.id}
                onClick={() => setActiveConversationId(conversation.id)}
              >
                <strong>{conversation.title}</strong>
                <span>{conversation.messageCount}개 메시지</span>
              </Link>
            ))}
          </div>
        </aside>
        <section className="admin-panel admin-chat-panel">
          {errorMessage === null ? null : (
            <div className="admin-alert" role="alert">
              {errorMessage}
              {lastFailedMessage === null ? null : (
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => sendMessage(lastFailedMessage)}
                  type="button"
                >
                  재시도
                </Button>
              )}
            </div>
          )}
          <div className="admin-chat-messages" role="log">
            {visibleMessages.length === 0 ? (
              <div className="admin-chat-empty">
                <Bot aria-hidden="true" size={28} />
                <strong>새 대화를 시작하세요.</strong>
              </div>
            ) : (
              visibleMessages.map((message) => (
                <article
                  className={`admin-chat-message is-${message.role}`}
                  key={message.id}
                >
                  <span>{message.role === "user" ? "관리자" : "AI"}</span>
                  <p>{message.content}</p>
                </article>
              ))
            )}
          </div>
          <form
            className="admin-chat-form"
            onSubmit={(event) => {
              event.preventDefault()
              const message = draft.trim()

              if (message.length === 0) {
                return
              }

              setDraft("")
              sendMessage(message)
            }}
          >
            <Textarea
              aria-label="AI 채팅 메시지"
              className="min-h-[74px]"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="필요한 콘텐츠 초안이나 운영 문구를 입력하세요."
              value={draft}
            />
            <Button disabled={!canSend} type="submit">
              <Send aria-hidden="true" size={16} />
              전송
            </Button>
          </form>
        </section>
      </div>
    </>
  )

  function sendMessage(message: string): void {
    const userMessage: PendingMessage = {
      content: message,
      createdAt: new Date().toISOString(),
      id: `pending-user-${Date.now()}`,
      role: "user",
    }
    const assistantMessageId = `pending-assistant-${Date.now()}`

    setErrorMessage(null)
    setLastFailedMessage(null)
    setMessages((current) => [
      ...current,
      userMessage,
      {
        content: "",
        createdAt: new Date().toISOString(),
        id: assistantMessageId,
        role: "assistant",
      },
    ])

    startTransition(async () => {
      const result = await streamMessage({
        assistantMessageId,
        conversationId: activeConversationId,
        message,
      })

      if (result.kind === "error") {
        setErrorMessage(result.message)
        setLastFailedMessage(message)
      }
    })
  }

  async function streamMessage({
    assistantMessageId,
    conversationId,
    message,
  }: {
    readonly assistantMessageId: string
    readonly conversationId: string | null
    readonly message: string
  }): Promise<
    | {
        readonly kind: "ok"
      }
    | {
        readonly kind: "error"
        readonly message: string
      }
  > {
    const response = await fetch("/api/ai-chat/stream", {
      body: JSON.stringify({
        ...(conversationId === null ? {} : { conversationId }),
        message,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    if (!response.ok || response.body === null) {
      return {
        kind: "error",
        message: "AI 응답을 시작할 수 없습니다.",
      }
    }

    for await (const event of readSseEvents(response.body)) {
      if (event.type === "chunk") {
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessageId
              ? { ...item, content: `${item.content}${event.data.delta}` }
              : item
          )
        )
      }

      if (event.type === "done") {
        setActiveConversationId(event.data.conversation.id)
        setConversations((current) =>
          upsertConversation(current, event.data.conversation)
        )
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessageId ? event.data.message : item
          )
        )
      }

      if (event.type === "error") {
        return {
          kind: "error",
          message: event.data.message,
        }
      }
    }

    return { kind: "ok" }
  }
}

function upsertConversation(
  conversations: readonly AdminAiChatConversation[],
  conversation: AdminAiChatConversation
): readonly AdminAiChatConversation[] {
  const next = conversations.filter((item) => item.id !== conversation.id)

  return [conversation, ...next]
}

async function* readSseEvents(
  body: ReadableStream<Uint8Array>
): AsyncIterable<StreamEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const result = await reader.read()

      if (result.done) {
        break
      }

      buffer += decoder.decode(result.value, { stream: true })
      const parts = buffer.split("\n\n")
      buffer = parts.pop() ?? ""

      for (const part of parts) {
        const event = parseSseEvent(part)

        if (event !== null) {
          yield event
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function parseSseEvent(value: string): StreamEvent | null {
  const eventLine = value.split("\n").find((line) => line.startsWith("event: "))
  const dataLine = value.split("\n").find((line) => line.startsWith("data: "))

  if (eventLine === undefined || dataLine === undefined) {
    return null
  }

  const eventType = eventLine.slice("event: ".length)
  const data = JSON.parse(dataLine.slice("data: ".length)) as unknown

  if (eventType === "chunk" && isChunkData(data)) {
    return { data, type: "chunk" }
  }

  if (eventType === "done" && isDoneData(data)) {
    return { data, type: "done" }
  }

  if (eventType === "error" && isErrorData(data)) {
    return { data, type: "error" }
  }

  return null
}

function isChunkData(value: unknown): value is ChunkStreamData {
  return (
    typeof value === "object" &&
    value !== null &&
    "delta" in value &&
    typeof value.delta === "string"
  )
}

function isDoneData(value: unknown): value is DoneStreamData {
  return (
    typeof value === "object" &&
    value !== null &&
    "conversation" in value &&
    "message" in value
  )
}

function isErrorData(value: unknown): value is ErrorStreamData {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string" &&
    "code" in value &&
    typeof value.code === "string"
  )
}
