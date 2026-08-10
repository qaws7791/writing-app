import {
  adminIdSchema,
  type AdminId,
} from "@workspace/contracts/identity/admin-ids"
import { z } from "zod"

export const adminMcpPath = "/mcp/admin"
export const adminMcpDraftScope = "admin:mcp:draft"
export const adminMcpLifecycleScope = "admin:mcp:lifecycle"
export const adminMcpPublishScope = "admin:mcp:publish"
export const adminMcpReadScope = "admin:mcp:read"
export const adminMcpUserDeleteScope = "admin:mcp:user-delete"
export const adminMcpUserStatusScope = "admin:mcp:user-status"

export type AdminMcpChangeConfiguration = Readonly<{
  adminOrigin: string
  approvalTtlMs: number
  executionLeaseMs: number
  requestStateSecret: string
}>

export type AdminMcpConfiguration = Readonly<{
  changes: AdminMcpChangeConfiguration | undefined
  introspectionClientId: string
  introspectionClientSecret: string
  oauthIssuer: string
  oauthMetadataUrl: string
  ownerAdminId: AdminId
  ownerSubject: string
  resourceUrl: string
}>

const adminMcpConfigurationSchema = z.strictObject({
  introspectionClientId: z.string().trim().min(1).max(200),
  introspectionClientSecret: z.string().min(1),
  oauthIssuer: z.url(),
  oauthMetadataUrl: z.url(),
  ownerAdminId: adminIdSchema,
  ownerSubject: z.string().trim().min(1).max(200),
  resourceUrl: z.url(),
})

const adminMcpChangeConfigurationSchema = z.strictObject({
  approvalTtlSeconds: z.coerce.number().int().min(60).max(3_600),
  executionLeaseSeconds: z.coerce.number().int().min(1).max(600),
  requestStateSecret: z
    .string()
    .refine(
      (value) => new TextEncoder().encode(value).byteLength >= 32,
      "32바이트 이상의 값이 필요합니다."
    ),
})

const adminMcpEnvironmentNames = [
  "ADMIN_MCP_INTROSPECTION_CLIENT_ID",
  "ADMIN_MCP_INTROSPECTION_CLIENT_SECRET",
  "ADMIN_MCP_OAUTH_ISSUER",
  "ADMIN_MCP_OAUTH_METADATA_URL",
  "ADMIN_MCP_OWNER_ADMIN_ID",
  "ADMIN_MCP_OWNER_SUBJECT",
  "ADMIN_MCP_RESOURCE_URL",
] as const

const adminMcpChangeEnvironmentNames = [
  "ADMIN_MCP_APPROVAL_TTL_SECONDS",
  "ADMIN_MCP_EXECUTION_LEASE_SECONDS",
  "ADMIN_MCP_REQUEST_STATE_SECRET",
] as const

type DeploymentEnvironment = "development" | "test" | "staging" | "production"

export function parseAdminMcpConfiguration(
  input: Record<string, string | undefined>,
  deploymentEnvironment: DeploymentEnvironment,
  adminOrigin = "http://localhost:3001"
): AdminMcpConfiguration | undefined {
  const enabled = input["ADMIN_MCP_ENABLED"]?.trim()
  if (enabled !== undefined && enabled !== "true" && enabled !== "false") {
    throw invalidAdminMcpConfiguration(
      "ADMIN_MCP_ENABLED는 true 또는 false여야 합니다."
    )
  }

  const hasConfigurationValue = adminMcpEnvironmentNames.some(
    (name) => input[name] !== undefined
  )
  const changesEnabled = readBooleanFlag(
    input["ADMIN_MCP_CHANGES_ENABLED"],
    "ADMIN_MCP_CHANGES_ENABLED"
  )
  const hasChangeConfigurationValue = adminMcpChangeEnvironmentNames.some(
    (name) => input[name] !== undefined
  )
  if (enabled !== "true") {
    if (
      hasConfigurationValue ||
      changesEnabled ||
      hasChangeConfigurationValue
    ) {
      throw invalidAdminMcpConfiguration(
        "ADMIN_MCP 설정값은 ADMIN_MCP_ENABLED=true와 함께 지정해야 합니다."
      )
    }
    return undefined
  }

  if (deploymentEnvironment === "production") {
    throw invalidAdminMcpConfiguration(
      "production 관리자 MCP를 활성화할 수 없습니다."
    )
  }

  const parsed = adminMcpConfigurationSchema.safeParse({
    introspectionClientId: input["ADMIN_MCP_INTROSPECTION_CLIENT_ID"],
    introspectionClientSecret: input["ADMIN_MCP_INTROSPECTION_CLIENT_SECRET"],
    oauthIssuer: input["ADMIN_MCP_OAUTH_ISSUER"],
    oauthMetadataUrl: input["ADMIN_MCP_OAUTH_METADATA_URL"],
    ownerAdminId: input["ADMIN_MCP_OWNER_ADMIN_ID"],
    ownerSubject: input["ADMIN_MCP_OWNER_SUBJECT"],
    resourceUrl: input["ADMIN_MCP_RESOURCE_URL"],
  })
  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .filter((field) => field.length > 0)
    throw invalidAdminMcpConfiguration(
      `${[...new Set(fields)].join(", ")}: 값이 없거나 올바르지 않습니다.`
    )
  }

  const resourceUrl = new URL(parsed.data.resourceUrl)
  if (
    resourceUrl.pathname !== adminMcpPath ||
    resourceUrl.search !== "" ||
    resourceUrl.hash !== ""
  ) {
    throw invalidAdminMcpConfiguration(
      `ADMIN_MCP_RESOURCE_URL은 ${adminMcpPath} 경로만 사용해야 합니다.`
    )
  }

  assertSecureOrLoopbackUrl(resourceUrl, "ADMIN_MCP_RESOURCE_URL")
  assertUrlHasNoCredentials(resourceUrl, "ADMIN_MCP_RESOURCE_URL")

  const oauthIssuer = new URL(parsed.data.oauthIssuer)
  assertSecureOrLoopbackUrl(oauthIssuer, "ADMIN_MCP_OAUTH_ISSUER")
  assertUrlHasNoCredentials(oauthIssuer, "ADMIN_MCP_OAUTH_ISSUER")
  if (oauthIssuer.search !== "" || oauthIssuer.hash !== "") {
    throw invalidAdminMcpConfiguration(
      "ADMIN_MCP_OAUTH_ISSUER에는 query 또는 fragment를 사용할 수 없습니다."
    )
  }

  const oauthMetadataUrl = new URL(parsed.data.oauthMetadataUrl)
  assertSecureOrLoopbackUrl(oauthMetadataUrl, "ADMIN_MCP_OAUTH_METADATA_URL")
  assertUrlHasNoCredentials(oauthMetadataUrl, "ADMIN_MCP_OAUTH_METADATA_URL")
  if (oauthMetadataUrl.hash !== "") {
    throw invalidAdminMcpConfiguration(
      "ADMIN_MCP_OAUTH_METADATA_URL에는 fragment를 사용할 수 없습니다."
    )
  }

  if (!changesEnabled && hasChangeConfigurationValue) {
    throw invalidAdminMcpConfiguration(
      "ADMIN_MCP 변경 설정값은 ADMIN_MCP_CHANGES_ENABLED=true와 함께 지정해야 합니다."
    )
  }

  const changes = changesEnabled
    ? parseAdminMcpChangeConfiguration(input, adminOrigin)
    : undefined
  if (changes?.requestStateSecret === parsed.data.introspectionClientSecret) {
    throw invalidAdminMcpConfiguration(
      "ADMIN_MCP_REQUEST_STATE_SECRET은 introspection client secret과 다른 값을 사용해야 합니다."
    )
  }

  return { ...parsed.data, changes }
}

function parseAdminMcpChangeConfiguration(
  input: Record<string, string | undefined>,
  adminOrigin: string
): AdminMcpChangeConfiguration {
  const parsed = adminMcpChangeConfigurationSchema.safeParse({
    approvalTtlSeconds: input["ADMIN_MCP_APPROVAL_TTL_SECONDS"],
    executionLeaseSeconds: input["ADMIN_MCP_EXECUTION_LEASE_SECONDS"],
    requestStateSecret: input["ADMIN_MCP_REQUEST_STATE_SECRET"],
  })
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join("."))
    throw invalidAdminMcpConfiguration(
      `${[...new Set(fields)].join(", ")}: 값이 없거나 올바르지 않습니다.`
    )
  }

  return {
    adminOrigin: new URL(adminOrigin).origin,
    approvalTtlMs: parsed.data.approvalTtlSeconds * 1_000,
    executionLeaseMs: parsed.data.executionLeaseSeconds * 1_000,
    requestStateSecret: parsed.data.requestStateSecret,
  }
}

function readBooleanFlag(value: string | undefined, name: string): boolean {
  const normalized = value?.trim()
  if (normalized === undefined || normalized === "false") return false
  if (normalized === "true") return true
  throw invalidAdminMcpConfiguration(`${name}은 true 또는 false여야 합니다.`)
}

function assertUrlHasNoCredentials(url: URL, name: string): void {
  if (url.username === "" && url.password === "") return
  throw invalidAdminMcpConfiguration(
    `${name}에는 username 또는 password를 포함할 수 없습니다.`
  )
}

function assertSecureOrLoopbackUrl(url: URL, name: string): void {
  if (url.protocol === "https:" || isLoopbackHostname(url.hostname)) return

  throw invalidAdminMcpConfiguration(
    `${name}은 HTTPS 또는 loopback URL이어야 합니다.`
  )
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

function invalidAdminMcpConfiguration(message: string): Error {
  return new Error(`Invalid environment variables: ${message}`)
}
