import { articleView } from "@/features/article/ui/article"
import { readRequestValue } from "@/server/request"

export const allowedFrontendFixture = `${articleView}:${readRequestValue()}`
