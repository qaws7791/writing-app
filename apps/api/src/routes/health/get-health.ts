import { healthCheckResponseSchema } from "@workspace/core/modules/home"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { route } from "../../http/route"
import { HealthCheckUseCase } from "../../runtime/modules/home"

export default route({
  method: "get",
  path: "/health",
  inject: { healthCheckUseCase: HealthCheckUseCase },
  response: { 200: healthCheckResponseSchema, default: defaultErrorResponse },
  meta: {
    description: "DB 쿼리 가능 여부와 AI 서브시스템 상태를 함께 확인합니다.",
    summary: "헬스 체크",
    tags: ["시스템"],
  },
  handler: ({ healthCheckUseCase }) => healthCheckUseCase(),
})
