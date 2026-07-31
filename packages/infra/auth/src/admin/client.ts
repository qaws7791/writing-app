import type { FetchImplementation } from "#auth/shared/client"

export type AdminAuthClientErrorCode =
  | "invalid-credentials"
  | "rate-limited"
  | "unknown"

export class AdminAuthClientError extends Error {
  readonly code: AdminAuthClientErrorCode

  constructor(code: AdminAuthClientErrorCode) {
    super(`Admin authentication failed: ${code}`)
    this.name = "AdminAuthClientError"
    this.code = code
  }
}

export function isAdminAuthClientError(
  error: unknown
): error is AdminAuthClientError {
  return error instanceof AdminAuthClientError
}

export type AdminAuthClient = {
  readonly changePassword: (input: {
    readonly currentPassword: string
    readonly newPassword: string
  }) => Promise<void>
  readonly signInWithPassword: (input: {
    readonly callbackURL: string
    readonly email: string
    readonly password: string
  }) => Promise<void>
  readonly signOut: () => Promise<void>
}

export function createAdminAuthClient(input: {
  readonly fetch: FetchImplementation
}): AdminAuthClient {
  return {
    async changePassword(passwordInput) {
      await requestAdminAuthJson(input, "/api/admin/auth/change-password", {
        ...passwordInput,
        revokeOtherSessions: true,
      })
    },
    async signInWithPassword(credentials) {
      await requestAdminAuthJson(
        input,
        "/api/admin/auth/sign-in/email",
        credentials
      )
    },
    async signOut() {
      const response = await input.fetch("/api/admin/auth/sign-out", {
        credentials: "include",
        method: "POST",
      })

      if (!response.ok) {
        throw new AdminAuthClientError(readAdminAuthErrorCode(response.status))
      }
    },
  }
}

async function requestAdminAuthJson(
  client: {
    readonly fetch: FetchImplementation
  },
  path: string,
  body: Readonly<object>
): Promise<void> {
  const response = await client.fetch(path, {
    body: JSON.stringify(body),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  if (!response.ok) {
    throw new AdminAuthClientError(readAdminAuthErrorCode(response.status))
  }
}

function readAdminAuthErrorCode(status: number): AdminAuthClientErrorCode {
  if (status === 429) return "rate-limited"
  if (status === 400 || status === 401 || status === 403) {
    return "invalid-credentials"
  }

  return "unknown"
}
