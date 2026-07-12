import { AdminAiChatPage } from "@/features/chat/admin-ai-chat-page"
import { createAdminAiChatApi } from "@/features/chat/admin-ai-chat-api"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"
import { redirect } from "next/navigation"
import { conversationIdSchema } from "@/lib/api/admin-identity"

export default async function AdminAiChatRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const conversationId = conversationIdSchema.safeParse(
    readString(resolvedSearchParams["conversationId"], "")
  )
  const api = createAdminAiChatApi(
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
