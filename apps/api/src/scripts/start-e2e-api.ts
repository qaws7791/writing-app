import { serve } from "bun"

import type { AiFeedbackProvider } from "@workspace/ai-feedback/ports"
import { ok } from "@workspace/kernel/result"

import { createApiRuntime } from "@/api-runtime"
import { createApp } from "@/app"
import { parseApiEnv } from "@/config/env"
import { createAdminApp } from "@/http/admin-app"
import { createUnifiedApp } from "@/http/unified-app"
import { createAppLogger } from "@workspace/observability/logger"
import {
  createUnifiedApiServerLifecycle,
  registerUnifiedApiShutdownSignals,
} from "@/server-lifecycle"

const env = parseApiEnv(process.env)

if (env.nodeEnv !== "test" || !env.testAuthEnabled) {
  throw new Error(
    "E2E API는 NODE_ENV=test와 ENABLE_TEST_AUTH=true가 필요합니다."
  )
}

const provider: AiFeedbackProvider = {
  async createFeedback() {
    return ok({
      improvements: ["근거를 한 문장 더 구체화해 보세요."],
      nextAction: "같은 주장을 더 짧게 다시 써보세요.",
      score: 90,
      strengths: ["핵심 장점을 명확하게 표현했습니다."],
      summary: "서버 상태 전이의 장점을 잘 설명했습니다.",
    })
  },
}
const runtime = createApiRuntime({
  aiFeedbackProvider: provider,
  env,
  logger: createAppLogger({ level: env.logLevel, pretty: env.logPretty }),
})
const unifiedFetch = (() => {
  try {
    const app = createApp({
      aiFeedbackRoutes: runtime.learnerCore.aiFeedbackRoutes,
      authHandler: runtime.learnerCore.authHandler,
      identityRoutes: runtime.learnerCore.identityRoutes,
      learningRoutes: runtime.learnerCore.learningRoutes,
      sessionResolver: runtime.learnerCore.sessionResolver,
      webOrigin: env.webOrigin,
    })
    const adminApp = createAdminApp({
      adminOrigin: env.adminOrigin,
      authHandler: runtime.adminAuth.authHandler,
      capabilityRoutes: runtime.adminCapabilityRoutes,
      sessionResolver: runtime.adminSessionResolver,
    })

    return createUnifiedApp({
      adminApp,
      allowedHosts: env.allowedHosts,
      learnerApp: app,
    }).fetch
  } catch (error) {
    runtime.dispose()
    throw error
  }
})()

const lifecycle = createUnifiedApiServerLifecycle({
  closeDatabase: runtime.dispose,
  fetch: unifiedFetch,
  onShutdownError(error, phase) {
    process.stderr.write(`E2E API 종료 실패 (${phase}): ${String(error)}\n`)
  },
})
let server: ReturnType<typeof serve> | undefined
try {
  server = serve({ fetch: lifecycle.fetch, port: env.port })
  lifecycle.attachServer(server)
  registerUnifiedApiShutdownSignals(lifecycle.shutdown)
} catch (error) {
  try {
    await server?.stop(true)
  } finally {
    runtime.dispose()
  }
  throw error
}
