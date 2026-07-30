import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"

type LearnerFixtureInput = Readonly<{
  accountId?: string
  createdAt?: number
  deletedAt?: number | null
  displayName?: string
  email?: string
  id: string
  /** identity가 아직 profile을 provisioning하지 않은 인증 사용자 상태를 만든다. */
  includeProfile?: boolean
  name?: string
  sessionId?: string
  sessionToken?: string
  status?: "active" | "deleted"
  version?: number
}>

export function aLearner(
  sqlite: WritingAppSqlite,
  input: LearnerFixtureInput
): void {
  const createdAt = input.createdAt ?? 1
  const status = input.status ?? "active"
  const version = input.version ?? 0
  const displayName = input.displayName ?? input.name ?? input.id
  const email = input.email ?? `${input.id}@example.test`
  const name = input.name ?? displayName

  sqlite
    .query<void, [string, string, string, number]>(
      `INSERT INTO user (
        id, name, email, email_verified, image, created_at, updated_at
      ) VALUES (?1, ?2, ?3, 1, NULL, ?4, ?4)`
    )
    .run(input.id, name, email, createdAt)

  if (input.includeProfile !== false) {
    sqlite
      .query<void, [string, string, string, number | null, number]>(
        `INSERT INTO learner_profiles (
          user_id, status, display_name, deleted_at, version
        ) VALUES (?1, ?2, ?3, ?4, ?5)`
      )
      .run(input.id, status, displayName, input.deletedAt ?? null, version)
  }

  if (input.sessionId !== undefined && input.sessionToken !== undefined) {
    sqlite
      .query<void, [string, string, string, number]>(
        `INSERT INTO session (
          id, user_id, token, expires_at, created_at, updated_at
        ) VALUES (?1, ?2, ?3, 4102444800000, ?4, ?4)`
      )
      .run(input.sessionId, input.id, input.sessionToken, createdAt)
  }

  if (input.accountId !== undefined) {
    sqlite
      .query<void, [string, string, number]>(
        `INSERT INTO account (
          id, user_id, account_id, provider_id, created_at, updated_at
        ) VALUES (?1, ?2, ?2, 'credential', ?3, ?3)`
      )
      .run(input.accountId, input.id, createdAt)
  }
}
