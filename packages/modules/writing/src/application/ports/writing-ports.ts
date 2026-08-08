import type { Result } from "@workspace/kernel/result"
import type { LearnerId, WritingId } from "@workspace/types/ids"

import type { Writing, WritingEventType } from "#writing/domain/writing"

type WritingPersistenceError =
  | Readonly<{ kind: "writing-not-found" }>
  | Readonly<{ kind: "writing-version-conflict" }>

export type WritingRepository = Readonly<{
  create: (writing: Writing, eventType: WritingEventType) => Promise<void>
  delete: (input: {
    readonly eventType: WritingEventType
    readonly expectedVersion: number
    readonly learnerId: LearnerId
    readonly now: Date
    readonly writingId: WritingId
  }) => Promise<Result<WritingId, WritingPersistenceError>>
  findById: (input: {
    readonly learnerId: LearnerId
    readonly writingId: WritingId
  }) => Promise<Writing | null>
  listByLearner: (learnerId: LearnerId) => Promise<readonly Writing[]>
  save: (input: {
    readonly eventTypes: readonly WritingEventType[]
    readonly expectedVersion: number
    readonly writing: Writing
  }) => Promise<Result<Writing, WritingPersistenceError>>
}>

export type WritingApplicationError =
  | WritingPersistenceError
  | Readonly<{ kind: "writing-self-check-not-started" }>

export type WritingApplication = Readonly<{
  completeSelfCheck: (input: {
    readonly expectedVersion: number
    readonly learnerId: LearnerId
    readonly writingId: WritingId
  }) => Promise<Result<Writing, WritingApplicationError>>
  create: (input: {
    readonly learnerId: LearnerId
    readonly mode: Writing["mode"]
  }) => Promise<Writing>
  delete: (input: {
    readonly expectedVersion: number
    readonly learnerId: LearnerId
    readonly writingId: WritingId
  }) => Promise<Result<WritingId, WritingApplicationError>>
  get: (input: {
    readonly learnerId: LearnerId
    readonly writingId: WritingId
  }) => Promise<Result<Writing, WritingApplicationError>>
  list: (learnerId: LearnerId) => Promise<readonly Writing[]>
  save: (input: {
    readonly body: string
    readonly expectedVersion: number
    readonly learnerId: LearnerId
    readonly title: string
    readonly writingId: WritingId
  }) => Promise<Result<Writing, WritingApplicationError>>
  startSelfCheck: (input: {
    readonly expectedVersion: number
    readonly learnerId: LearnerId
    readonly writingId: WritingId
  }) => Promise<Result<Writing, WritingApplicationError>>
}>
