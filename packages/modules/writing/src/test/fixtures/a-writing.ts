import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"

type WritingFixtureEventType =
  | "revised_after_self_check"
  | "self_check_completed"
  | "self_check_started"
  | "writing_created"
  | "writing_deleted"

export function aWriting(
  sqlite: WritingAppSqlite,
  input: Readonly<{
    eventTypes?: readonly WritingFixtureEventType[]
    id: string
    userId: string
  }>
): void {
  sqlite
    .query<void, [string, string]>(`
      INSERT INTO writings (
        id,
        user_id,
        mode,
        title,
        body,
        status,
        version,
        created_at,
        updated_at
      ) VALUES (?1, ?2, 'free', 'Test writing', 'Test writing body', 'drafting', 0, 1, 1)
    `)
    .run(input.id, input.userId)

  for (const eventType of input.eventTypes ?? ["writing_created"]) {
    sqlite
      .query<void, [string, string, string]>(`
        INSERT INTO writing_events (
          user_id,
          writing_id,
          event_type,
          recorded_at
        ) VALUES (?1, ?2, ?3, 1)
      `)
      .run(input.userId, input.id, eventType)
  }
}
