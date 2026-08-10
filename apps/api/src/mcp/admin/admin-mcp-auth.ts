import { Buffer } from "node:buffer"

import {
  OAuthError,
  OAuthErrorCode,
  type AuthInfo,
  type OAuthMetadata,
  type OAuthTokenVerifier,
} from "@modelcontextprotocol/server"
import { z } from "zod"

import type { AdminMcpConfiguration } from "@/mcp/admin/admin-mcp-configuration"

const oauthRequestTimeoutMs = 5_000
const maximumOAuthResponseBytes = 64 * 1_024

const oauthMetadataSchema = z
  .object({
    authorization_endpoint: z.url(),
    introspection_endpoint: z.url(),
    issuer: z.url(),
    response_types_supported: z
      .array(z.string().min(1).max(200))
      .min(1)
      .max(20),
    token_endpoint: z.url(),
  })
  .passthrough()

const introspectionResponseSchema = z
  .object({
    active: z.boolean(),
    aud: z
      .union([z.string().max(2_048), z.array(z.string().max(2_048)).max(20)])
      .optional(),
    client_id: z.string().trim().min(1).max(200).optional(),
    exp: z.number().int().positive().optional(),
    iss: z.string().max(2_048).optional(),
    scope: z.string().max(4_096).optional(),
    sub: z.string().max(200).optional(),
  })
  .passthrough()

export type AdminMcpAuthentication = Readonly<{
  oauthMetadata: OAuthMetadata & { readonly introspection_endpoint: string }
  verifier: OAuthTokenVerifier
}>

export type AdminMcpFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export async function createAdminMcpAuthentication(input: {
  readonly configuration: AdminMcpConfiguration
  readonly fetch?: AdminMcpFetch
  readonly now: () => Date
}): Promise<AdminMcpAuthentication> {
  const fetchImplementation = input.fetch ?? fetch
  const oauthMetadata = await readOAuthMetadata(
    input.configuration,
    fetchImplementation
  )

  return {
    oauthMetadata,
    verifier: {
      verifyAccessToken: (token) =>
        introspectAccessToken({
          configuration: input.configuration,
          fetch: fetchImplementation,
          introspectionEndpoint: oauthMetadata.introspection_endpoint,
          now: input.now,
          token,
        }),
    },
  }
}

async function readOAuthMetadata(
  configuration: AdminMcpConfiguration,
  fetchImplementation: AdminMcpFetch
): Promise<OAuthMetadata & { readonly introspection_endpoint: string }> {
  const response = await requestOAuthProvider(() =>
    fetchImplementation(configuration.oauthMetadataUrl, {
      cache: "no-store",
      headers: { accept: "application/json" },
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(oauthRequestTimeoutMs),
    })
  )
  if (!response.ok) {
    throw new Error("OAuth metadata endpoint is unavailable")
  }

  const parsed = oauthMetadataSchema.safeParse(await readJson(response))
  if (!parsed.success || parsed.data.issuer !== configuration.oauthIssuer) {
    throw new Error("OAuth metadata is invalid")
  }

  for (const endpoint of [
    parsed.data.authorization_endpoint,
    parsed.data.introspection_endpoint,
    parsed.data.token_endpoint,
  ]) {
    assertSecureOrLoopbackUrl(new URL(endpoint))
  }

  return parsed.data
}

async function introspectAccessToken(input: {
  readonly configuration: AdminMcpConfiguration
  readonly fetch: AdminMcpFetch
  readonly introspectionEndpoint: string
  readonly now: () => Date
  readonly token: string
}): Promise<AuthInfo> {
  const response = await requestOAuthProvider(() =>
    input.fetch(input.introspectionEndpoint, {
      body: new URLSearchParams({
        token: input.token,
        token_type_hint: "access_token",
      }),
      cache: "no-store",
      headers: {
        accept: "application/json",
        authorization: createBasicAuthorizationHeader(
          input.configuration.introspectionClientId,
          input.configuration.introspectionClientSecret
        ),
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(oauthRequestTimeoutMs),
    })
  )
  if (!response.ok) {
    throw new OAuthError(
      OAuthErrorCode.ServerError,
      "Token verification is unavailable"
    )
  }

  const parsed = introspectionResponseSchema.safeParse(await readJson(response))
  if (!parsed.success) {
    throw new OAuthError(
      OAuthErrorCode.ServerError,
      "Token verification response is invalid"
    )
  }

  const value = parsed.data
  const audiences =
    typeof value.aud === "string" ? [value.aud] : (value.aud ?? [])
  const expiresAt = value.exp
  if (
    !value.active ||
    value.iss !== input.configuration.oauthIssuer ||
    !audiences.includes(input.configuration.resourceUrl) ||
    value.sub !== input.configuration.ownerSubject ||
    value.client_id === undefined ||
    expiresAt === undefined ||
    expiresAt <= Math.floor(input.now().getTime() / 1_000)
  ) {
    throw new OAuthError(OAuthErrorCode.InvalidToken, "Access token is invalid")
  }

  return {
    clientId: value.client_id,
    expiresAt,
    extra: { adminId: input.configuration.ownerAdminId },
    resource: new URL(input.configuration.resourceUrl),
    scopes: readScopes(value.scope),
    token: input.token,
  }
}

async function requestOAuthProvider(
  request: () => Promise<Response>
): Promise<Response> {
  try {
    return await request()
  } catch (cause) {
    if (OAuthError.isInstance(cause)) throw cause
    throw new OAuthError(
      OAuthErrorCode.ServerError,
      "Token verification is unavailable"
    )
  }
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type")?.toLowerCase()
  if (contentType?.split(";", 1)[0]?.trim() !== "application/json") {
    throw new Error("OAuth response content type is invalid")
  }

  const contentLength = Number(response.headers.get("content-length"))
  if (
    Number.isFinite(contentLength) &&
    contentLength > maximumOAuthResponseBytes
  ) {
    throw new Error("OAuth response is too large")
  }

  const body = await response.text()
  if (new TextEncoder().encode(body).byteLength > maximumOAuthResponseBytes) {
    throw new Error("OAuth response is too large")
  }
  return JSON.parse(body) as unknown
}

function createBasicAuthorizationHeader(
  clientId: string,
  clientSecret: string
): string {
  const credentials = `${encodeFormValue(clientId)}:${encodeFormValue(clientSecret)}`
  return `Basic ${Buffer.from(credentials, "utf8").toString("base64")}`
}

function encodeFormValue(value: string): string {
  const search = new URLSearchParams({ value }).toString()
  return search.slice("value=".length)
}

function readScopes(scope: string | undefined): string[] {
  const normalized = scope?.trim()
  return normalized === undefined || normalized === ""
    ? []
    : [...new Set(normalized.split(/\s+/u))]
}

function assertSecureOrLoopbackUrl(url: URL): void {
  if (url.username !== "" || url.password !== "") {
    throw new Error("OAuth endpoint must not contain credentials")
  }
  if (url.protocol !== "https:" && !isLoopbackHostname(url.hostname)) {
    throw new Error("OAuth endpoint must use HTTPS")
  }
}

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  )
}
