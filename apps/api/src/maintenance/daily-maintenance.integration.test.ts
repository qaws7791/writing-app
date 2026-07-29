import { describe, expect, it, vi } from "vitest"
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
import { createContentModule } from "@workspace/content/module"
import type { ContentAssetStoragePort } from "@workspace/content/ports"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabase,
} from "@workspace/db/client"
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

const unavailableAiFeedbackProvider: AiFeedbackProvider = {
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
    provider: unavailableAiFeedbackProvider,
  })
}

describe("daily maintenance 실제 SQLite integration", () => {
  it("dry-run과 실제 대상 수가 일치하고 actual 재실행은 idempotent하다", async () => {
    const client = createInMemoryWritingAppDatabase()
    const reportingClient = createInMemoryWritingAppDatabase()
    const storage: ContentAssetStoragePort = {
      deleteObjects: vi.fn(async () => ok(undefined)),
      putObject: vi.fn(async () => ok({ url: "https://assets.example.test" })),
      resolveUrl() {
        throw new Error("Asset URL resolution was not expected.")
      },
    }

    try {
      runApplicationMigrations(client.sqlite)
      seedDailyMaintenanceFixture(client.sqlite)
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
      const started = await auditTrail.begin({
        action: "course.publish",
        actorId: adminIdSchema.parse("admin-1"),
        clientIp: null,
        requestId: "request-expired",
        target: {
          id: "course-1" as CourseId,
          type: "course",
        },
      })
      if (started.isErr()) throw new Error(started.error.kind)
      await auditTrail.complete({
        eventId: started.value.id,
        outcome: "succeeded",
      })
      auditTime = now

      const maintenance = createDailyMaintenance({
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
        }),
        expiredSessions: createExpiredSessionMaintenance(client.db),
        externalLogRetentionEvidence: {
          applicationRequestRetentionDays: 30,
          evidenceId: "retention-check-1",
          securityRetentionDays: 90,
          sink: "external-log-sink",
          validUntil: new Date("2026-07-25T00:00:00.000Z"),
          verifiedAt: new Date("2026-07-24T00:00:00.000Z"),
        },
      })

      const preview = await maintenance.execute({
        batchSize: 100,
        dryRun: true,
      })
      expect(preview.isOk()).toBe(true)
      if (preview.isErr()) throw new Error(preview.error.stage)
      expect(readMatchedCounts(preview.value)).toEqual({
        aiPending: 1,
        audit: 1,
        contentAssets: 1,
        deletedLearners: 1,
        expiredSessions: 2,
      })
      expect(readAffectedCounts(preview.value)).toEqual({
        aiPending: 0,
        audit: 0,
        contentAssets: 0,
        deletedLearners: 0,
        expiredSessions: 0,
      })
      expect(preview.value.externalLogRetention).toMatchObject({
        applicationRequest: {
          cutoff: new Date("2026-06-24T00:00:00.000Z"),
          requiredMaximumDays: 30,
        },
        evidence: { evidenceId: "retention-check-1", status: "verified" },
        security: {
          cutoff: new Date("2026-04-25T00:00:00.000Z"),
          requiredMaximumDays: 90,
        },
      })

      const applied = await maintenance.execute({
        batchSize: 100,
        dryRun: false,
      })
      expect(applied.isOk()).toBe(true)
      if (applied.isErr()) throw new Error(applied.error.stage)
      expect(readMatchedCounts(applied.value)).toEqual(
        readMatchedCounts(preview.value)
      )
      expect(readAffectedCounts(applied.value)).toEqual(
        readMatchedCounts(preview.value)
      )
      expect(storage.deleteObjects).toHaveBeenCalledWith([
        "content-assets/course-cover/orphan.jpg",
      ])

      const rerun = await maintenance.execute({
        batchSize: 100,
        dryRun: false,
      })
      expect(rerun.isOk()).toBe(true)
      if (rerun.isErr()) throw new Error(rerun.error.stage)
      expect(readMatchedCounts(rerun.value)).toEqual({
        aiPending: 0,
        audit: 0,
        contentAssets: 0,
        deletedLearners: 0,
        expiredSessions: 0,
      })
      expect(readFixtureState(client.sqlite)).toEqual({
        activeAuditRows: 0,
        eligibleDeletedLearners: 0,
        expiredAdminSessions: 0,
        expiredAiAttempts: 1,
        expiredLearnerSessions: 0,
        orphanAssets: 0,
        recentDeletedLearners: 1,
      })
    } finally {
      reportingClient.close()
      client.close()
    }
  })
})

function readMatchedCounts(result: DailyMaintenanceResult) {
  return {
    aiPending: result.stages.aiPending.matched,
    audit: result.stages.audit.matched,
    contentAssets: result.stages.contentAssets.matched,
    deletedLearners: result.stages.deletedLearners.matched,
    expiredSessions: result.stages.expiredSessions.matched,
  }
}

function readAffectedCounts(result: Parameters<typeof readMatchedCounts>[0]) {
  return {
    aiPending: result.stages.aiPending.affected,
    audit: result.stages.audit.affected,
    contentAssets: result.stages.contentAssets.affected,
    deletedLearners: result.stages.deletedLearners.affected,
    expiredSessions: result.stages.expiredSessions.affected,
  }
}

function seedDailyMaintenanceFixture(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): void {
  const deletedCutoff = now.getTime() - 5 * dayMs
  const assetCutoff = now.getTime() - 7 * dayMs
  sqlite.exec(`
    INSERT INTO courses (
      id, status, sort_order, published_curriculum_version_id, created_at
    ) VALUES ('course-1', 'active', 1, NULL, 1);
    INSERT INTO course_curriculum_versions (
      id, course_id, revision, edit_version, status, title, description,
      category, visual_key, created_at, updated_at, published_at
    ) VALUES (
      'version-1', 'course-1', 1, 0, 'draft', '코스', '설명',
      '기초', 'basic-sentence-writing', 1, 1, NULL
    );
    INSERT INTO course_unit_versions (
      curriculum_version_id, id, title, status, sort_order
    ) VALUES ('version-1', 'unit-1', '단원', 'active', 1);
    INSERT INTO lesson_versions (
      curriculum_version_id, id, unit_id, title, description, category,
      summary_json, estimated_minutes, status, sort_order
    ) VALUES (
      'version-1', 'lesson-1', 'unit-1', '레슨', NULL, NULL,
      '[]', 5, 'active', 1
    );
    INSERT INTO lesson_step_versions (
      curriculum_version_id, id, lesson_id, type, content_json, status,
      sort_order
    ) VALUES (
      'version-1', 'step-1', 'lesson-1', 'AI_FEEDBACK', '{}', 'active', 1
    );
    INSERT INTO content_assets (
      id, course_id, curriculum_version_id, kind, content_type, byte_size,
      object_key, alt_text, status, created_at, updated_at, orphaned_at
    ) VALUES (
      'asset-orphan', 'course-1', 'version-1', 'course-cover', 'image/jpeg',
      3, 'content-assets/course-cover/orphan.jpg', '표지', 'orphaned',
      ${assetCutoff - dayMs}, ${assetCutoff}, ${assetCutoff}
    );

    INSERT INTO user (
      id, name, email, email_verified, image, created_at, updated_at
    ) VALUES
      ('eligible', '삭제 대상', 'eligible@example.test', 1, NULL, 1, 1),
      ('recent', '보존 대상', 'recent@example.test', 1, NULL, 1, 1),
      ('active', '활성 사용자', 'active@example.test', 1, NULL, 1, 1);
    INSERT INTO learner_profiles (
      user_id, status, display_name, deleted_at, version
    ) VALUES
      ('eligible', 'deleted', '삭제된 사용자', ${deletedCutoff}, 1),
      ('recent', 'deleted', '삭제된 사용자', ${deletedCutoff + 1}, 1),
      ('active', 'active', '활성 사용자', NULL, 0);
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

    INSERT INTO ai_feedback_attempts (
      id, user_id, course_id, curriculum_version_id, lesson_id, step_id,
      attempt_number, idempotency_key, status, answer_text, result_json,
      created_at, updated_at, expires_at, input_token_count, latency_ms,
      model, output_token_count, prompt_policy_version, quota_date,
      failure_code
    ) VALUES (
      'attempt-expired', 'active', 'course-1', 'version-1', 'lesson-1',
      'step-1', 1, 'attempt-key', 'pending', 'answer', NULL, 1, 1,
      ${now.getTime()}, NULL, NULL, 'gpt-test', NULL, 'policy-v1',
      '2026-07-24', NULL
    );
  `)
}

function readFixtureState(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
) {
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

function readScalar(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  query: string
): number {
  return sqlite.query<{ readonly value: number }, []>(query).get()?.value ?? 0
}
