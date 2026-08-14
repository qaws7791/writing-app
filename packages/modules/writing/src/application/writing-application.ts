import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import { toPlatformDayKey } from "@workspace/kernel/day-boundary"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { WritingCheckId, WritingId } from "@workspace/types/ids"

import type {
  WritingApplication,
  WritingApplicationError,
  WritingCheckProvider,
  WritingRepository,
  WritingSession,
} from "#writing/application/ports/writing-ports"
import { readWritingCheckGate } from "#writing/domain/writing-check"
import {
  createWritingPiece,
  reviseWritingPiece,
  writingEventTypes,
  type WritingPiece,
} from "#writing/domain/writing"

export function createWritingApplication(input: {
  readonly checkProvider: WritingCheckProvider
  readonly clock: Clock
  readonly dailySuccessfulCheckLimit: number
  readonly idGenerator: IdGenerator<WritingId>
  readonly checkIdGenerator: IdGenerator<WritingCheckId>
  readonly repository: WritingRepository
}): WritingApplication {
  return {
    acknowledgeAiNotice(learnerId) {
      return input.repository.acknowledgeAiNotice({
        learnerId,
        now: input.clock.now(),
      })
    },
    async check(command) {
      const session = await readSession(input, command)
      if (session.isErr()) return err(session.error)

      const gate = readWritingCheckGate({
        acknowledgedNotice: session.value.aiNoticeAcknowledged,
        body: session.value.writing.body,
        dailyChecksRemaining: session.value.dailyChecksRemaining,
        minChars: session.value.brief.minChars,
      })
      if (gate !== null) return err(gate)

      const checked = await input.checkProvider.check({
        body: session.value.writing.body,
        brief: session.value.brief,
      })
      if (checked.isErr()) {
        return err({
          kind:
            checked.error.kind === "not-configured"
              ? "writing-check-not-configured"
              : "writing-check-provider-unavailable",
        })
      }

      await input.repository.createCheck({
        bodyVersion: session.value.writing.version,
        eventType: writingEventTypes.checkSucceeded,
        id: input.checkIdGenerator.next(),
        now: input.clock.now(),
        result: checked.value,
        writing: session.value.writing,
      })
      return readSession(input, command)
    },
    async create(command) {
      const publication = await input.repository.findLatestPublicationByTaskId(
        command.taskId
      )
      if (publication === null) {
        return err({ kind: "writing-task-unpublished" })
      }

      const writing = createWritingPiece({
        id: input.idGenerator.next(),
        learnerId: command.learnerId,
        now: input.clock.now(),
        publicationId: publication.id,
      })
      await input.repository.createPiece(writing, writingEventTypes.created)
      return readSession(input, {
        learnerId: command.learnerId,
        writingId: writing.id,
      })
    },
    delete(command) {
      return input.repository.deletePiece({
        eventType: writingEventTypes.deleted,
        expectedVersion: command.expectedVersion,
        learnerId: command.learnerId,
        now: input.clock.now(),
        writingId: command.writingId,
      })
    },
    get(command) {
      return readSession(input, command)
    },
    list(learnerId) {
      return input.repository.listPiecesByLearner(learnerId)
    },
    listCatalog(filter) {
      return input.repository.listCatalog(filter)
    },
    async save(command) {
      const current = await readOwnedPiece(input.repository, command)
      if (current.isErr()) return err(current.error)
      if (current.value.version !== command.expectedVersion) {
        return err({ kind: "writing-version-conflict" })
      }

      const hasSucceededCheck = await input.repository.hasSucceededCheck(
        current.value.id
      )
      const transition = reviseWritingPiece(current.value, {
        body: command.body,
        hasSucceededCheck,
        now: input.clock.now(),
      })
      const saved = await input.repository.savePiece({
        eventTypes: transition.eventTypes,
        expectedVersion: command.expectedVersion,
        writing: transition.writing,
      })
      if (saved.isErr()) return err(saved.error)
      return readSession(input, command)
    },
  }
}

async function readOwnedPiece(
  repository: WritingRepository,
  input: Parameters<WritingRepository["findPieceById"]>[0]
): Promise<Result<WritingPiece, WritingApplicationError>> {
  const writing = await repository.findPieceById(input)
  return writing === null ? err({ kind: "writing-not-found" }) : ok(writing)
}

async function readSession(
  input: {
    readonly clock: Clock
    readonly dailySuccessfulCheckLimit: number
    readonly repository: WritingRepository
  },
  command: Parameters<WritingRepository["findPieceById"]>[0]
): Promise<Result<WritingSession, WritingApplicationError>> {
  const writing = await input.repository.findPieceById(command)
  if (writing === null) return err({ kind: "writing-not-found" })

  const brief = await input.repository.findPublicationById(
    writing.publicationId
  )
  if (brief === null) return err({ kind: "writing-not-found" })

  const [check, aiNoticeAcknowledged, usedToday] = await Promise.all([
    input.repository.findLatestCheck(writing.id),
    input.repository.hasAcknowledgedAiNotice(writing.learnerId),
    countSuccessfulChecksToday(input, writing.learnerId),
  ])

  return ok({
    aiNoticeAcknowledged,
    brief,
    check,
    dailyChecksRemaining: Math.max(
      0,
      input.dailySuccessfulCheckLimit - usedToday
    ),
    writing,
  })
}

function countSuccessfulChecksToday(
  input: {
    readonly clock: Clock
    readonly repository: WritingRepository
  },
  learnerId: Parameters<
    WritingRepository["countSuccessfulChecksInRange"]
  >[0]["learnerId"]
): Promise<number> {
  const now = input.clock.now()
  const dayKey = toPlatformDayKey(now)
  const from = new Date(`${dayKey}T00:00:00+09:00`)
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1_000)
  return input.repository.countSuccessfulChecksInRange({
    from,
    learnerId,
    to,
  })
}
