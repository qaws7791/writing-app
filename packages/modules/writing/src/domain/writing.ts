import type {
  WritingMode,
  WritingStatus,
} from "@workspace/contracts/writing/writing"
import type { LearnerId, WritingId } from "@workspace/types/ids"

export const writingEventTypes = {
  created: "writing_created",
  deleted: "writing_deleted",
  revisedAfterSelfCheck: "revised_after_self_check",
  selfCheckCompleted: "self_check_completed",
  selfCheckStarted: "self_check_started",
} as const

export type WritingEventType =
  (typeof writingEventTypes)[keyof typeof writingEventTypes]

export type Writing = Readonly<{
  body: string
  checkedAt: Date | null
  createdAt: Date
  id: WritingId
  learnerId: LearnerId
  mode: WritingMode
  selfCheckStartedAt: Date | null
  status: WritingStatus
  title: string
  updatedAt: Date
  version: number
}>

export function createWriting(input: {
  readonly id: WritingId
  readonly learnerId: LearnerId
  readonly mode: WritingMode
  readonly now: Date
}): Writing {
  return {
    body: "",
    checkedAt: null,
    createdAt: input.now,
    id: input.id,
    learnerId: input.learnerId,
    mode: input.mode,
    selfCheckStartedAt: null,
    status: "drafting",
    title: "",
    updatedAt: input.now,
    version: 0,
  }
}

export function reviseWriting(
  writing: Writing,
  input: Readonly<{ body: string; now: Date; title: string }>
): Readonly<{
  eventTypes: readonly WritingEventType[]
  writing: Writing
}> {
  const bodyChanged = input.body !== writing.body
  const revisedAfterSelfCheck =
    bodyChanged && writing.selfCheckStartedAt !== null

  return {
    eventTypes: revisedAfterSelfCheck
      ? [writingEventTypes.revisedAfterSelfCheck]
      : [],
    writing: {
      ...writing,
      body: input.body,
      checkedAt: bodyChanged ? null : writing.checkedAt,
      status: bodyChanged ? "drafting" : writing.status,
      title: input.title,
      updatedAt: input.now,
      version: writing.version + 1,
    },
  }
}

export function startWritingSelfCheck(
  writing: Writing,
  now: Date
): Readonly<{
  eventTypes: readonly WritingEventType[]
  writing: Writing
}> {
  return {
    eventTypes: [writingEventTypes.selfCheckStarted],
    writing: {
      ...writing,
      selfCheckStartedAt: now,
      updatedAt: now,
      version: writing.version + 1,
    },
  }
}

export function completeWritingSelfCheck(
  writing: Writing,
  now: Date
): Readonly<{
  eventTypes: readonly WritingEventType[]
  writing: Writing
}> {
  return {
    eventTypes: [writingEventTypes.selfCheckCompleted],
    writing: {
      ...writing,
      checkedAt: now,
      status: "checked",
      updatedAt: now,
      version: writing.version + 1,
    },
  }
}
