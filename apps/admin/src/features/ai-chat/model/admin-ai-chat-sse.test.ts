import { describe, expect, it } from "vitest"

import {
  AdminAiChatStreamError,
  parseAdminAiChatSseEvent,
  readAdminAiChatSseEvents,
} from "@/features/ai-chat/model/admin-ai-chat-sse"

describe("관리자 AI 채팅 SSE parser", () => {
  it.each([
    ["LF", 'event: chunk\ndata: {"delta":"가"}'],
    ["CRLF", 'event: chunk\r\ndata: {"delta":"가"}'],
  ])("%s 줄바꿈 이벤트를 파싱한다", (_name, frame) => {
    expect(parseAdminAiChatSseEvent(frame)).toEqual({
      event: { data: { delta: "가" }, type: "chunk" },
      kind: "event",
    })
  })

  it("잘못된 JSON을 명시적인 malformed 결과로 반환한다", () => {
    expect(parseAdminAiChatSseEvent("event: chunk\ndata: {")).toEqual({
      kind: "malformed",
      message: "SSE 데이터가 올바른 JSON이 아닙니다.",
    })
  })

  it("partial chunk를 합치고 done 이벤트까지 읽는다", async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('event: chunk\ndata: {"del'))
        controller.enqueue(
          encoder.encode(
            'ta":"가"}\r\n\r\nevent: error\r\ndata: {"code":"END","message":"끝"}\r\n\r\n'
          )
        )
        controller.close()
      },
    })

    const events = []
    for await (const event of readAdminAiChatSseEvents(stream)) {
      events.push(event)
    }

    expect(events).toEqual([
      { data: { delta: "가" }, type: "chunk" },
      { data: { code: "END", message: "끝" }, type: "error" },
    ])
  })

  it("done 없는 EOF를 오류로 처리한다", async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode('event: chunk\ndata: {"delta":"가"}\n\n')
        )
        controller.close()
      },
    })

    const consume = async () => {
      for await (const _event of readAdminAiChatSseEvents(stream)) {
        // stream을 끝까지 소비한다.
      }
    }

    await expect(consume()).rejects.toBeInstanceOf(AdminAiChatStreamError)
  })
})
