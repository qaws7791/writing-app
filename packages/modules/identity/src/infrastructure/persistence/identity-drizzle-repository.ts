import { and, asc, eq } from "drizzle-orm"
import { err, ok } from "@workspace/kernel/result"
import {
  adminIdSchema,
  userIdSchema,
} from "@workspace/contracts/identity/admin-ids"
import type { WritingAppDatabase } from "@workspace/db/client"

import { parseAdminRole, type AdminIdentity } from "#identity/domain/admin-role"
import {
  createLearnerProfile,
  deletedLearnerDisplayName,
} from "#identity/domain/learner-profile"
import { userStatuses } from "#identity/domain/user-status"
import type {
  AdminIdentitySnapshot,
  IdentityRepository,
  LearnerProfileRecord,
  LearnerProfileSnapshot,
} from "#identity/application/identity-ports"
import {
  adminIdentityProfiles,
  learnerProfiles,
} from "#identity/infrastructure/persistence/schema"

export function createDrizzleIdentityRepository(
  database: WritingAppDatabase
): IdentityRepository {
  return {
    async findAdminIdentity(adminId) {
      return readAdminIdentity(database, adminId)
    },
    async findLearnerProfile(userId) {
      return readLearnerProfile(database, userId)
    },
    async listLearnerProfiles() {
      return readLearnerProfiles(database)
    },
    async provisionLearnerProfile(input) {
      database
        .insert(learnerProfiles)
        .values({
          deletedAt: input.profile.deletedAt,
          displayName: input.profile.displayName,
          status: input.profile.status,
          userId: input.profile.userId,
          version: 0,
        })
        .onConflictDoNothing({ target: learnerProfiles.userId })
        .run()

      const record = readLearnerProfile(database, input.profile.userId)
      if (record === null) {
        throw new Error("저장된 학습자 identity profile을 찾을 수 없습니다.")
      }
      return toLearnerProfileSnapshot(record, input.profile.displayName)
    },
    async saveAdminIdentity(input) {
      const nextVersion = input.expectedVersion + 1
      const updated = database
        .update(adminIdentityProfiles)
        .set({ role: input.identity.role, version: nextVersion })
        .where(
          and(
            eq(adminIdentityProfiles.adminId, input.identity.id),
            eq(adminIdentityProfiles.version, input.expectedVersion)
          )
        )
        .returning({ version: adminIdentityProfiles.version })
        .get()

      return updated === undefined
        ? err({ kind: "identity-conflict" })
        : ok({ identity: input.identity, version: nextVersion })
    },
    async saveLearnerProfile(input) {
      const nextVersion = (input.expectedVersion ?? -1) + 1
      const values = {
        deletedAt: input.profile.deletedAt,
        displayName: input.profile.displayName,
        status: input.profile.status,
        version: nextVersion,
      }

      if (input.expectedVersion === null) {
        const inserted = database
          .insert(learnerProfiles)
          .values({
            ...values,
            userId: input.profile.userId,
          })
          .onConflictDoNothing({ target: learnerProfiles.userId })
          .returning({ version: learnerProfiles.version })
          .get()

        return inserted === undefined
          ? err({ kind: "identity-conflict" })
          : ok({ profile: input.profile, version: nextVersion })
      }

      const updated = database
        .update(learnerProfiles)
        .set(values)
        .where(
          and(
            eq(learnerProfiles.userId, input.profile.userId),
            eq(learnerProfiles.version, input.expectedVersion)
          )
        )
        .returning({ version: learnerProfiles.version })
        .get()

      return updated === undefined
        ? err({ kind: "identity-conflict" })
        : ok({ profile: input.profile, version: nextVersion })
    },
  }
}

function readAdminIdentity(
  database: WritingAppDatabase,
  adminId: Parameters<IdentityRepository["findAdminIdentity"]>[0]
): AdminIdentitySnapshot | null {
  const row = database
    .select({
      adminId: adminIdentityProfiles.adminId,
      role: adminIdentityProfiles.role,
      version: adminIdentityProfiles.version,
    })
    .from(adminIdentityProfiles)
    .where(eq(adminIdentityProfiles.adminId, adminId))
    .get()
  if (row === undefined) return null

  const role = parseAdminRole(row.role)
  if (role === null) throw new Error("저장된 관리자 role이 올바르지 않습니다.")

  const identity: AdminIdentity = Object.freeze({
    id: adminIdSchema.parse(row.adminId),
    role,
  })
  return Object.freeze({ identity, version: row.version })
}

function readLearnerProfile(
  database: WritingAppDatabase,
  userId: Parameters<IdentityRepository["findLearnerProfile"]>[0]
): LearnerProfileRecord | null {
  const row = database
    .select()
    .from(learnerProfiles)
    .where(eq(learnerProfiles.userId, userId))
    .get()

  return row === undefined ? null : toLearnerProfileRecord(row)
}

function readLearnerProfiles(
  database: WritingAppDatabase
): readonly LearnerProfileRecord[] {
  return database
    .select()
    .from(learnerProfiles)
    .orderBy(asc(learnerProfiles.userId))
    .all()
    .map(toLearnerProfileRecord)
}

function toLearnerProfileRecord(row: {
  readonly deletedAt: Date | null
  readonly displayName: string | null
  readonly status: "active" | "deleted" | "suspended"
  readonly userId: string
  readonly version: number
}): LearnerProfileRecord {
  return Object.freeze({
    deletedAt: row.deletedAt === null ? null : new Date(row.deletedAt),
    displayName: row.displayName,
    status: row.status,
    userId: userIdSchema.parse(row.userId),
    version: row.version,
  })
}

function toLearnerProfileSnapshot(
  record: LearnerProfileRecord,
  fallbackDisplayName: string
): LearnerProfileSnapshot {
  const profile = createLearnerProfile({
    deletedAt: record.deletedAt,
    displayName:
      record.status === userStatuses.deleted
        ? deletedLearnerDisplayName
        : (record.displayName ?? fallbackDisplayName),
    status: record.status,
    userId: record.userId,
  })
  if (profile.isErr()) {
    throw new Error("저장된 학습자 identity profile이 올바르지 않습니다.")
  }

  return Object.freeze({
    profile: profile.value,
    version: record.version,
  })
}
