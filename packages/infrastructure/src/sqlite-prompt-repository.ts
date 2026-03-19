import type { Database } from "bun:sqlite"
import {
  toPromptId,
  type PromptDetail,
  type PromptId,
  type PromptListFilters,
  type PromptRepository,
  type PromptSaveResult,
  type PromptSummary,
  type PromptTopic,
  type UserId,
} from "@workspace/domain"

type PromptRow = {
  description: string
  id: number
  level: 1 | 2 | 3
  outline_json: string
  saved: number
  suggested_length_label: "깊이" | "보통" | "짧음"
  tags_json: string
  text: string
  tips_json: string
  topic: PromptTopic
}

function mapPromptRow(row: PromptRow): PromptSummary {
  return {
    id: toPromptId(row.id),
    level: row.level,
    saved: row.saved === 1,
    suggestedLengthLabel: row.suggested_length_label,
    tags: JSON.parse(row.tags_json) as string[],
    text: row.text,
    topic: row.topic,
  }
}

function mapPromptDetailRow(row: PromptRow): PromptDetail {
  return {
    ...mapPromptRow(row),
    description: row.description,
    outline: JSON.parse(row.outline_json) as string[],
    tips: JSON.parse(row.tips_json) as string[],
  }
}

export class SqlitePromptRepository implements PromptRepository {
  constructor(private readonly database: Database) {}

  async exists(promptId: PromptId): Promise<boolean> {
    const row = this.database
      .query("select 1 as found from prompts where id = ? limit 1")
      .get(promptId as number) as { found: number } | null

    return row?.found === 1
  }

  async getById(
    userId: UserId,
    promptId: PromptId
  ): Promise<PromptDetail | null> {
    const row = this.database
      .query(
        `
          select
            p.id,
            p.text,
            p.description,
            p.topic,
            p.level,
            p.suggested_length_label,
            p.tags_json,
            p.outline_json,
            p.tips_json,
            case when sp.prompt_id is null then 0 else 1 end as saved
          from prompts p
          left join saved_prompts sp
            on sp.prompt_id = p.id
           and sp.user_id = ?
          where p.id = ?
          limit 1
        `
      )
      .get(userId, promptId as number) as PromptRow | null

    return row ? mapPromptDetailRow(row) : null
  }

  async list(
    userId: UserId,
    filters: PromptListFilters
  ): Promise<PromptSummary[]> {
    const params: Array<number | string> = [userId]
    const conditions: string[] = []

    if (filters.query) {
      conditions.push("(p.text like ? or p.description like ?)")
      const likeQuery = `%${filters.query}%`
      params.push(likeQuery, likeQuery)
    }

    if (filters.topic) {
      conditions.push("p.topic = ?")
      params.push(filters.topic)
    }

    if (filters.level) {
      conditions.push("p.level = ?")
      params.push(filters.level)
    }

    if (filters.saved === true) {
      conditions.push("sp.prompt_id is not null")
    }

    if (filters.saved === false) {
      conditions.push("sp.prompt_id is null")
    }

    const whereClause =
      conditions.length > 0 ? `where ${conditions.join(" and ")}` : ""

    const rows = this.database
      .query(
        `
          select
            p.id,
            p.text,
            p.description,
            p.topic,
            p.level,
            p.suggested_length_label,
            p.tags_json,
            p.outline_json,
            p.tips_json,
            case when sp.prompt_id is null then 0 else 1 end as saved
          from prompts p
          left join saved_prompts sp
            on sp.prompt_id = p.id
           and sp.user_id = ?
          ${whereClause}
          order by p.id asc
        `
      )
      .all(...params) as PromptRow[]

    return rows.map(mapPromptRow)
  }

  async listSaved(userId: UserId, limit = 10): Promise<PromptSummary[]> {
    const rows = this.database
      .query(
        `
          select
            p.id,
            p.text,
            p.description,
            p.topic,
            p.level,
            p.suggested_length_label,
            p.tags_json,
            p.outline_json,
            p.tips_json,
            1 as saved
          from saved_prompts sp
          inner join prompts p on p.id = sp.prompt_id
          where sp.user_id = ?
          order by sp.saved_at desc, p.id asc
          limit ?
        `
      )
      .all(userId, limit) as PromptRow[]

    return rows.map(mapPromptRow)
  }

  async listTodayPrompts(
    userId: UserId,
    limit: number
  ): Promise<PromptSummary[]> {
    const rows = this.database
      .query(
        `
          select
            p.id,
            p.text,
            p.description,
            p.topic,
            p.level,
            p.suggested_length_label,
            p.tags_json,
            p.outline_json,
            p.tips_json,
            case when sp.prompt_id is null then 0 else 1 end as saved
          from prompts p
          left join saved_prompts sp
            on sp.prompt_id = p.id
           and sp.user_id = ?
          where p.is_today_recommended = 1
          order by p.today_recommendation_order asc, p.id asc
          limit ?
        `
      )
      .all(userId, limit) as PromptRow[]

    return rows.map(mapPromptRow)
  }

  async save(userId: UserId, promptId: PromptId): Promise<PromptSaveResult> {
    const exists = await this.exists(promptId)

    if (!exists) {
      return { kind: "not-found" }
    }

    const savedAt = new Date().toISOString()
    this.database
      .query(
        `
          insert into saved_prompts (user_id, prompt_id, saved_at)
          values (?, ?, ?)
          on conflict(user_id, prompt_id) do update set
            saved_at = excluded.saved_at
        `
      )
      .run(userId, promptId as number, savedAt)

    return {
      kind: "saved",
      savedAt,
    }
  }

  async unsave(userId: UserId, promptId: PromptId): Promise<boolean> {
    const result = this.database
      .query("delete from saved_prompts where user_id = ? and prompt_id = ?")
      .run(userId, promptId as number)

    return result.changes > 0
  }
}
