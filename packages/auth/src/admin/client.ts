import { buildAuthApiUrl, type FetchImplementation } from "#auth/shared/client"

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
  readonly baseURL: string
  readonly fetch: FetchImplementation
}): AdminAuthClient {
  return {
    async changePassword(passwordInput) {
      await requestAdminAuthJson(
        input,
        "/api/admin/auth/change-password",
        {
          ...passwordInput,
          revokeOtherSessions: true,
        },
        "Admin authentication request failed"
      )
    },
    async signInWithPassword(credentials) {
      await requestAdminAuthJson(
        input,
        "/api/admin/auth/sign-in/email",
        credentials,
        "Failed to sign in"
      )
    },
    async signOut() {
      const response = await input.fetch(
        buildAuthApiUrl(input.baseURL, "/api/admin/auth/sign-out"),
        {
          credentials: "include",
          method: "POST",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to sign out")
      }
    },
  }
}

async function requestAdminAuthJson(
  client: {
    readonly baseURL: string
    readonly fetch: FetchImplementation
  },
  path: string,
  body: Readonly<object>,
  errorMessage: string
): Promise<void> {
  const response = await client.fetch(buildAuthApiUrl(client.baseURL, path), {
    body: JSON.stringify(body),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  if (!response.ok) {
    throw new Error(errorMessage)
  }
}
