import {
  createAdminMastra,
  createMastraAdminAiChatAgent,
} from "@/adapters/ai-chat/admin-content-agent"
import type { AdminRouteCompositionContext } from "@/composition/admin-route-composition-context"
import type { AdminRouteGroup } from "@/http/admin-route-group"
import { createAdminAiChatRepository } from "@/adapters/ai-chat/admin-ai-chat-drizzle.repository"
import { createAiChatRequestGuard } from "@/modules/admin-ai-chat/ai-chat-request-guard"
import { createAdminAiChatRoutes } from "@/modules/admin-ai-chat/admin-ai-chat.routes"

export function composeAdminAiChatRouteGroup(
  context: AdminRouteCompositionContext
): AdminRouteGroup {
  return createAdminAiChatRoutes({
    aiChatAgent: createConfiguredAdminAiChatAgent(context),
    aiChatEventLogger: context.logger,
    aiChatRequestGuard: createAiChatRequestGuard(),
    aiChatRepository: createAdminAiChatRepository(context.database),
    now: context.now,
    sessionResolver: context.sessionResolver,
  })
}

function createConfiguredAdminAiChatAgent(
  context: AdminRouteCompositionContext
) {
  if (context.env.openAiApiKey === undefined) return undefined

  return createMastraAdminAiChatAgent(
    createAdminMastra({
      openAiApiKey: context.env.openAiApiKey,
      openAiModel: context.env.openAiModel,
      resourceLibrary: context.resourceLibrary.knowledgeQuery,
    })
  )
}
