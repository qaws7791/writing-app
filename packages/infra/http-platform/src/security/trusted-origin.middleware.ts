import type { MiddlewareHandler } from "hono"

import { AppError } from "#http-platform/errors"

const stateChangingMethods = new Set(["DELETE", "PATCH", "POST", "PUT"])

export function createTrustedOriginMiddleware({
  trustedOrigin,
}: {
  readonly trustedOrigin: string
}): MiddlewareHandler {
  const normalizedTrustedOrigin = new URL(trustedOrigin).origin

  return async (context, next) => {
    if (
      !stateChangingMethods.has(context.req.method) ||
      context.req.header("Cookie") === undefined
    ) {
      await next()
      return
    }

    const requestOrigin = context.req.header("Origin")
    const fetchSite = context.req.header("Sec-Fetch-Site")
    const hasTrustedOrigin = requestOrigin === normalizedTrustedOrigin
    const hasAllowedFetchSite =
      fetchSite === undefined ||
      fetchSite === "same-origin" ||
      fetchSite === "same-site"

    if (!hasTrustedOrigin || !hasAllowedFetchSite) {
      throw new AppError({
        code: "FORBIDDEN_ORIGIN",
        message: "Forbidden",
        status: 403,
      })
    }

    await next()
  }
}
