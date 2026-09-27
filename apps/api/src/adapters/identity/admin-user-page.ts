import type {
  SqlDatabaseClient as Database,
  SqlValue as SQLQueryBindings,
} from "@workspace/db/sql-client"

import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { learnerAccountStatusSchema } from "@workspace/contracts/identity/status"
import { createFts5Phrase } from "@workspace/db/fts5"
import type {
  AdminUserPagePort,
  AdminUserPagePosition,
  AdminUserSort,
} from "@workspace/identity/ports"

type AdminUserPageSqlRow = Readonly<{
  email: string
  joinedAt: number
  lastActive: string | null
  lessonsDone: number
  name: string
  status: string
  streak: number
  userId: string
}>

export function createAdminUserPage(sqlite: Database): AdminUserPagePort {
  return {
    async readPage(input) {
      const bindings: SQLQueryBindings[] = []
      const conditions: string[] = []

      if (input.status === "all") {
        conditions.push("learner.status <> 'deleted'")
      } else {
        conditions.push("learner.status = ?")
        bindings.push(input.status)
      }

      if (input.query.length > 0) {
        conditions.push(`learner.user_id IN (
          SELECT document.user_id
          FROM identity_admin_learner_fts
          INNER JOIN identity_admin_learner_search_documents AS document
            ON document.rowid = identity_admin_learner_fts.rowid
          WHERE identity_admin_learner_fts MATCH ?
        )`)
        bindings.push(createFts5Phrase(input.query))
      }

      if (input.after !== undefined) {
        const cursor = createCursorCondition(
          input.after,
          input.sort,
          input.direction
        )
        conditions.push(cursor.condition)
        bindings.push(...cursor.bindings)
      }

      bindings.push(input.limit)
      const primary = readPrimarySql(input.sort)
      const primaryDirection = input.direction === "previous" ? "ASC" : "DESC"
      const tieDirection = input.direction === "previous" ? "DESC" : "ASC"
      const rows = await sqlite
        .query<AdminUserPageSqlRow, SQLQueryBindings[]>(`
          SELECT
            learner.email,
            learner.created_at AS joinedAt,
            learner.last_active AS lastActive,
            learner.completed_lessons AS lessonsDone,
            learner.display_name AS name,
            learner.status,
            learner.streak_days_at_last_activity AS streak,
            learner.user_id AS userId
          FROM admin_learner_read_models AS learner
          WHERE ${conditions.join(" AND ")}
          ORDER BY
            ${primary} ${primaryDirection},
            learner.user_id ${tieDirection}
          LIMIT ?
        `)
        .all(...bindings)

      return rows.map((row) => ({
        email: row.email,
        joinedAt: new Date(row.joinedAt),
        lastActive: row.lastActive,
        lessonsDone: row.lessonsDone,
        name: row.name,
        status: learnerAccountStatusSchema.parse(row.status),
        streak: row.streak,
        userId: userIdSchema.parse(row.userId),
      }))
    },
  }
}

function createCursorCondition(
  position: AdminUserPagePosition,
  sort: AdminUserSort,
  direction: "next" | "previous"
): Readonly<{
  bindings: readonly SQLQueryBindings[]
  condition: string
}> {
  const primaryValue = readPrimary(position, sort)
  if (sort === "lastActive" && primaryValue === null) {
    return {
      bindings: [position.userId],
      condition:
        direction === "previous"
          ? `(learner.last_active IS NOT NULL OR (
              learner.last_active IS NULL AND learner.user_id < ?
            ))`
          : "(learner.last_active IS NULL AND learner.user_id > ?)",
    }
  }

  const primary = readPrimarySql(sort)
  const primaryComparison = direction === "previous" ? ">" : "<"
  const tieComparison = direction === "previous" ? "<" : ">"
  const laterNullRows =
    sort === "lastActive" && direction === "next"
      ? "learner.last_active IS NULL OR "
      : ""
  return {
    bindings: [primaryValue, primaryValue, position.userId],
    condition: `(
      ${laterNullRows}${primary} ${primaryComparison} ?
      OR (
        ${primary} = ?
        AND learner.user_id ${tieComparison} ?
      )
    )`,
  }
}

function readPrimarySql(sort: AdminUserSort): string {
  switch (sort) {
    case "joined":
      return "learner.created_at"
    case "lastActive":
      return "learner.last_active"
    case "lessonsDone":
      return "learner.completed_lessons"
    case "streak":
      return "learner.streak_days_at_last_activity"
  }
}

function readPrimary(
  position: AdminUserPagePosition,
  sort: AdminUserSort
): number | string | null {
  if (sort === "joined" || sort === "lessonsDone" || sort === "streak") {
    if (typeof position.primary !== "number") {
      throw new Error(
        "관리자 사용자 cursor의 숫자 정렬 값이 올바르지 않습니다."
      )
    }
    return position.primary
  }

  if (position.primary !== null && typeof position.primary !== "string") {
    throw new Error("관리자 사용자 cursor의 날짜 정렬 값이 올바르지 않습니다.")
  }
  return position.primary
}
