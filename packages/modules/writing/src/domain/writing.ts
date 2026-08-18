import type {
  LearnerId,
  WritingId,
  WritingTaskPublicationId,
} from "@workspace/types/ids"

export const writingEventTypes = {
  checkSucceeded: "check_succeeded",
  created: "writing_created",
  deleted: "writing_deleted",
  revisedAfterCheck: "revised_after_check",
} as const

export type WritingEventType =
  (typeof writingEventTypes)[keyof typeof writingEventTypes]

export type WritingPiece = Readonly<{
  body: string
  createdAt: Date
  id: WritingId
  learnerId: LearnerId
  publicationId: WritingTaskPublicationId
  updatedAt: Date
  version: number
}>

export function countWritingChars(body: string): number {
  return [...body].length
}

const writingPreviewMaxChars = 120

export function previewWritingBody(body: string): string {
  const collapsed = body.replace(/\s+/g, " ").trim()
  if (collapsed.length === 0) return ""

  const chars = [...collapsed]
  if (chars.length <= writingPreviewMaxChars) return collapsed

  return `${chars.slice(0, writingPreviewMaxChars).join("").trimEnd()}…`
}

export function createWritingPiece(input: {
  readonly id: WritingId
  readonly learnerId: LearnerId
  readonly now: Date
  readonly publicationId: WritingTaskPublicationId
}): WritingPiece {
  return {
    body: "",
    createdAt: input.now,
    id: input.id,
    learnerId: input.learnerId,
    publicationId: input.publicationId,
    updatedAt: input.now,
    version: 0,
  }
}

export function reviseWritingPiece(
  writing: WritingPiece,
  input: Readonly<{
    body: string
    hasSucceededCheck: boolean
    now: Date
  }>
): Readonly<{
  eventTypes: readonly WritingEventType[]
  writing: WritingPiece
}> {
  const bodyChanged = input.body !== writing.body
  const revisedAfterCheck = bodyChanged && input.hasSucceededCheck

  return {
    eventTypes: revisedAfterCheck ? [writingEventTypes.revisedAfterCheck] : [],
    writing: {
      ...writing,
      body: input.body,
      updatedAt: input.now,
      version: writing.version + 1,
    },
  }
}
