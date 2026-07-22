import type { AiFeedbackProvider } from "@workspace/ai-feedback/ports"
import { ok } from "@workspace/kernel/result"

import { startApiServer } from "@/main"

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

if (import.meta.main) {
  await startApiServer(process.env, {
    container: { aiFeedbackProvider: provider },
    validateEnv(env) {
      if (env.nodeEnv !== "test" || !env.testAuthEnabled) {
        throw new Error(
          "E2E API는 NODE_ENV=test와 ENABLE_TEST_AUTH=true가 필요합니다."
        )
      }
    },
  })
}
