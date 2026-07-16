import { serve } from "bun"

import { aiFeedbackPayloadSchema } from "@workspace/contracts/ai-feedback"
import type { AiFeedbackProvider } from "@workspace/core/ai-feedback"
import { createLearnerApiCore } from "@workspace/core/learner-api-core"

import { createApp } from "@/app"
import { parseApiEnv } from "@/config/env"
import {
  createLearnerApiServerLifecycle,
  registerLearnerApiShutdownSignals,
} from "@/server-lifecycle"

const env = parseApiEnv(process.env)

if (env.nodeEnv !== "test" || !env.testAuthEnabled) {
  throw new Error(
    "E2E API는 NODE_ENV=test와 ENABLE_TEST_AUTH=true가 필요합니다."
  )
}

const provider: AiFeedbackProvider = {
  async createFeedback() {
    return {
      kind: "ok",
      value: aiFeedbackPayloadSchema.parse({
        improvements: ["근거를 한 문장 더 구체화해 보세요."],
        nextAction: "같은 주장을 더 짧게 다시 써보세요.",
        score: 90,
        scoreRange: [0, 100],
        showScore: true,
        strengths: ["핵심 장점을 명확하게 표현했습니다."],
        summary: "서버 상태 전이의 장점을 잘 설명했습니다.",
      }),
    }
  },
}
const core = createLearnerApiCore({
  aiFeedbackProvider: provider,
  authBaseUrl: env.authBaseUrl,
  betterAuthSecret: env.betterAuthSecret,
  cookieDomain: env.cookieDomain,
  cursorSigningSecret: env.cursorSigningSecret,
  databaseUrl: env.databaseUrl,
  googleClientId: env.googleClientId,
  googleClientSecret: env.googleClientSecret,
  openAiModel: env.openAiModel,
  testAuthEnabled: env.testAuthEnabled,
  webOrigin: env.webOrigin,
})
const app = createApp({
  authHandler: core.authHandler,
  contentService: core.contentService,
  learnerAiFeedbackService: core.learnerAiFeedbackService,
  learnerTransitionService: core.learnerTransitionService,
  profileReader: core.profileReader,
  progressService: core.progressService,
  sessionResolver: core.sessionResolver,
  webOrigin: env.webOrigin,
})

const lifecycle = createLearnerApiServerLifecycle({
  closeCore: core.close,
  fetch: app.fetch,
  onShutdownError(error, phase) {
    process.stderr.write(`E2E API 종료 실패 (${phase}): ${String(error)}\n`)
  },
})
const server = serve({ fetch: lifecycle.fetch, port: env.port })
lifecycle.attachServer(server)
registerLearnerApiShutdownSignals(lifecycle.shutdown)
