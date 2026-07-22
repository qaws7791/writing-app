import type { AdminActor } from "#identity/domain/admin-role"
import type {
  AdminAuthenticationPort,
  AuthenticatedAdminIdentity,
  AuthenticatedLearnerIdentity,
  LearnerAuthenticationPort,
} from "#identity/application/identity-ports"
import type { IdentityApplication } from "#identity/application/identity-service"
import type {
  AdminAuthenticatedSession,
  AdminSessionResolver,
  SessionResolver,
} from "#identity/application/identity-session"

export {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
  type AuthenticatedSession,
  type AdminSessionResolver,
  type SessionResolver,
} from "#identity/application/identity-session"

export function createLearnerSessionResolver(input: {
  readonly application: Pick<IdentityApplication, "resolveLearnerIdentity">
  readonly authentication: LearnerAuthenticationPort
}): SessionResolver {
  return {
    async resolveSession(headers) {
      const identity = await input.authentication.resolveIdentity(headers)
      if (identity === null) return null

      const result = await input.application.resolveLearnerIdentity(identity)
      return result.isOk() ? result.value : null
    },
  }
}

export function createAdminSessionResolver(input: {
  readonly application: Pick<IdentityApplication, "resolveAdminIdentity">
  readonly authentication: AdminAuthenticationPort
}): AdminSessionResolver {
  return {
    async resolveSession(headers) {
      const identity = await input.authentication.resolveIdentity(headers)
      if (identity === null) return null

      const result = await input.application.resolveAdminIdentity(identity)
      return result.isOk() ? result.value : null
    },
  }
}

export function toAdminActor(session: AdminAuthenticatedSession): AdminActor {
  return Object.freeze({
    id: session.admin.id,
    role: session.admin.role,
  })
}

export type { AuthenticatedAdminIdentity, AuthenticatedLearnerIdentity }
