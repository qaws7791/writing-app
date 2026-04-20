import type { RateLimitBackend } from "../../rate-limit/rate-limit-backend"
import { createCompareTextsRoute } from "./compare-texts"
import { createGenerateTextFeedbackRoute } from "./generate-text-feedback"

type AiRouteDependencies = {
  rateLimitBackend: RateLimitBackend
}

export function aiRoutes({ rateLimitBackend }: AiRouteDependencies) {
  return [
    createGenerateTextFeedbackRoute(rateLimitBackend),
    createCompareTextsRoute(rateLimitBackend),
  ] as const
}
