import type { Clock } from "@workspace/kernel/clock"
import type { Result } from "@workspace/kernel/result"
import type { AdminId, UserId } from "@workspace/types/ids"

import type {
  AdminActor,
  AdminIdentity,
  AdminRole,
} from "#identity/domain/admin-role"
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

export type AdminIdentitySnapshot = Readonly<{
  identity: AdminIdentity
  version: number
}>

export type IdentityRepository = Readonly<{
  findAdminIdentity: (adminId: AdminId) => Promise<AdminIdentitySnapshot | null>
  findLearnerProfile: (userId: UserId) => Promise<LearnerProfileRecord | null>
  listLearnerProfiles: () => Promise<readonly LearnerProfileRecord[]>
  provisionLearnerProfile: (input: {
    readonly profile: LearnerProfile
  }) => Promise<LearnerProfileSnapshot>
  saveAdminIdentity: (input: {
    readonly expectedVersion: number
    readonly identity: AdminIdentity
  }) => Promise<Result<AdminIdentitySnapshot, IdentityError>>
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

export type IdentitySessionRevocationError = Readonly<{
  kind: "session-revocation-failed"
}>

export type IdentitySessionRevocationPort = Readonly<{
  revokeAdminSessions: (
    adminId: AdminId
  ) => Promise<Result<void, IdentitySessionRevocationError>>
  revokeLearnerSessions: (
    userId: UserId
  ) => Promise<Result<void, IdentitySessionRevocationError>>
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
  learnerIdentityDirectory: LearnerIdentityDirectoryPort
  repository: IdentityRepository
  sessionRevocation: IdentitySessionRevocationPort
}>

export type ChangeUserStatusCommand = Readonly<{
  actor: AdminActor
  status: UserStatus
  userId: UserId
}>

export type ChangeAdminRoleCommand = Readonly<{
  actor: AdminActor
  adminId: AdminId
  role: AdminRole
}>
