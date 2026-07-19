import { AdminAiChatPage } from "@/features/ai-chat/ui/admin-ai-chat-page"
import { createAdminAiChatDal } from "@/features/ai-chat/server/admin-ai-chat-dal"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import { redirect } from "next/navigation"
import { conversationIdSchema } from "@/features/ai-chat/model/conversation-id"

export default async function AdminAiChatRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const conversationId = conversationIdSchema.safeParse(
    readString(resolvedSearchParams["conversationId"], "")
  )
  const api = createAdminAiChatDal(
    getServerAdminHttpTransport({
      tokenProvider: getServerAdminSessionToken,
    })
  )
  const conversationsPromise = api.getAiChatConversations()
  const activeConversationPromise = !conversationId.success
    ? Promise.resolve(null)
    : api.getAiChatConversation(conversationId.data)
  const [conversationsResult, activeConversationResult] = await Promise.all([
    conversationsPromise,
    activeConversationPromise,
  ])

  if (
    activeConversationResult?.status === "error" &&
    activeConversationResult.error.code === "not-found"
  ) {
    redirect("/chat")
  }

  return (
    <AdminAiChatPage
      activeConversationResult={activeConversationResult}
      conversationsResult={conversationsResult}
    />
  )
}

function readString(value: string | string[] | undefined, fallback: string) {
  return typeof value === "string" ? value : fallback
}
