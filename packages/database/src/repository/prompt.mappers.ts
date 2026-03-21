import { eq, isNotNull, isNull, like, or, sql, type SQL } from "drizzle-orm"
import {
  toPromptId,
  type PromptDetail,
  type PromptId,
  type PromptLengthLabel,
  type PromptListFilters,
  type PromptSummary,
  type PromptTopic,
} from "@workspace/core"

import { prompts, savedPrompts } from "../schema/index.js"

export type PromptSummaryRow = {
  id: number
  level: 1 | 2 | 3
  saved: number
  suggestedLengthLabel: PromptLengthLabel
  tagsJson: string[]
  text: string
  topic: PromptTopic
}

export type PromptDetailRow = PromptSummaryRow & {
  description: string
  outlineJson: string[]
  tipsJson: string[]
}

export const savedExpression = sql<number>`case when ${savedPrompts.promptId} is null then 0 else 1 end`

export function toPromptIdValue(promptId: PromptId): number {
  return promptId as number
}

export function buildPromptListConditions(filters: PromptListFilters): SQL[] {
  const conditions: SQL[] = []

  if (filters.query) {
    const likeQuery = `%${filters.query}%`
    conditions.push(
      or(like(prompts.text, likeQuery), like(prompts.description, likeQuery))!
    )
  }

  if (filters.topic) {
    conditions.push(eq(prompts.topic, filters.topic))
  }

  if (filters.level) {
    conditions.push(eq(prompts.level, filters.level))
  }

  if (filters.saved === true) {
    conditions.push(isNotNull(savedPrompts.promptId))
  }

  if (filters.saved === false) {
    conditions.push(isNull(savedPrompts.promptId))
  }

  return conditions
}

export function mapPromptSummary(row: PromptSummaryRow): PromptSummary {
  return {
    id: toPromptId(row.id),
    level: row.level,
    saved: row.saved === 1,
    suggestedLengthLabel: row.suggestedLengthLabel,
    tags: row.tagsJson,
    text: row.text,
    topic: row.topic,
  }
}

export function mapPromptDetail(row: PromptDetailRow): PromptDetail {
  return {
    ...mapPromptSummary(row),
    description: row.description,
    outline: row.outlineJson,
    tips: row.tipsJson,
  }
}
