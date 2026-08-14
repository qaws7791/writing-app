import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"

type WritingFixtureEventType =
  | "check_succeeded"
  | "revised_after_check"
  | "writing_created"
  | "writing_deleted"

const defaultPublication = {
  audience: "학교 신문 독자",
  difficulty: "심화",
  domain: "설득·의견문",
  goalChars: 500,
  minChars: 200,
  publicationId: "pub-test-column",
  requiredElementsJson: JSON.stringify([
    "한 문단 안에 주장과 근거를 연결한다",
    "반대 의견을 한 문장 이상 다룬다",
  ]),
  situation: "숙제를 줄이자는 칼럼을 씁니다.",
  taskId: "task-test-column",
  title: "숙제 폐지 찬반 칼럼",
  typeName: "칼럼",
}

function aPublishedWritingTask(
  sqlite: WritingAppSqlite,
  input: Partial<typeof defaultPublication> = {}
): void {
  const task = { ...defaultPublication, ...input }
  sqlite
    .query<
      void,
      [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        number,
        number,
        string,
      ]
    >(
      `
      INSERT OR IGNORE INTO writing_tasks (
        id,
        title,
        domain,
        type_name,
        difficulty,
        situation,
        audience,
        min_chars,
        goal_chars,
        required_elements_json,
        edit_version,
        latest_publication_id,
        created_at,
        updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 1, NULL, 1, 1)
    `
    )
    .run(
      task.taskId,
      task.title,
      task.domain,
      task.typeName,
      task.difficulty,
      task.situation,
      task.audience,
      task.minChars,
      task.goalChars,
      task.requiredElementsJson
    )
  sqlite
    .query<
      void,
      [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        number,
        number,
        string,
      ]
    >(
      `
      INSERT OR IGNORE INTO writing_task_publications (
        id,
        task_id,
        title,
        domain,
        type_name,
        difficulty,
        situation,
        audience,
        min_chars,
        goal_chars,
        required_elements_json,
        published_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 1)
    `
    )
    .run(
      task.publicationId,
      task.taskId,
      task.title,
      task.domain,
      task.typeName,
      task.difficulty,
      task.situation,
      task.audience,
      task.minChars,
      task.goalChars,
      task.requiredElementsJson
    )
  sqlite
    .query<void, [string, string]>(
      `
      UPDATE writing_tasks
      SET latest_publication_id = ?1
      WHERE id = ?2
    `
    )
    .run(task.publicationId, task.taskId)
}

export function aWriting(
  sqlite: WritingAppSqlite,
  input: Readonly<{
    eventTypes?: readonly WritingFixtureEventType[]
    id: string
    publicationId?: string
    userId: string
  }>
): void {
  const publicationId = input.publicationId ?? defaultPublication.publicationId
  aPublishedWritingTask(sqlite, { publicationId })
  sqlite
    .query<void, [string, string, string]>(
      `
      INSERT INTO writings (
        id,
        user_id,
        publication_id,
        body,
        version,
        created_at,
        updated_at
      ) VALUES (?1, ?2, ?3, 'Test writing body', 0, 1, 1)
    `
    )
    .run(input.id, input.userId, publicationId)

  for (const eventType of input.eventTypes ?? ["writing_created"]) {
    sqlite
      .query<void, [string, string, string]>(
        `
        INSERT INTO writing_events (
          user_id,
          writing_id,
          event_type,
          recorded_at
        ) VALUES (?1, ?2, ?3, 1)
      `
      )
      .run(input.userId, input.id, eventType)
  }
}
