import type { Database } from "bun:sqlite"

const schemaTablesByOwner = {
  "ai-feedback": ["ai_feedback_attempts"],
  auth: [
    "account",
    "admin_account",
    "admin_auth_rate_limit",
    "admin_session",
    "admin_user",
    "admin_verification",
    "auth_rate_limit",
    "session",
    "user",
    "verification",
  ],
  content: [
    "course_curriculum_versions",
    "course_unit_versions",
    "courses",
    "lesson_step_versions",
    "lesson_versions",
  ],
  identity: ["admin_identity_profiles", "learner_profiles"],
  learning: [
    "learner_activity_days",
    "learner_course_progress",
    "learner_lesson_answers",
    "learner_lesson_progress",
  ],
  operations: [
    "admin_ai_chat_conversations",
    "admin_ai_chat_messages",
    "admin_settings",
    "operations_ai_change_proposals",
    "operations_ai_quota_counters",
  ],
  "resource-library": [
    "admin_resource_assets",
    "admin_resource_documents",
    "admin_resource_nodes",
    "admin_resource_search",
  ],
} as const

const retiredApplicationTables = new Set([
  "admin_settings",
  "operations_ai_change_proposals",
])

type SchemaOwner = keyof typeof schemaTablesByOwner

export const requiredApplicationTables = Object.freeze(
  Object.values(schemaTablesByOwner)
    .flat()
    .filter((table) => !retiredApplicationTables.has(table))
    .sort()
)
export const requiredDatabaseBackupTables = Object.freeze([
  "api_schema_migrations",
  ...requiredApplicationTables,
])

const tableOwners = new Map<string, SchemaOwner>(
  Object.entries(schemaTablesByOwner).flatMap(([owner, tables]) =>
    tables.map((table) => [table, owner as SchemaOwner] as const)
  )
)

const requiredCrossModuleForeignKeys = [
  { count: 1, table: "learner_profiles", target: "user" },
  { count: 1, table: "admin_identity_profiles", target: "admin_user" },
  { count: 1, table: "learner_activity_days", target: "user" },
  { count: 1, table: "learner_course_progress", target: "user" },
  {
    count: 2,
    table: "learner_course_progress",
    target: "course_curriculum_versions",
  },
  { count: 2, table: "learner_lesson_progress", target: "lesson_versions" },
  {
    count: 3,
    table: "learner_lesson_progress",
    target: "lesson_step_versions",
  },
  {
    count: 3,
    table: "learner_lesson_answers",
    target: "lesson_step_versions",
  },
  { count: 1, table: "ai_feedback_attempts", target: "user" },
  {
    count: 2,
    table: "ai_feedback_attempts",
    target: "course_curriculum_versions",
  },
  {
    count: 3,
    table: "ai_feedback_attempts",
    target: "lesson_step_versions",
  },
  { count: 2, table: "admin_resource_nodes", target: "admin_user" },
  { count: 1, table: "admin_resource_assets", target: "admin_user" },
  {
    count: 1,
    table: "admin_ai_chat_conversations",
    target: "admin_user",
  },
] as const

const baselineTables = [
  "account",
  "admin_account",
  "admin_ai_chat_conversations",
  "admin_ai_chat_messages",
  "admin_resource_assets",
  "admin_resource_documents",
  "admin_resource_nodes",
  "admin_resource_search",
  "admin_session",
  "admin_settings",
  "admin_user",
  "admin_verification",
  "ai_feedback_attempts",
  "course_curriculum_versions",
  "course_unit_versions",
  "courses",
  "learner_activity_days",
  "learner_course_progress",
  "learner_lesson_answers",
  "learner_lesson_progress",
  "learner_profiles",
  "lesson_step_versions",
  "lesson_versions",
  "session",
  "user",
  "verification",
] as const

export function hasBaselineSchema(sqlite: Database): boolean {
  const tables = readTableNames(sqlite)
  if (!baselineTables.every((table) => tables.has(table))) return false

  const courseColumns = readColumnNames(sqlite, "courses")
  const feedbackColumns = readColumnNames(sqlite, "ai_feedback_attempts")
  return (
    courseColumns.has("published_curriculum_version_id") &&
    feedbackColumns.has("curriculum_version_id") &&
    feedbackColumns.has("status")
  )
}

export function isPreP11ModuleSchema(sqlite: Database): boolean {
  try {
    assertApplicationTables(sqlite)
    assertTableNamesAndOwners()
    assertNoCrossModuleForeignKeys(sqlite)
    assertCurrentColumns(sqlite, { allowLegacyAdminRole: true })
    return readColumnNames(sqlite, "admin_user").has("role")
  } catch {
    return false
  }
}

export function isP11ModuleSchema(sqlite: Database): boolean {
  try {
    assertApplicationTables(sqlite)
    assertTableNamesAndOwners()
    assertNoCrossModuleForeignKeys(sqlite)
    assertCurrentColumns(sqlite, { allowLegacyAdminRole: false })
    return true
  } catch {
    return false
  }
}

export function isCurrentApplicationSchema(sqlite: Database): boolean {
  try {
    assertCurrentApplicationSchema(sqlite)
    return true
  } catch {
    return false
  }
}

export function isReferenceIntegrityApplicationSchema(
  sqlite: Database
): boolean {
  try {
    assertReferenceIntegrityApplicationSchema(sqlite)
    return true
  } catch {
    return false
  }
}

export function assertCurrentApplicationSchema(sqlite: Database): void {
  assertReferenceIntegrityApplicationSchema(sqlite)

  const retiredTables = [...retiredApplicationTables].filter((table) =>
    readTableNames(sqlite).has(table)
  )
  if (retiredTables.length > 0) {
    throw new Error(
      `폐기된 application table이 남았습니다: ${retiredTables.join(", ")}`
    )
  }
}

export function assertReferenceIntegrityApplicationSchema(
  sqlite: Database
): void {
  assertApplicationTables(sqlite)
  assertTableNamesAndOwners()
  assertRequiredCrossModuleForeignKeys(sqlite)
  assertCurrentColumns(sqlite, { allowLegacyAdminRole: false })

  const legacyTables = [...readTableNames(sqlite)].filter(
    (table) =>
      table.includes("_legacy_") ||
      table === "admin_mfa_recovery_code" ||
      table === "admin_two_factor"
  )
  if (legacyTables.length > 0) {
    throw new Error(
      `legacy migration table이 남았습니다: ${legacyTables.join(", ")}`
    )
  }

  const integrity = sqlite
    .query<{ readonly integrityCheck: string }, []>(
      "SELECT integrity_check AS integrityCheck FROM pragma_integrity_check"
    )
    .get()?.integrityCheck
  if (integrity !== "ok") {
    throw new Error(`SQLite integrity_check 실패: ${integrity ?? "missing"}`)
  }
}

function assertNoCrossModuleForeignKeys(sqlite: Database): void {
  for (const [tableName, owner] of tableOwners) {
    for (const foreignKey of sqlite
      .query<{ readonly table: string }, []>(
        `PRAGMA foreign_key_list(${tableName})`
      )
      .all()) {
      const referencedOwner = tableOwners.get(foreignKey.table)
      if (referencedOwner !== owner) {
        throw new Error(
          `cross-module FK가 남았습니다: ${tableName}(${owner}) -> ${foreignKey.table}(${referencedOwner ?? "unknown"})`
        )
      }
    }
  }
}

function assertRequiredCrossModuleForeignKeys(sqlite: Database): void {
  for (const expected of requiredCrossModuleForeignKeys) {
    const actualCount = sqlite
      .query<{ readonly table: string }, []>(
        `PRAGMA foreign_key_list(${expected.table})`
      )
      .all()
      .filter(({ table }) => table === expected.target).length
    if (actualCount !== expected.count) {
      throw new Error(
        `필수 cross-module FK가 다릅니다: ${expected.table} -> ${expected.target} (${actualCount}/${expected.count})`
      )
    }
  }
}

function assertApplicationTables(sqlite: Database): void {
  const tables = readTableNames(sqlite)
  const missing = requiredApplicationTables.filter(
    (table) => !tables.has(table)
  )
  if (missing.length > 0) {
    throw new Error(`필수 application table이 없습니다: ${missing.join(", ")}`)
  }
}

function assertTableNamesAndOwners(): void {
  for (const [owner, tables] of Object.entries(schemaTablesByOwner)) {
    for (const table of tables) {
      if (!/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/u.test(table)) {
        throw new Error(`snake_case가 아닌 table 이름입니다: ${table}`)
      }
      if (!hasOwnerPrefix(owner as SchemaOwner, table)) {
        throw new Error(
          `context prefix와 맞지 않는 table입니다: ${owner}:${table}`
        )
      }
    }
  }
}

function hasOwnerPrefix(owner: SchemaOwner, table: string): boolean {
  switch (owner) {
    case "auth":
      return [
        "account",
        "admin_account",
        "admin_auth_rate_limit",
        "admin_session",
        "admin_user",
        "admin_verification",
        "auth_rate_limit",
        "session",
        "user",
        "verification",
      ].includes(table)
    case "identity":
      return table === "learner_profiles" || table.startsWith("admin_identity_")
    case "content":
      return (
        table === "courses" ||
        table.startsWith("course_") ||
        table.startsWith("lesson_")
      )
    case "learning":
      return table.startsWith("learner_")
    case "ai-feedback":
      return table.startsWith("ai_feedback_")
    case "resource-library":
      return table.startsWith("admin_resource_")
    case "operations":
      return (
        table === "admin_settings" ||
        table.startsWith("admin_ai_") ||
        table.startsWith("operations_")
      )
  }
}

function assertCurrentColumns(
  sqlite: Database,
  options: Readonly<{ allowLegacyAdminRole: boolean }>
): void {
  assertColumns(sqlite, "admin_identity_profiles", [
    "admin_id",
    "role",
    "version",
  ])
  assertColumns(sqlite, "learner_profiles", [
    "deleted_at",
    "display_name",
    "status",
    "user_id",
    "version",
  ])
  assertColumns(sqlite, "admin_resource_assets", [
    "alt_text",
    "delete_requested_at",
    "delete_requested_by",
    "delete_root_id",
    "status",
  ])

  if (
    !options.allowLegacyAdminRole &&
    readColumnNames(sqlite, "admin_user").has("role")
  ) {
    throw new Error("auth credential table에 legacy role column이 남았습니다.")
  }
  if (readColumnNames(sqlite, "admin_user").has("two_factor_enabled")) {
    throw new Error("auth credential table에 legacy MFA column이 남았습니다.")
  }
}

function assertColumns(
  sqlite: Database,
  tableName: string,
  requiredColumns: readonly string[]
): void {
  const columns = readColumnNames(sqlite, tableName)
  const missing = requiredColumns.filter((column) => !columns.has(column))
  if (missing.length > 0) {
    throw new Error(`${tableName} column이 없습니다: ${missing.join(", ")}`)
  }
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
