import {
  OAuthError,
  OAuthErrorCode,
  type OAuthTokenVerifier,
} from "@modelcontextprotocol/server"

import type { AdminMcpAccessTokenVerifier } from "@/mcp/admin/admin-mcp-access-token-store"
import type { AdminMcpConfiguration } from "@/mcp/admin/admin-mcp-configuration"

export type AdminMcpAuthentication = Readonly<{
  verifier: OAuthTokenVerifier
}>

export function createAdminMcpAuthentication(input: {
  readonly accessTokenStore: AdminMcpAccessTokenVerifier
  readonly configuration: AdminMcpConfiguration
  readonly now: () => Date
}): AdminMcpAuthentication {
  return {
    verifier: {
      async verifyAccessToken(rawToken) {
        const now = input.now()
        const verification = await input.accessTokenStore.verify({
          now,
          rawToken,
        })
        if (verification.kind === "invalid") {
          throw invalidAccessToken()
        }

        const expiresAt = Math.floor(verification.expiresAt.getTime() / 1_000)
        if (
          !Number.isSafeInteger(expiresAt) ||
          expiresAt <= Math.floor(now.getTime() / 1_000)
        ) {
          throw invalidAccessToken()
        }

        return {
          clientId: verification.credentialId,
          expiresAt,
          extra: { adminId: verification.ownerAdminId },
          resource: new URL(input.configuration.resourceUrl),
          scopes: [...verification.scopes],
          token: rawToken,
        }
      },
    },
  }
}

function invalidAccessToken(): OAuthError {
  return new OAuthError(OAuthErrorCode.InvalidToken, "Access token is invalid")
}
