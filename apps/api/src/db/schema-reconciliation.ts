import type { Database } from "bun:sqlite"

type SchemaReferenceKind =
  | "ai-feedback-learning-scope"
  | "ai-feedback-step"
  | "ai-feedback-user"
  | "identity-admin"
  | "identity-learner"
  | "learning-course"
  | "learning-current-step"
  | "learning-learner"
  | "learning-lesson"
  | "learning-step"
  | "learning-version"
  | "operations-admin"
  | "resource-admin"

export type DanglingSchemaReference = Readonly<{
  kind: SchemaReferenceKind
  referenceId: string
  targetId: string
}>

export function findDanglingSchemaReferences(
  sqlite: Database
): readonly DanglingSchemaReference[] {
  const tableNames = readTableNames(sqlite)
  const learnerIds = readIdSet(sqlite, tableNames, "user")
  const adminIds = readIdSet(sqlite, tableNames, "admin_user")
  const courseIds = readIdSet(sqlite, tableNames, "courses")
  const curriculumVersions = readCurriculumVersions(sqlite, tableNames)
  const lessons = readLessons(sqlite, tableNames)
  const steps = readSteps(sqlite, tableNames)
  const learningScopes = readLearningScopes(sqlite, tableNames)
  const dangling: DanglingSchemaReference[] = []

  if (tableNames.has("learner_profiles")) {
    for (const row of sqlite
      .query<{ readonly userId: string }, []>(
        "SELECT user_id AS userId FROM learner_profiles"
      )
      .all()) {
      addMissing(dangling, learnerIds, {
        kind: "identity-learner",
        referenceId: row.userId,
        targetId: row.userId,
      })
    }
  }

  if (tableNames.has("admin_identity_profiles")) {
    for (const row of sqlite
      .query<{ readonly adminId: string }, []>(
        "SELECT admin_id AS adminId FROM admin_identity_profiles"
      )
      .all()) {
      addMissing(dangling, adminIds, {
        kind: "identity-admin",
        referenceId: row.adminId,
        targetId: row.adminId,
      })
    }
  }

  if (tableNames.has("learner_activity_days")) {
    for (const row of sqlite
      .query<{ readonly activityDate: string; readonly userId: string }, []>(
        "SELECT activity_date AS activityDate, user_id AS userId FROM learner_activity_days"
      )
      .all()) {
      addMissing(dangling, learnerIds, {
        kind: "learning-learner",
        referenceId: `${row.userId}:${row.activityDate}`,
        targetId: row.userId,
      })
    }
  }

  if (tableNames.has("learner_course_progress")) {
    for (const row of sqlite
      .query<
        {
          readonly courseId: string
          readonly curriculumVersionId: string
          readonly userId: string
        },
        []
      >(`
        SELECT user_id AS userId, course_id AS courseId,
          curriculum_version_id AS curriculumVersionId
        FROM learner_course_progress
      `)
      .all()) {
      const referenceId = learningScopeKey(row)
      addMissing(dangling, learnerIds, {
        kind: "learning-learner",
        referenceId,
        targetId: row.userId,
      })
      addMissing(dangling, courseIds, {
        kind: "learning-course",
        referenceId,
        targetId: row.courseId,
      })
      addMissing(dangling, curriculumVersions, {
        kind: "learning-version",
        referenceId,
        targetId: curriculumVersionKey(row.courseId, row.curriculumVersionId),
      })
    }
  }

  for (const table of [
    "learner_lesson_progress",
    "learner_lesson_answers",
  ] as const) {
    if (!tableNames.has(table)) continue
    const stepColumn =
      table === "learner_lesson_progress" ? "current_step_id" : "step_id"
    const rows = sqlite
      .query<
        {
          readonly courseId: string
          readonly curriculumVersionId: string
          readonly lessonId: string
          readonly stepId: string
          readonly userId: string
        },
        []
      >(`
        SELECT user_id AS userId, course_id AS courseId,
          curriculum_version_id AS curriculumVersionId,
          lesson_id AS lessonId, ${stepColumn} AS stepId
        FROM ${table}
      `)
      .all()

    for (const row of rows) {
      const referenceId = `${table}:${row.userId}:${row.curriculumVersionId}:${row.stepId}`
      addMissing(dangling, learnerIds, {
        kind: "learning-learner",
        referenceId,
        targetId: row.userId,
      })
      addMissing(dangling, learningScopes, {
        kind: "learning-course",
        referenceId,
        targetId: learningScopeKey(row),
      })
      addMissing(dangling, lessons, {
        kind: "learning-lesson",
        referenceId,
        targetId: lessonKey(row.curriculumVersionId, row.lessonId),
      })
      addMissing(dangling, steps, {
        kind:
          table === "learner_lesson_progress"
            ? "learning-current-step"
            : "learning-step",
        referenceId,
        targetId: stepKey(row.curriculumVersionId, row.lessonId, row.stepId),
      })
    }
  }

  if (tableNames.has("ai_feedback_attempts")) {
    for (const row of sqlite
      .query<
        {
          readonly courseId: string
          readonly curriculumVersionId: string
          readonly id: string
          readonly lessonId: string
          readonly stepId: string
          readonly userId: string
        },
        []
      >(`
        SELECT id, user_id AS userId, course_id AS courseId,
          curriculum_version_id AS curriculumVersionId,
          lesson_id AS lessonId, step_id AS stepId
        FROM ai_feedback_attempts
      `)
      .all()) {
      addMissing(dangling, learnerIds, {
        kind: "ai-feedback-user",
        referenceId: row.id,
        targetId: row.userId,
      })
      addMissing(dangling, learningScopes, {
        kind: "ai-feedback-learning-scope",
        referenceId: row.id,
        targetId: learningScopeKey(row),
      })
      addMissing(dangling, steps, {
        kind: "ai-feedback-step",
        referenceId: row.id,
        targetId: stepKey(row.curriculumVersionId, row.lessonId, row.stepId),
      })
    }
  }

  collectResourceActorReferences(sqlite, tableNames, adminIds, dangling)
  collectOperationsActorReferences(sqlite, tableNames, adminIds, dangling)

  return [...dangling].sort(
    (left, right) =>
      left.kind.localeCompare(right.kind) ||
      left.referenceId.localeCompare(right.referenceId) ||
      left.targetId.localeCompare(right.targetId)
  )
}

export function assertNoDanglingSchemaReferences(sqlite: Database): void {
  const dangling = findDanglingSchemaReferences(sqlite)
  if (dangling.length === 0) return

  const [first] = dangling
  if (first === undefined) return
  throw new Error(
    `schema migration prerequisite failed: ${first.kind} ${first.referenceId} -> ${first.targetId}`
  )
}

function collectResourceActorReferences(
  sqlite: Database,
  tableNames: ReadonlySet<string>,
  adminIds: ReadonlySet<string>,
  dangling: DanglingSchemaReference[]
): void {
  if (!tableNames.has("admin_resource_nodes")) return

  for (const row of sqlite
    .query<
      {
        readonly createdBy: string
        readonly id: string
        readonly updatedBy: string
      },
      []
    >(`
      SELECT id, created_by AS createdBy, updated_by AS updatedBy
      FROM admin_resource_nodes
    `)
    .all()) {
    for (const actorId of [row.createdBy, row.updatedBy]) {
      addMissing(dangling, adminIds, {
        kind: "resource-admin",
        referenceId: row.id,
        targetId: actorId,
      })
    }
  }

  if (
    !tableNames.has("admin_resource_assets") ||
    !readColumnNames(sqlite, "admin_resource_assets").has("delete_requested_by")
  ) {
    return
  }

  for (const row of sqlite
    .query<{ readonly actorId: string | null; readonly id: string }, []>(`
      SELECT id, delete_requested_by AS actorId
      FROM admin_resource_assets
      WHERE delete_requested_by IS NOT NULL
    `)
    .all()) {
    if (row.actorId === null) continue
    addMissing(dangling, adminIds, {
      kind: "resource-admin",
      referenceId: row.id,
      targetId: row.actorId,
    })
  }
}

function collectOperationsActorReferences(
  sqlite: Database,
  tableNames: ReadonlySet<string>,
  adminIds: ReadonlySet<string>,
  dangling: DanglingSchemaReference[]
): void {
  if (tableNames.has("admin_ai_chat_conversations")) {
    for (const row of sqlite
      .query<{ readonly adminId: string; readonly id: string }, []>(`
        SELECT id, admin_id AS adminId
        FROM admin_ai_chat_conversations
      `)
      .all()) {
      addMissing(dangling, adminIds, {
        kind: "operations-admin",
        referenceId: row.id,
        targetId: row.adminId,
      })
    }
  }

  if (!tableNames.has("operations_ai_change_proposals")) return
  for (const row of sqlite
    .query<
      {
        readonly createdBy: string
        readonly id: string
        readonly reviewedBy: string | null
      },
      []
    >(`
      SELECT id, created_by_admin_id AS createdBy,
        reviewed_by_admin_id AS reviewedBy
      FROM operations_ai_change_proposals
    `)
    .all()) {
    for (const actorId of [row.createdBy, row.reviewedBy]) {
      if (actorId === null) continue
      addMissing(dangling, adminIds, {
        kind: "operations-admin",
        referenceId: row.id,
        targetId: actorId,
      })
    }
  }
}

function readIdSet(
  sqlite: Database,
  tableNames: ReadonlySet<string>,
  tableName: "admin_user" | "courses" | "user"
): ReadonlySet<string> {
  if (!tableNames.has(tableName)) return new Set()
  return new Set(
    sqlite
      .query<{ readonly id: string }, []>(`SELECT id FROM ${tableName}`)
      .all()
      .map((row) => row.id)
  )
}

function readCurriculumVersions(
  sqlite: Database,
  tableNames: ReadonlySet<string>
): ReadonlySet<string> {
  if (!tableNames.has("course_curriculum_versions")) return new Set()
  return new Set(
    sqlite
      .query<{ readonly courseId: string; readonly id: string }, []>(`
        SELECT course_id AS courseId, id
        FROM course_curriculum_versions
      `)
      .all()
      .map((row) => curriculumVersionKey(row.courseId, row.id))
  )
}

function readLessons(
  sqlite: Database,
  tableNames: ReadonlySet<string>
): ReadonlySet<string> {
  if (!tableNames.has("lesson_versions")) return new Set()
  return new Set(
    sqlite
      .query<
        { readonly curriculumVersionId: string; readonly id: string },
        []
      >(`
        SELECT curriculum_version_id AS curriculumVersionId, id
        FROM lesson_versions
      `)
      .all()
      .map((row) => lessonKey(row.curriculumVersionId, row.id))
  )
}

function readSteps(
  sqlite: Database,
  tableNames: ReadonlySet<string>
): ReadonlySet<string> {
  if (!tableNames.has("lesson_step_versions")) return new Set()
  return new Set(
    sqlite
      .query<
        {
          readonly curriculumVersionId: string
          readonly id: string
          readonly lessonId: string
        },
        []
      >(`
        SELECT curriculum_version_id AS curriculumVersionId,
          lesson_id AS lessonId, id
        FROM lesson_step_versions
      `)
      .all()
      .map((row) => stepKey(row.curriculumVersionId, row.lessonId, row.id))
  )
}

function readLearningScopes(
  sqlite: Database,
  tableNames: ReadonlySet<string>
): ReadonlySet<string> {
  if (!tableNames.has("learner_course_progress")) return new Set()
  return new Set(
    sqlite
      .query<
        {
          readonly courseId: string
          readonly curriculumVersionId: string
          readonly userId: string
        },
        []
      >(`
        SELECT user_id AS userId, course_id AS courseId,
          curriculum_version_id AS curriculumVersionId
        FROM learner_course_progress
      `)
      .all()
      .map(learningScopeKey)
  )
}

function readTableNames(sqlite: Database): ReadonlySet<string> {
  return new Set(
    sqlite
      .query<{ readonly name: string }, []>(
        "SELECT name FROM sqlite_master WHERE type = 'table'"
      )
      .all()
      .map((row) => row.name)
  )
}

function readColumnNames(
  sqlite: Database,
  tableName: string
): ReadonlySet<string> {
  return new Set(
    sqlite
      .query<{ readonly name: string }, []>(`PRAGMA table_info(${tableName})`)
      .all()
      .map((row) => row.name)
  )
}

function addMissing(
  dangling: DanglingSchemaReference[],
  targets: ReadonlySet<string>,
  reference: DanglingSchemaReference
): void {
  if (!targets.has(reference.targetId)) dangling.push(reference)
}

function curriculumVersionKey(courseId: string, versionId: string): string {
  return `${courseId}\u0000${versionId}`
}

function lessonKey(curriculumVersionId: string, lessonId: string): string {
  return `${curriculumVersionId}\u0000${lessonId}`
}

function stepKey(
  curriculumVersionId: string,
  lessonId: string,
  stepId: string
): string {
  return `${curriculumVersionId}\u0000${lessonId}\u0000${stepId}`
}

function learningScopeKey(input: {
  readonly courseId: string
  readonly curriculumVersionId: string
  readonly userId: string
}): string {
  return `${input.userId}\u0000${input.courseId}\u0000${input.curriculumVersionId}`
}
