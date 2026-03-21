import type { DevEmailInbox } from "../auth-email.js"
import { createApiRouter, type ApiRouter } from "../app-variables.js"

export function createDevAuthEmailsRouter(
  readLatestAuthEmail: DevEmailInbox["readLatestMessage"]
): ApiRouter {
  const router = createApiRouter()

  router.get("/auth-emails", (context) => {
    const email = String(context.req.query("email") ?? "").trim()
    const kind = context.req.query("kind")

    if (!email || (kind !== "password-reset" && kind !== "verification")) {
      return context.json(
        {
          error: {
            code: "validation_error",
            message: "email과 kind가 필요합니다.",
          },
        },
        400
      )
    }

    const message = readLatestAuthEmail({
      email,
      kind,
    })

    if (!message) {
      return context.json(
        {
          error: {
            code: "not_found",
            message: "전송된 인증 메일을 찾을 수 없습니다.",
          },
        },
        404
      )
    }

    return context.json(message)
  })

  return router
}
