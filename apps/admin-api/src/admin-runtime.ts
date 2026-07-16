import { createAdminApiCore, type AdminApiCoreServices } from "@/admin-api-core"
import {
  createAdminAuth,
  createAdminAuthHandler,
  createAdminSessionResolver,
} from "@/auth/admin-auth"
import type { AdminSessionResolver } from "@/auth/admin-session"
import type { AdminApiEnv } from "@/env"
import { createWritingAppDatabase } from "@workspace/db"

export type AdminApiRuntime = {
  readonly authHandler: (request: Request) => Promise<Response>
  readonly close: () => void
  readonly services: AdminApiCoreServices
  readonly sessionResolver: AdminSessionResolver
}

export function createAdminApiRuntime({
  env,
}: {
  readonly env: AdminApiEnv
}): AdminApiRuntime {
  const database = createWritingAppDatabase(env.databaseUrl)

  return assembleAdminRuntime(database.close, (close) => {
    const core = createAdminApiCore({
      database: database.db,
    })
    const auth = createAdminAuth({
      authBaseUrl: env.authBaseUrl,
      cookieDomain: env.cookieDomain,
      db: database.db,
      secret: env.betterAuthSecret,
      webOrigin: env.adminOrigin,
    })

    return {
      authHandler: createAdminAuthHandler({
        auth,
        cookieDomain: env.cookieDomain,
        database,
      }),
      close,
      services: core.services,
      sessionResolver: createAdminSessionResolver(auth),
    }
  })
}

export function assembleAdminRuntime<TResult>(
  closeDatabase: () => void,
  assemble: (close: () => void) => TResult
): TResult {
  const close = createCloseOnce(closeDatabase)

  try {
    return assemble(close)
  } catch (error) {
    close()
    throw error
  }
}

function createCloseOnce(close: () => void): () => void {
  let closed = false

  return () => {
    if (closed) return
    closed = true
    close()
  }
}
