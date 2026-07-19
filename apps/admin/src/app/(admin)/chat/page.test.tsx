import { describe, expect, it, vi } from "vitest"

import AdminAiChatRoute from "@/app/(admin)/chat/page"

const { getConversation, getConversations } = vi.hoisted(() => ({
  getConversation: vi.fn(),
  getConversations: vi.fn(),
}))

vi.mock("@/features/ai-chat/server/admin-ai-chat-dal", () => ({
  createAdminAiChatDal: () => ({
    getAiChatConversation: getConversation,
    getAiChatConversations: getConversations,
  }),
}))
vi.mock("@/server/http/get-admin-http-transport", () => ({
  getServerAdminHttpTransport: () => ({}),
}))

vi.mock("@/features/ai-chat/ui/admin-ai-chat-page", () => ({
  AdminAiChatPage: () => null,
}))

describe("관리자 AI 채팅 route", () => {
  it("목록과 선택 대화 요청을 await 전에 함께 시작한다", async () => {
    const conversations = createDeferred<{
      readonly status: "ok"
      readonly value: readonly []
    }>()
    const conversation = createDeferred<{
      readonly status: "ok"
      readonly value: { readonly id: string }
    }>()
    getConversations.mockReturnValueOnce(conversations.promise)
    getConversation.mockReturnValueOnce(conversation.promise)

    const routePromise = AdminAiChatRoute({
      searchParams: Promise.resolve({ conversationId: "chat-1" }),
    })
    await Promise.resolve()
    await Promise.resolve()

    expect(getConversations).toHaveBeenCalledOnce()
    expect(getConversation).toHaveBeenCalledWith("chat-1")

    conversations.resolve({ status: "ok", value: [] })
    conversation.resolve({ status: "ok", value: { id: "chat-1" } })
    await routePromise
  })
})

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })

  return { promise, resolve }
}
