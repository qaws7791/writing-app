import { AdminAiChatPage } from "@/features/chat/admin-ai-chat-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"
import { redirect } from "next/navigation"

export default async function AdminAiChatRoute({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = await searchParams
  const conversationId = readString(resolvedSearchParams["conversationId"], "")
  const api = getServerAdminApi({
    tokenProvider: getServerAdminSessionToken,
  })
  const conversationsResult = await api.getAiChatConversations()
  const activeConversationResult =
    conversationId === ""
      ? null
      : await api.getAiChatConversation(conversationId)

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
