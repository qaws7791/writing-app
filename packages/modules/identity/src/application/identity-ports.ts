import type { Clock } from "@workspace/kernel/clock"
import type { Failure } from "@workspace/kernel/failure"
import type { Result } from "@workspace/kernel/result"
import type { AdminId, UserId } from "@workspace/types/ids"

import type { AdminActor } from "#identity/domain/admin-actor"
import type { IdentityError } from "#identity/domain/identity-error"
import type { LearnerProfile } from "#identity/domain/learner-profile"
import type { UserStatus } from "#identity/domain/user-status"

export type LearnerProfileSnapshot = Readonly<{
  profile: LearnerProfile
  version: number | null
}>

export type LearnerProfileRecord = Readonly<{
  deletedAt: Date | null
  displayName: string | null
  status: UserStatus
  userId: UserId
  version: number
}>

export type LearnerAccount = Readonly<{
  createdAt: Date
  email: string
  id: UserId
  image: string | null
  profile: LearnerProfileSnapshot
}>

export type IdentityRepository = Readonly<{
  findLearnerProfile: (userId: UserId) => Promise<LearnerProfileRecord | null>
  listLearnerProfiles: () => Promise<readonly LearnerProfileRecord[]>
  provisionLearnerProfile: (input: {
    readonly profile: LearnerProfile
  }) => Promise<LearnerProfileSnapshot>
  saveLearnerProfile: (input: {
    readonly expectedVersion: number | null
    readonly profile: LearnerProfile
  }) => Promise<Result<LearnerProfileSnapshot, IdentityError>>
}>

export type AuthenticatedLearnerIdentity = Readonly<{
  email: string
  id: UserId
  image: string | null
  joinedAt: Date
  name: string
}>

export type LearnerIdentityDirectoryPort = Readonly<{
  findLearnerIdentity: (
    userId: UserId
  ) => Promise<AuthenticatedLearnerIdentity | null>
  listLearnerIdentities: () => Promise<readonly AuthenticatedLearnerIdentity[]>
}>

export type AuthenticatedAdminIdentity = Readonly<{
  email: string
  expiresAt: Date
  id: AdminId
  name: string
}>

export type LearnerAuthenticationPort = Readonly<{
  resolveIdentity: (
    headers: Headers
  ) => Promise<AuthenticatedLearnerIdentity | null>
}>

export type AdminAuthenticationPort = Readonly<{
  resolveIdentity: (
    headers: Headers
  ) => Promise<AuthenticatedAdminIdentity | null>
}>

export type IdentitySessionRevocationError =
  Failure<"session-revocation-failed">

export type IdentitySessionRevocationPort = Readonly<{
  revokeLearnerSessions: (
    userId: UserId
  ) => Promise<Result<void, IdentitySessionRevocationError>>
}>

export type LearnerDeletionMarker = Readonly<{
  requestedAt: Date
  userId: UserId
}>

export type LearnerDeletionMarkerError =
  Failure<"deletion-marker-storage-failed">

export type LearnerDeletionMarkerStorePort = Readonly<{
  readAll: () => Promise<
    Result<readonly LearnerDeletionMarker[], LearnerDeletionMarkerError>
  >
  record: (
    marker: LearnerDeletionMarker
  ) => Promise<Result<void, LearnerDeletionMarkerError>>
}>

export type DeletedLearnerPurgeRepositoryError =
  Failure<"deleted-learner-purge-failed">

export type DeletedLearnerPurgeRepository = Readonly<{
  purgeDeletedBefore: (input: {
    readonly batchSize: number
    readonly cutoff: Date
    readonly dryRun: boolean
  }) => Promise<
    Result<
      Readonly<{ matchedUserCount: number; purgedUserCount: number }>,
      DeletedLearnerPurgeRepositoryError
    >
  >
}>

export type LearnerLearningReport = Readonly<{
  completedLessons: number
  currentStreakDays: number
  lastActive: string | null
  userId: UserId
}>

export type IdentityLearningReportPort = Readonly<{
  readActiveLessonCount: () => Promise<number>
  readLearnerReports: (
    userIds: readonly UserId[]
  ) => Promise<readonly LearnerLearningReport[]>
}>

export type LearnerProfileStats = Readonly<{
  completedLessons: number
  currentStreakDays: number
  lastActiveDate: string | null
  progressPercent: number
  totalLessons: number
}>

export type LearnerProfileStatsQuery = Readonly<{
  readProfileStats: (userId: string) => Promise<LearnerProfileStats>
}>

export type IdentityApplicationDependencies = Readonly<{
  clock: Clock
  deletionMarkerStore: Pick<LearnerDeletionMarkerStorePort, "record">
  learnerIdentityDirectory: LearnerIdentityDirectoryPort
  repository: IdentityRepository
  sessionRevocation: IdentitySessionRevocationPort
}>

export type ChangeUserStatusCommand = Readonly<{
  actor: AdminActor
  status: UserStatus
  userId: UserId
}>

export {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
  type AuthenticatedSession,
  type SessionResolver,
} from "#identity/application/identity-session"
export type DeletionMarkerBatchResult = Readonly<{
  alreadyAppliedUsers: number
  markedDeletedUsers: number
  missingUsers: number
  purgedUsers: number
}>

export type DeletionMarkerReapplicationRepository = Readonly<{
  applyBatch: (input: {
    readonly dryRun: boolean
    readonly markers: readonly LearnerDeletionMarker[]
    readonly purgeCutoff: Date
  }) => Promise<
    Result<
      DeletionMarkerBatchResult,
      Failure<"deletion-marker-reapplication-persistence-failed">
    >
  >
}>

export type { DeletedLearnerPurgeCommand } from "#identity/application/deleted-learner-purge"
export { deletedLearnerDisplayName } from "#identity/domain/learner-profile"
