import type {
  AdminAiChatConversation,
  AdminAiChatMessage,
} from "@/lib/api/admin-api"

export type AdminAiChatStreamEvent =
  | {
      readonly data: { readonly delta: string }
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
      readonly data: { readonly code: string; readonly message: string }
      readonly type: "error"
    }

export type SseEventParseResult =
  | { readonly event: AdminAiChatStreamEvent; readonly kind: "event" }
  | { readonly kind: "malformed"; readonly message: string }

export class AdminAiChatStreamError extends Error {}

export function parseAdminAiChatSseEvent(value: string): SseEventParseResult {
  const lines = value.replaceAll("\r\n", "\n").split("\n")
  const eventLine = lines.find((line) => line.startsWith("event:"))
  const dataLines = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trimStart())

  if (eventLine === undefined || dataLines.length === 0) {
    return { kind: "malformed", message: "불완전한 SSE 이벤트입니다." }
  }

  let data: unknown
  try {
    data = JSON.parse(dataLines.join("\n")) as unknown
  } catch {
    return {
      kind: "malformed",
      message: "SSE 데이터가 올바른 JSON이 아닙니다.",
    }
  }

  const eventType = eventLine.slice("event:".length).trim()

  if (eventType === "chunk" && isChunkData(data)) {
    return { event: { data, type: "chunk" }, kind: "event" }
  }
  if (eventType === "done" && isDoneData(data)) {
    return { event: { data, type: "done" }, kind: "event" }
  }
  if (eventType === "error" && isErrorData(data)) {
    return { event: { data, type: "error" }, kind: "event" }
  }

  return { kind: "malformed", message: "알 수 없거나 잘못된 SSE 이벤트입니다." }
}

export async function* readAdminAiChatSseEvents(
  body: ReadableStream<Uint8Array>
): AsyncIterable<AdminAiChatStreamEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let terminalEventReceived = false

  try {
    while (true) {
      const result = await reader.read()
      if (result.done) {
        buffer += decoder.decode()
        break
      }

      buffer += decoder.decode(result.value, { stream: true })
      const frames = buffer.split(/\r?\n\r?\n/)
      buffer = frames.pop() ?? ""

      for (const frame of frames) {
        const event = parseFrame(frame)
        terminalEventReceived ||=
          event.type === "done" || event.type === "error"
        yield event
      }
    }

    if (buffer.trim().length > 0) {
      const event = parseFrame(buffer)
      terminalEventReceived ||= event.type === "done" || event.type === "error"
      yield event
    }

    if (!terminalEventReceived) {
      throw new AdminAiChatStreamError(
        "AI 응답이 완료되기 전에 연결이 종료되었습니다."
      )
    }
  } finally {
    reader.releaseLock()
  }
}

function parseFrame(frame: string): AdminAiChatStreamEvent {
  const result = parseAdminAiChatSseEvent(frame)
  if (result.kind === "malformed") {
    throw new AdminAiChatStreamError(result.message)
  }
  return result.event
}

function isChunkData(value: unknown): value is { readonly delta: string } {
  return isObject(value) && typeof value["delta"] === "string"
}

function isDoneData(
  value: unknown
): value is Extract<AdminAiChatStreamEvent, { readonly type: "done" }>["data"] {
  return (
    isObject(value) &&
    isConversation(value["conversation"]) &&
    isMessage(value["message"])
  )
}

function isErrorData(
  value: unknown
): value is Extract<
  AdminAiChatStreamEvent,
  { readonly type: "error" }
>["data"] {
  return (
    isObject(value) &&
    typeof value["code"] === "string" &&
    typeof value["message"] === "string"
  )
}

function isConversation(value: unknown): value is AdminAiChatConversation {
  return (
    isObject(value) &&
    typeof value["createdAt"] === "string" &&
    typeof value["id"] === "string" &&
    typeof value["messageCount"] === "number" &&
    typeof value["title"] === "string" &&
    typeof value["updatedAt"] === "string"
  )
}

function isMessage(value: unknown): value is AdminAiChatMessage {
  return (
    isObject(value) &&
    typeof value["content"] === "string" &&
    typeof value["createdAt"] === "string" &&
    typeof value["id"] === "string" &&
    (value["role"] === "assistant" || value["role"] === "user")
  )
}

function isObject(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null
}
