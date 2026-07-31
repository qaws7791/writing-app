import { afterEach, describe, expect, it, vi } from "vitest"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import {
  createAiFeedbackModule,
  type AiFeedbackModule,
} from "@workspace/ai-feedback/module"
import {
  defaultAiFeedbackAttemptPolicy,
  defaultAiFeedbackDailyQuotaPolicy,
  type AiFeedbackProvider,
} from "@workspace/ai-feedback/ports"
import { defaultDeletedLearnerRetentionDays } from "@workspace/identity/ports"
import { aLearner } from "@workspace/identity/test-fixtures"
import { createContentModule } from "@workspace/content/module"
import {
  aPublishedCourse,
  type PublishedCourseFixture,
} from "@workspace/content/test-fixtures"
import type { ContentAssetStoragePort } from "@workspace/content/ports"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabase,
} from "@workspace/db/client"
import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"
import {
  createDeletedLearnerPurgeCommand,
  createDeletedLearnerPurgeRepository,
} from "@workspace/identity/module"
import { ok } from "@workspace/kernel/result"
import { createOperationsModule } from "@workspace/operations/module"
import type { ContentAssetId, CourseId } from "@workspace/types/ids"

import { runApplicationMigrations } from "@/db/migrate"
import {
  createDailyMaintenance,
  type DailyMaintenanceResult,
} from "@/maintenance/daily-maintenance"
import { createExpiredSessionMaintenance } from "@/maintenance/expired-session-maintenance"
import { learnerDataPurgePorts } from "@/privacy/learner-data-purge"

const now = new Date("2026-07-24T00:00:00.000Z")
const dayMs = 86_400_000
const retentionDays = defaultDeletedLearnerRetentionDays
const deletedLearnerCutoff = now.getTime() - retentionDays * dayMs
const orphanedAssetCutoff = now.getTime() - 7 * dayMs
const orphanedAssetObjectKey = "content-assets/course-cover/orphan.jpg"

const expectedMatchedCounts = {
  aiPending: 1,
  audit: 1,
  contentAssets: 1,
  deletedLearners: 1,
  expiredSessions: 2,
} as const

const emptyCounts = {
  aiPending: 0,
  audit: 0,
  contentAssets: 0,
  deletedLearners: 0,
  expiredSessions: 0,
} as const

const succeedingAiFeedbackProvider: AiFeedbackProvider = {
  model: "test-unconfigured",
  provider: "test",
  async createFeedback() {
    return ok({
      feedback: {
        improvements: [],
        nextAction: "",
        strengths: [],
        summary: "",
      },
    })
  },
}

type DailyMaintenanceFixture = Readonly<{
  close: () => void
  maintenance: ReturnType<typeof createDailyMaintenance>
  sqlite: WritingAppSqlite
  storage: ContentAssetStoragePort
}>

const openedFixtures: DailyMaintenanceFixture[] = []

afterEach(() => {
  for (const fixture of openedFixtures.splice(0)) fixture.close()
})

describe("daily maintenance 실제 SQLite integration", () => {
  it("dry-run은 actual과 같은 대상 수를 집계하면서 아무 것도 변경하지 않는다", async () => {
    const { maintenance, sqlite, storage } = await openDailyMaintenance()
    const stateBeforePreview = readFixtureState(sqlite)

    const preview = (
      await maintenance.execute({ batchSize: 100, dryRun: true })
    )._unsafeUnwrap()

    expect(readFixtureState(sqlite)).toEqual(stateBeforePreview)
    expect(storage.deleteObjects).not.toHaveBeenCalled()

    const applied = (
      await maintenance.execute({ batchSize: 100, dryRun: false })
    )._unsafeUnwrap()

    expect(readMatchedCounts(preview)).toEqual(expectedMatchedCounts)
    expect(readAffectedCounts(preview)).toEqual(emptyCounts)
    expect(readMatchedCounts(applied)).toEqual(readMatchedCounts(preview))
  })

  it("dry-run은 외부 log class retention cutoff와 증거 상태를 함께 보고한다", async () => {
    const { maintenance } = await openDailyMaintenance()

    const preview = (
      await maintenance.execute({ batchSize: 100, dryRun: true })
    )._unsafeUnwrap()

    expect(preview.externalLogRetention).toMatchObject({
      applicationRequest: {
        cutoff: new Date(now.getTime() - 30 * dayMs),
        requiredMaximumDays: 30,
      },
      evidence: { evidenceId: "retention-check-1", status: "verified" },
      security: {
        cutoff: new Date(now.getTime() - 90 * dayMs),
        requiredMaximumDays: 90,
      },
    })
  })

  it("actual 실행은 만료·고아 row와 storage 객체를 실제로 정리한다", async () => {
    const { maintenance, sqlite, storage } = await openDailyMaintenance()

    const applied = (
      await maintenance.execute({ batchSize: 100, dryRun: false })
    )._unsafeUnwrap()

    expect(readAffectedCounts(applied)).toEqual(expectedMatchedCounts)
    expect(storage.deleteObjects).toHaveBeenCalledWith([orphanedAssetObjectKey])
    expect(readFixtureState(sqlite)).toEqual({
      activeAuditRows: 0,
      eligibleDeletedLearners: 0,
      expiredAdminSessions: 0,
      expiredAiAttempts: 1,
      expiredLearnerSessions: 0,
      orphanAssets: 0,
      recentDeletedLearners: 1,
    })
  })

  it("actual 재실행은 남은 대상이 없어 0건으로 수렴한다", async () => {
    const { maintenance } = await openDailyMaintenance()

    await maintenance.execute({ batchSize: 100, dryRun: false })
    const rerun = (
      await maintenance.execute({ batchSize: 100, dryRun: false })
    )._unsafeUnwrap()

    expect(readMatchedCounts(rerun)).toEqual(emptyCounts)
    expect(readAffectedCounts(rerun)).toEqual(emptyCounts)
  })
})

async function openDailyMaintenance(): Promise<DailyMaintenanceFixture> {
  const client = createInMemoryWritingAppDatabase()
  const reportingClient = createInMemoryWritingAppDatabase()
  const close = () => {
    reportingClient.close()
    client.close()
  }

  try {
    runApplicationMigrations(client.sqlite)
    seedDailyMaintenanceFixture(client.sqlite)
    const storage = createContentAssetStorageFake()
    let auditTime = new Date(now.getTime() - 365 * dayMs)
    let auditSequence = 0
    const { auditTrail } = createOperationsModule({
      audit: {
        failureObserver: () => undefined,
        idGenerator: { next: () => `audit-${++auditSequence}` },
      },
      clock: { now: () => auditTime },
      database: client.db,
      reportingDatabase: reportingClient.sqlite,
      reportingFailureObserver: () => undefined,
    })
    await seedExpiredAuditEvent(auditTrail)
    auditTime = now

    const fixture: DailyMaintenanceFixture = {
      close,
      maintenance: createDailyMaintenance({
        aiFeedback: createTestAiFeedbackModule(client.db, () => now)
          .maintenance,
        auditTrail,
        clock: { now: () => now },
        contentAssets: createContentModule({
          assetIdGenerator: { next: () => "unused" as ContentAssetId },
          assetImageProcessor: {
            process: () => {
              throw new Error("asset 이미지 처리는 호출되지 않는다.")
            },
          },
          assetStorage: storage,
          clock: { now: () => now },
          courseIdGenerator: { next: () => "unused" as CourseId },
          database: client.db,
        }).maintenance,
        deletedLearners: createDeletedLearnerPurgeCommand({
          clock: { now: () => now },
          repository: createDeletedLearnerPurgeRepository({
            database: client.db,
            learnerDataPurges: learnerDataPurgePorts,
          }),
          retentionDays,
        }),
        expiredSessions: createExpiredSessionMaintenance(client.db),
        externalLogRetentionEvidence: {
          applicationRequestRetentionDays: 30,
          evidenceId: "retention-check-1",
          securityRetentionDays: 90,
          sink: "external-log-sink",
          validUntil: new Date(now.getTime() + dayMs),
          verifiedAt: now,
        },
      }),
      sqlite: client.sqlite,
      storage,
    }
    openedFixtures.push(fixture)
    return fixture
  } catch (cause) {
    close()
    throw cause
  }
}

function createContentAssetStorageFake(): ContentAssetStoragePort {
  return {
    deleteObjects: vi.fn(async () => ok(undefined)),
    putObject: vi.fn(async () => ok({ url: "https://assets.example.test" })),
    resolveUrl() {
      throw new Error("Asset URL resolution was not expected.")
    },
  }
}

function createTestAiFeedbackModule(
  database: WritingAppDatabase,
  clock: () => Date
): AiFeedbackModule {
  return createAiFeedbackModule({
    attemptIdGenerator: { next: () => "unused" },
    attemptPolicy: defaultAiFeedbackAttemptPolicy,
    clock: { now: clock },
    dailyQuotaPolicy: defaultAiFeedbackDailyQuotaPolicy,
    database,
    openAi: { apiKey: undefined, model: "test-model" },
    provider: succeedingAiFeedbackProvider,
  })
}

async function seedExpiredAuditEvent(
  auditTrail: ReturnType<typeof createOperationsModule>["auditTrail"]
): Promise<void> {
  const started = (
    await auditTrail.begin({
      action: "course.publish",
      actorId: adminIdSchema.parse("admin-1"),
      clientIp: null,
      requestId: "request-expired",
      target: { id: "course-1" as CourseId, type: "course" },
    })
  )._unsafeUnwrap()
  await auditTrail.complete({ eventId: started.id, outcome: "succeeded" })
}

function readMatchedCounts(result: DailyMaintenanceResult) {
  return {
    aiPending: result.stages.aiPending.matched,
    audit: result.stages.audit.matched,
    contentAssets: result.stages.contentAssets.matched,
    deletedLearners: result.stages.deletedLearners.matched,
    expiredSessions: result.stages.expiredSessions.matched,
  }
}

function readAffectedCounts(result: DailyMaintenanceResult) {
  return {
    aiPending: result.stages.aiPending.affected,
    audit: result.stages.audit.affected,
    contentAssets: result.stages.contentAssets.affected,
    deletedLearners: result.stages.deletedLearners.affected,
    expiredSessions: result.stages.expiredSessions.affected,
  }
}

function seedDailyMaintenanceFixture(sqlite: WritingAppSqlite): void {
  const course = aPublishedCourse(sqlite)
  seedOrphanedContentAsset(sqlite)
  seedLearners(sqlite)
  seedExpiredSessions(sqlite)
  seedPendingAiFeedbackAttempt(sqlite, course)
}

/**
 * 발행 curriculum version의 content asset은 immutability trigger가 insert·delete를
 * 모두 막으므로, 고아 asset 정리 대상은 별도 draft version에만 만들 수 있다.
 */
function seedOrphanedContentAsset(sqlite: WritingAppSqlite): void {
  sqlite.exec(`
    INSERT INTO courses (
      id, status, sort_order, published_curriculum_version_id, created_at
    ) VALUES ('asset-course', 'active', 2, NULL, 1);
    INSERT INTO course_curriculum_versions (
      id, course_id, revision, edit_version, status, title, description,
      category, visual_key, created_at, updated_at, published_at
    ) VALUES (
      'asset-version', 'asset-course', 1, 0, 'draft', '자료 코스', '설명',
      '기초', 'basic-sentence-writing', 1, 1, NULL
    );
    INSERT INTO content_assets (
      id, course_id, curriculum_version_id, kind, content_type, byte_size,
      object_key, alt_text, status, created_at, updated_at, orphaned_at
    ) VALUES (
      'asset-orphan', 'asset-course', 'asset-version', 'course-cover',
      'image/jpeg', 3, '${orphanedAssetObjectKey}', '표지', 'orphaned',
      ${orphanedAssetCutoff - dayMs}, ${orphanedAssetCutoff},
      ${orphanedAssetCutoff}
    );
  `)
}

function seedLearners(sqlite: WritingAppSqlite): void {
  aLearner(sqlite, {
    deletedAt: deletedLearnerCutoff,
    displayName: "삭제 대상",
    email: "eligible@example.test",
    id: "eligible",
    name: "삭제 대상",
    status: "deleted",
    version: 1,
  })
  aLearner(sqlite, {
    deletedAt: deletedLearnerCutoff + 1,
    displayName: "삭제된 사용자",
    email: "recent@example.test",
    id: "recent",
    name: "보존 대상",
    status: "deleted",
    version: 1,
  })
  aLearner(sqlite, {
    displayName: "활성 사용자",
    email: "active@example.test",
    id: "active",
    name: "활성 사용자",
    status: "active",
  })
}

function seedExpiredSessions(sqlite: WritingAppSqlite): void {
  sqlite.exec(`
    INSERT INTO session (
      id, user_id, token, expires_at, created_at, updated_at
    ) VALUES
      ('session-expired', 'active', 'token-expired', ${now.getTime()}, 1, 1),
      ('session-future', 'active', 'token-future', ${now.getTime() + 1}, 1, 1);

    INSERT INTO admin_user (
      id, name, email, email_verified, image, created_at, updated_at
    ) VALUES ('admin-1', '관리자', 'admin@example.test', 1, NULL, 1, 1);
    INSERT INTO admin_session (
      id, user_id, token, expires_at, created_at, updated_at
    ) VALUES (
      'admin-session-expired', 'admin-1', 'admin-token-expired',
      ${now.getTime()}, 1, 1
    );
  `)
}

/**
 * `aAiFeedbackAttempt` fixture는 failed attempt만 만들므로, 만료 대상인 pending
 * attempt는 이 테스트에서 직접 시드한다.
 */
function seedPendingAiFeedbackAttempt(
  sqlite: WritingAppSqlite,
  course: PublishedCourseFixture
): void {
  sqlite.exec(`
    INSERT INTO ai_feedback_attempts (
      id, user_id, course_id, curriculum_version_id, lesson_id, step_id,
      attempt_number, idempotency_key, status, answer_text, result_json,
      created_at, updated_at, expires_at, input_token_count, latency_ms,
      model, output_token_count, prompt_policy_version, quota_date,
      failure_code
    ) VALUES (
      'attempt-expired', 'active', '${course.courseId}',
      '${course.curriculumVersionId}', '${course.lessonId}',
      '${course.stepId}', 1, 'attempt-key', 'pending', 'answer', NULL, 1, 1,
      ${now.getTime()}, NULL, NULL, 'gpt-test', NULL, 'policy-v1',
      '2026-07-24', NULL
    );
  `)
}

function readFixtureState(sqlite: WritingAppSqlite) {
  return {
    activeAuditRows: readScalar(
      sqlite,
      "SELECT COUNT(*) AS value FROM audit_events"
    ),
    eligibleDeletedLearners: readScalar(
      sqlite,
      "SELECT COUNT(*) AS value FROM learner_profiles WHERE user_id = 'eligible'"
    ),
    expiredAdminSessions: readScalar(
      sqlite,
      "SELECT COUNT(*) AS value FROM admin_session WHERE id = 'admin-session-expired'"
    ),
    expiredAiAttempts: readScalar(
      sqlite,
      "SELECT COUNT(*) AS value FROM ai_feedback_attempts WHERE status = 'expired'"
    ),
    expiredLearnerSessions: readScalar(
      sqlite,
      "SELECT COUNT(*) AS value FROM session WHERE id = 'session-expired'"
    ),
    orphanAssets: readScalar(
      sqlite,
      "SELECT COUNT(*) AS value FROM content_assets WHERE id = 'asset-orphan'"
    ),
    recentDeletedLearners: readScalar(
      sqlite,
      "SELECT COUNT(*) AS value FROM learner_profiles WHERE user_id = 'recent'"
    ),
  }
}

function readScalar(sqlite: WritingAppSqlite, query: string): number {
  return sqlite.query<{ readonly value: number }, []>(query).get()?.value ?? 0
}
