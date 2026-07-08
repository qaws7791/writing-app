"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"

import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminAiChatConversation,
  AdminAiChatConversationDetail,
  AdminAiChatConversationList,
  AdminAiChatMessage,
} from "@/lib/api/admin-api"
import {
  BotIcon,
  MessageSquarePlusIcon,
  SendIcon,
} from "@workspace/ui/components/icons"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import { Textarea } from "@workspace/ui/components/ui/textarea"
import { cn } from "@workspace/ui/lib/utils"

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

const QUICK_PROMPTS = [
  "이 레슨 목표를 더 명확하게 다듬어 줘",
  "객관식 문제 3개 만들어줘",
  "이 개념을 초보자에게 어떻게 설명하면 좋을까?",
  "한국어 글쓰기 교육에 효과적인 스텝 구성은?",
] as const
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
    <div
      className="-mx-5 -mt-8 flex min-h-full md:-mx-10"
      style={{ height: "calc(100vh - 2rem)" }}
    >
      <aside className="flex w-56 shrink-0 flex-col border-r border-surface-hover">
        <div className="flex items-center justify-between px-4 pb-4 pt-6">
          <span className="text-[0.9375rem] font-bold text-foreground">
            AI 에이전트
          </span>
          <Link
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            href="/chat"
            title="새 대화"
          >
            <MessageSquarePlusIcon aria-hidden="true" size={16} />
          </Link>
        </div>
        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-4">
          {conversations.length === 0 ? (
            <p className="px-2 py-3 text-[0.8125rem] font-medium text-muted-foreground">
              대화가 없습니다.
            </p>
          ) : (
            conversations.map((conversation) => (
              <Link
                className={cn(
                  "group relative w-full rounded-xl px-3 py-2.5 text-left transition-colors",
                  activeConversationId === conversation.id
                    ? "bg-surface text-foreground"
                    : "text-foreground hover:bg-surface/60"
                )}
                href={`/chat?conversationId=${conversation.id}`}
                key={conversation.id}
                onClick={() => setActiveConversationId(conversation.id)}
              >
                <div className="truncate pr-6 text-[0.8125rem] font-bold">
                  {conversation.title}
                </div>
                <div className="mt-0.5 text-[0.6875rem] font-medium text-muted-foreground">
                  {conversation.messageCount}개 메시지
                </div>
              </Link>
            ))
          )}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {errorMessage === null ? null : (
          <Alert className="m-4" role="alert" tone="danger">
            <AlertDescription className="flex flex-wrap items-center gap-2">
              <span>{errorMessage}</span>
              {lastFailedMessage === null ? null : (
                <Button
                  disabled={isPending}
                  onClick={() => sendMessage(lastFailedMessage)}
                  type="button"
                  variant="outline"
                >
                  재시도
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        {visibleMessages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className="flex w-full max-w-xl flex-col items-center">
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-surface">
                <BotIcon
                  aria-hidden="true"
                  className="text-muted-foreground"
                  size={22}
                />
              </div>
              <h2 className="m-0 mb-1.5 text-center text-[1.375rem] font-bold text-foreground">
                무엇을 도와드릴까요?
              </h2>
              <p className="m-0 mb-8 text-center text-[0.9375rem] font-medium text-muted-foreground">
                콘텐츠 제작, 레슨 설계, 문제 생성 등 무엇이든 물어보세요.
              </p>
              <form
                className="mb-4 flex w-full items-end gap-3 rounded-3xl bg-surface px-5 py-4 shadow-sm"
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
                  className="min-h-[1.5rem] max-h-40 flex-1 resize-none border-0 bg-transparent px-0 py-0 font-medium shadow-none focus-visible:ring-0"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      const message = draft.trim()
                      if (message.length === 0) {
                        return
                      }
                      setDraft("")
                      sendMessage(message)
                    }
                  }}
                  placeholder="메시지를 입력하세요…"
                  value={draft}
                />
                <Button
                  aria-label="전송"
                  className="size-9 shrink-0 rounded-full p-0"
                  disabled={!canSend}
                  type="submit"
                >
                  <SendIcon aria-hidden="true" size={15} />
                </Button>
              </form>
              <p className="mb-6 text-[0.75rem] font-medium text-muted-foreground">
                Enter 전송 · Shift+Enter 줄바꿈
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    className="rounded-full border border-surface-hover bg-background px-4 py-2 text-[0.8125rem] font-medium transition-colors hover:bg-surface"
                    key={prompt}
                    onClick={() => setDraft(prompt)}
                    type="button"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-surface-hover px-6 py-4">
              <div className="truncate text-[1rem] font-bold text-foreground">
                {conversations.find((item) => item.id === activeConversationId)
                  ?.title ?? "AI 대화"}
              </div>
              <div className="mt-0.5 text-[0.75rem] font-medium text-muted-foreground">
                메시지 {visibleMessages.length}개
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto py-4" role="log">
              <div className="grid gap-2">
                {visibleMessages.map((message) => (
                  <article
                    className={cn(
                      "flex items-start gap-3 px-6 py-2",
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                    key={message.id}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface text-muted-foreground"
                      )}
                    >
                      {message.role === "user" ? (
                        <span className="text-[0.6875rem] font-bold">나</span>
                      ) : (
                        <BotIcon aria-hidden="true" size={14} />
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex max-w-[70%] flex-col gap-1",
                        message.role === "user" ? "items-end" : "items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "px-4 py-3 text-[0.9375rem] font-medium",
                          message.role === "user"
                            ? "rounded-3xl rounded-tr-sm bg-primary text-primary-foreground"
                            : "rounded-3xl rounded-tl-sm bg-surface text-foreground"
                        )}
                      >
                        <p className="m-0 whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <form
              className="shrink-0 border-t border-surface-hover px-4 py-4"
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
              <div className="flex items-end gap-3 rounded-3xl bg-surface px-4 py-3">
                <Textarea
                  aria-label="AI 채팅 메시지"
                  className="min-h-[1.5rem] max-h-40 flex-1 resize-none border-0 bg-transparent px-0 py-0 font-medium shadow-none focus-visible:ring-0"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      const message = draft.trim()
                      if (message.length === 0) {
                        return
                      }
                      setDraft("")
                      sendMessage(message)
                    }
                  }}
                  placeholder="메시지를 입력하세요… (Enter 전송 / Shift+Enter 줄바꿈)"
                  value={draft}
                />
                <Button
                  aria-label="전송"
                  className="size-8 shrink-0 rounded-full p-0"
                  disabled={!canSend}
                  type="submit"
                >
                  <SendIcon aria-hidden="true" size={14} />
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
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

type ChunkStreamData = {
  readonly delta: string
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
