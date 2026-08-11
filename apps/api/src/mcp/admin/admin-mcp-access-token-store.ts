import { createHash, randomBytes, timingSafeEqual } from "node:crypto"

import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { adminAuthUsers } from "@workspace/auth/schema"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { AdminId } from "@workspace/types/ids"
import { and, eq, isNull } from "drizzle-orm"

import {
  adminMcpAccessTokenEvents,
  adminMcpAccessTokens,
} from "@/mcp/admin/admin-mcp-access-token-schema"
import {
  adminMcpDraftScope,
  adminMcpLifecycleScope,
  adminMcpPublishScope,
  adminMcpReadScope,
  adminMcpUserDeleteScope,
  adminMcpUserStatusScope,
} from "@/mcp/admin/admin-mcp-configuration"

const credentialIdPattern = /^wmcp_[a-f0-9]{32}$/
const rawTokenPattern = /^(wmcp_[a-f0-9]{32})\.([A-Za-z0-9_-]{43})$/
const sha256ByteLength = 32
const dummyDigest = Buffer.alloc(sha256ByteLength)
const allowedScopes = new Set<string>([
  adminMcpDraftScope,
  adminMcpLifecycleScope,
  adminMcpPublishScope,
  adminMcpReadScope,
  adminMcpUserDeleteScope,
  adminMcpUserStatusScope,
])

type AdminMcpCredentialId = string

type AdminMcpAccessTokenVerification =
  | Readonly<{
      credentialId: AdminMcpCredentialId
      expiresAt: Date
      kind: "valid"
      ownerAdminId: AdminId
      scopes: readonly string[]
    }>
  | Readonly<{ kind: "invalid" }>

type AdminMcpAccessTokenIssueResult =
  | Readonly<{
      createdAt: Date
      credentialId: AdminMcpCredentialId
      expiresAt: Date
      kind: "issued"
      ownerAdminId: AdminId
      scopes: readonly string[]
      token: string
    }>
  | Readonly<{ kind: "actor-not-found" | "invalid-input" | "owner-not-found" }>

type AdminMcpAccessTokenRevokeResult = Readonly<{
  kind:
    | "actor-not-found"
    | "already-revoked"
    | "invalid-input"
    | "not-found"
    | "revoked"
}>

export type AdminMcpAccessTokenVerifier = Readonly<{
  verify: (input: {
    readonly now: Date
    readonly rawToken: string
  }) => Promise<AdminMcpAccessTokenVerification>
}>

export type AdminMcpAccessTokenStore = AdminMcpAccessTokenVerifier &
  Readonly<{
    issue: (input: {
      readonly actorAdminId: AdminId
      readonly createdAt: Date
      readonly expiresAt: Date
      readonly ownerAdminId: AdminId
      readonly scopes: readonly string[]
    }) => Promise<AdminMcpAccessTokenIssueResult>
    revoke: (input: {
      readonly actorAdminId: AdminId
      readonly credentialId: string
      readonly revokedAt: Date
    }) => Promise<AdminMcpAccessTokenRevokeResult>
  }>

type RandomBytes = (size: number) => Buffer

export function createAdminMcpAccessTokenStore(
  database: WritingAppDatabase,
  options: Readonly<{ randomBytes?: RandomBytes }> = {}
): AdminMcpAccessTokenStore {
  const generateRandomBytes = options.randomBytes ?? randomBytes

  return {
    async issue(input) {
      const normalized = normalizeIssueInput(input)
      if (normalized === null) return { kind: "invalid-input" }

      const credentialId = createCredentialId(generateRandomBytes)
      const secret = generateRandomBytes(sha256ByteLength).toString("base64url")
      if (secret.length !== 43) {
        throw new Error("관리자 MCP token secret 생성에 실패했습니다.")
      }
      const secretDigest = digestSecret(secret).toString("hex")
      const eventId = createEventId(generateRandomBytes)

      const result = database.transaction((transaction) => {
        if (!adminExists(transaction, normalized.actorAdminId)) {
          return { kind: "actor-not-found" } as const
        }
        if (!adminExists(transaction, normalized.ownerAdminId)) {
          return { kind: "owner-not-found" } as const
        }

        transaction
          .insert(adminMcpAccessTokens)
          .values({
            createdAt: normalized.createdAt,
            credentialId,
            expiresAt: normalized.expiresAt,
            ownerAdminId: normalized.ownerAdminId,
            revokedAt: null,
            scopesJson: JSON.stringify(normalized.scopes),
            secretDigest,
          })
          .run()
        transaction
          .insert(adminMcpAccessTokenEvents)
          .values({
            action: "issued",
            actorAdminId: normalized.actorAdminId,
            createdAt: normalized.createdAt,
            credentialId,
            id: eventId,
          })
          .run()

        return {
          createdAt: normalized.createdAt,
          credentialId,
          expiresAt: normalized.expiresAt,
          kind: "issued",
          ownerAdminId: normalized.ownerAdminId,
          scopes: normalized.scopes,
          token: `${credentialId}.${secret}`,
        } as const
      })

      return result
    },
    async revoke(input) {
      if (
        !credentialIdPattern.test(input.credentialId) ||
        !isValidDate(input.revokedAt)
      ) {
        return { kind: "invalid-input" }
      }

      return database.transaction((transaction) => {
        if (!adminExists(transaction, input.actorAdminId)) {
          return { kind: "actor-not-found" } as const
        }

        const current = transaction
          .select({
            createdAt: adminMcpAccessTokens.createdAt,
            revokedAt: adminMcpAccessTokens.revokedAt,
          })
          .from(adminMcpAccessTokens)
          .where(eq(adminMcpAccessTokens.credentialId, input.credentialId))
          .get()
        if (current === undefined) return { kind: "not-found" } as const
        if (input.revokedAt.getTime() < current.createdAt.getTime()) {
          return { kind: "invalid-input" } as const
        }
        if (current.revokedAt !== null) {
          return { kind: "already-revoked" } as const
        }

        const updated = transaction
          .update(adminMcpAccessTokens)
          .set({ revokedAt: input.revokedAt })
          .where(
            and(
              eq(adminMcpAccessTokens.credentialId, input.credentialId),
              isNull(adminMcpAccessTokens.revokedAt)
            )
          )
          .returning({ credentialId: adminMcpAccessTokens.credentialId })
          .get()
        if (updated === undefined) return { kind: "already-revoked" } as const

        transaction
          .insert(adminMcpAccessTokenEvents)
          .values({
            action: "revoked",
            actorAdminId: input.actorAdminId,
            createdAt: input.revokedAt,
            credentialId: input.credentialId,
            id: createEventId(generateRandomBytes),
          })
          .run()
        return { kind: "revoked" } as const
      })
    },
    async verify(input) {
      const parsed = parseRawToken(input.rawToken)
      const row =
        parsed === null
          ? undefined
          : database
              .select({
                expiresAt: adminMcpAccessTokens.expiresAt,
                ownerAdminId: adminMcpAccessTokens.ownerAdminId,
                revokedAt: adminMcpAccessTokens.revokedAt,
                scopesJson: adminMcpAccessTokens.scopesJson,
                secretDigest: adminMcpAccessTokens.secretDigest,
              })
              .from(adminMcpAccessTokens)
              .innerJoin(
                adminAuthUsers,
                eq(adminAuthUsers.id, adminMcpAccessTokens.ownerAdminId)
              )
              .where(eq(adminMcpAccessTokens.credentialId, parsed.credentialId))
              .get()
      const presentedDigest = digestSecret(parsed?.secret ?? input.rawToken)
      const storedDigest = readStoredDigest(row?.secretDigest)
      const digestMatches = timingSafeEqual(presentedDigest, storedDigest)

      if (
        parsed === null ||
        row === undefined ||
        !digestMatches ||
        !isValidDate(input.now) ||
        row.revokedAt !== null ||
        row.expiresAt.getTime() <= input.now.getTime()
      ) {
        return { kind: "invalid" }
      }

      const scopes = readScopes(row.scopesJson)
      const ownerAdminId = adminIdSchema.safeParse(row.ownerAdminId)
      if (scopes === null || !ownerAdminId.success) return { kind: "invalid" }

      return {
        credentialId: parsed.credentialId,
        expiresAt: row.expiresAt,
        kind: "valid",
        ownerAdminId: ownerAdminId.data,
        scopes,
      }
    },
  }
}

function adminExists(
  database: Pick<WritingAppDatabase, "select">,
  adminId: AdminId
): boolean {
  return (
    database
      .select({ id: adminAuthUsers.id })
      .from(adminAuthUsers)
      .where(eq(adminAuthUsers.id, adminId))
      .get() !== undefined
  )
}

function createCredentialId(
  generateRandomBytes: RandomBytes
): AdminMcpCredentialId {
  return `wmcp_${generateRandomBytes(16).toString("hex")}` as AdminMcpCredentialId
}

function createEventId(generateRandomBytes: RandomBytes): string {
  return `evt_${generateRandomBytes(16).toString("hex")}`
}

function digestSecret(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest()
}

function isValidDate(value: Date): boolean {
  return Number.isFinite(value.getTime())
}

function normalizeIssueInput(input: {
  readonly actorAdminId: AdminId
  readonly createdAt: Date
  readonly expiresAt: Date
  readonly ownerAdminId: AdminId
  readonly scopes: readonly string[]
}): Readonly<{
  actorAdminId: AdminId
  createdAt: Date
  expiresAt: Date
  ownerAdminId: AdminId
  scopes: readonly string[]
}> | null {
  if (
    !isValidDate(input.createdAt) ||
    !isValidDate(input.expiresAt) ||
    input.expiresAt.getTime() <= input.createdAt.getTime()
  ) {
    return null
  }

  const scopes = Object.freeze([...new Set(input.scopes)].sort())
  if (
    scopes.length === 0 ||
    scopes.length > 32 ||
    !scopes.includes(adminMcpReadScope) ||
    scopes.some((scope) => !allowedScopes.has(scope))
  ) {
    return null
  }

  return { ...input, scopes }
}

function parseRawToken(
  rawToken: string
): Readonly<{ credentialId: AdminMcpCredentialId; secret: string }> | null {
  const match = rawTokenPattern.exec(rawToken)
  if (match === null) return null
  return {
    credentialId: match[1] as AdminMcpCredentialId,
    secret: match[2] as string,
  }
}

function readScopes(value: string): readonly string[] | null {
  try {
    const parsed: unknown = JSON.parse(value)
    if (
      !Array.isArray(parsed) ||
      parsed.length === 0 ||
      parsed.length > 32 ||
      !parsed.includes(adminMcpReadScope) ||
      !parsed.every(
        (scope) => typeof scope === "string" && allowedScopes.has(scope)
      ) ||
      new Set(parsed).size !== parsed.length
    ) {
      return null
    }
    return Object.freeze([...new Set(parsed)].sort())
  } catch {
    return null
  }
}

function readStoredDigest(value: string | undefined): Buffer {
  if (value === undefined || !/^[a-f0-9]{64}$/.test(value)) return dummyDigest
  const digest = Buffer.from(value, "hex")
  return digest.length === sha256ByteLength ? digest : dummyDigest
}
