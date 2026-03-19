import type { Database } from "bun:sqlite"
import {
  toDraftId,
  toPromptId,
  type DraftAccessResult,
  type DraftDeleteResult,
  type DraftDetail,
  type DraftId,
  type DraftMutationResult,
  type DraftPersistInput,
  type DraftRepository,
  type DraftSummary,
  type DraftContent,
  type UserId,
} from "@workspace/domain"

type DraftRow = {
  body_json: string
  body_plain_text: string
  character_count: number
  created_at: string
  id: number
  last_saved_at: string
  source_prompt_id: number | null
  title: string
  updated_at: string
  user_id: string
  word_count: number
}

function toPreview(plainText: string): string {
  return plainText.length <= 120 ? plainText : `${plainText.slice(0, 120)}...`
}

function mapDraftSummary(row: DraftRow): DraftSummary {
  return {
    characterCount: row.character_count,
    id: toDraftId(row.id),
    lastSavedAt: row.last_saved_at,
    preview: toPreview(row.body_plain_text),
    sourcePromptId:
      row.source_prompt_id === null ? null : toPromptId(row.source_prompt_id),
    title: row.title,
    wordCount: row.word_count,
  }
}

function mapDraftDetail(row: DraftRow): DraftDetail {
  return {
    ...mapDraftSummary(row),
    content: JSON.parse(row.body_json) as DraftContent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class SqliteDraftRepository implements DraftRepository {
  constructor(private readonly database: Database) {}

  private loadDraftRow(draftId: DraftId): DraftRow | null {
    return this.database
      .query(
        `
          select
            id,
            user_id,
            title,
            json(body_jsonb) as body_json,
            body_plain_text,
            character_count,
            word_count,
            source_prompt_id,
            last_saved_at,
            created_at,
            updated_at
          from drafts
          where id = ?
          limit 1
        `
      )
      .get(draftId as number) as DraftRow | null
  }

  async create(userId: UserId, input: DraftPersistInput): Promise<DraftDetail> {
    const now = new Date().toISOString()
    const result = this.database
      .query(
        `
          insert into drafts (
            user_id,
            title,
            body_jsonb,
            body_plain_text,
            character_count,
            word_count,
            source_prompt_id,
            last_saved_at,
            created_at,
            updated_at
          )
          values (
            ?,
            ?,
            jsonb(?),
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )
          returning id
        `
      )
      .get(
        userId,
        input.title,
        JSON.stringify(input.content),
        input.plainText,
        input.characterCount,
        input.wordCount,
        input.sourcePromptId === null ? null : (input.sourcePromptId as number),
        now,
        now,
        now
      ) as { id: number } | null

    if (!result) {
      throw new Error("초안을 생성하지 못했습니다.")
    }

    const draft = await this.getById(userId, toDraftId(result.id))
    if (draft.kind !== "draft") {
      throw new Error("생성한 초안을 다시 읽지 못했습니다.")
    }

    return draft.draft
  }

  async delete(userId: UserId, draftId: DraftId): Promise<DraftDeleteResult> {
    const row = this.loadDraftRow(draftId)

    if (!row) {
      return { kind: "not-found" }
    }

    if (row.user_id !== userId) {
      return {
        kind: "forbidden",
        ownerId: row.user_id as UserId,
      }
    }

    this.database
      .query("delete from drafts where id = ?")
      .run(draftId as number)

    return { kind: "deleted" }
  }

  async getById(userId: UserId, draftId: DraftId): Promise<DraftAccessResult> {
    const row = this.loadDraftRow(draftId)

    if (!row) {
      return { kind: "not-found" }
    }

    if (row.user_id !== userId) {
      return {
        kind: "forbidden",
        ownerId: row.user_id as UserId,
      }
    }

    return {
      draft: mapDraftDetail(row),
      kind: "draft",
    }
  }

  async list(userId: UserId, limit = 20): Promise<DraftSummary[]> {
    const rows = this.database
      .query(
        `
          select
            id,
            user_id,
            title,
            json(body_jsonb) as body_json,
            body_plain_text,
            character_count,
            word_count,
            source_prompt_id,
            last_saved_at,
            created_at,
            updated_at
          from drafts
          where user_id = ?
          order by updated_at desc, id desc
          limit ?
        `
      )
      .all(userId, limit) as DraftRow[]

    return rows.map(mapDraftSummary)
  }

  async replace(
    userId: UserId,
    draftId: DraftId,
    input: DraftPersistInput
  ): Promise<DraftMutationResult> {
    const current = this.loadDraftRow(draftId)

    if (!current) {
      return { kind: "not-found" }
    }

    if (current.user_id !== userId) {
      return {
        kind: "forbidden",
        ownerId: current.user_id as UserId,
      }
    }

    const now = new Date().toISOString()

    this.database
      .query(
        `
          update drafts
          set
            title = ?,
            body_jsonb = jsonb(?),
            body_plain_text = ?,
            character_count = ?,
            word_count = ?,
            source_prompt_id = ?,
            last_saved_at = ?,
            updated_at = ?
          where id = ?
        `
      )
      .run(
        input.title,
        JSON.stringify(input.content),
        input.plainText,
        input.characterCount,
        input.wordCount,
        input.sourcePromptId === null ? null : (input.sourcePromptId as number),
        now,
        now,
        draftId as number
      )

    const updated = this.loadDraftRow(draftId)
    if (!updated) {
      return { kind: "not-found" }
    }

    return {
      draft: mapDraftDetail(updated),
      kind: "draft",
    }
  }

  async resume(userId: UserId): Promise<DraftSummary | null> {
    const row = this.database
      .query(
        `
          select
            id,
            user_id,
            title,
            json(body_jsonb) as body_json,
            body_plain_text,
            character_count,
            word_count,
            source_prompt_id,
            last_saved_at,
            created_at,
            updated_at
          from drafts
          where user_id = ?
          order by updated_at desc, id desc
          limit 1
        `
      )
      .get(userId) as DraftRow | null

    return row ? mapDraftSummary(row) : null
  }
}
