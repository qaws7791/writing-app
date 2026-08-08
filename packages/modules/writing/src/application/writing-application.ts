import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { WritingId } from "@workspace/types/ids"

import type {
  WritingApplication,
  WritingApplicationError,
  WritingRepository,
} from "#writing/application/ports/writing-ports"
import {
  completeWritingSelfCheck,
  createWriting,
  reviseWriting,
  startWritingSelfCheck,
  writingEventTypes,
  type Writing,
} from "#writing/domain/writing"

export function createWritingApplication(input: {
  readonly clock: Clock
  readonly idGenerator: IdGenerator<WritingId>
  readonly repository: WritingRepository
}): WritingApplication {
  return {
    async completeSelfCheck(command) {
      const current = await readCurrentWriting(input.repository, command)
      if (current.isErr()) return current
      if (current.value.version !== command.expectedVersion) {
        return err({ kind: "writing-version-conflict" })
      }
      if (current.value.selfCheckStartedAt === null) {
        return err({ kind: "writing-self-check-not-started" })
      }

      const transition = completeWritingSelfCheck(
        current.value,
        input.clock.now()
      )
      return input.repository.save({
        eventTypes: transition.eventTypes,
        expectedVersion: command.expectedVersion,
        writing: transition.writing,
      })
    },
    async create(command) {
      const writing = createWriting({
        id: input.idGenerator.next(),
        learnerId: command.learnerId,
        mode: command.mode,
        now: input.clock.now(),
      })
      await input.repository.create(writing, writingEventTypes.created)
      return writing
    },
    delete(command) {
      return input.repository.delete({
        eventType: writingEventTypes.deleted,
        expectedVersion: command.expectedVersion,
        learnerId: command.learnerId,
        now: input.clock.now(),
        writingId: command.writingId,
      })
    },
    get(command) {
      return readCurrentWriting(input.repository, command)
    },
    list(learnerId) {
      return input.repository.listByLearner(learnerId)
    },
    async save(command) {
      const current = await readCurrentWriting(input.repository, command)
      if (current.isErr()) return current
      if (current.value.version !== command.expectedVersion) {
        return err({ kind: "writing-version-conflict" })
      }

      const transition = reviseWriting(current.value, {
        body: command.body,
        now: input.clock.now(),
        title: command.title,
      })
      return input.repository.save({
        eventTypes: transition.eventTypes,
        expectedVersion: command.expectedVersion,
        writing: transition.writing,
      })
    },
    async startSelfCheck(command) {
      const current = await readCurrentWriting(input.repository, command)
      if (current.isErr()) return current
      if (current.value.version !== command.expectedVersion) {
        return err({ kind: "writing-version-conflict" })
      }

      const transition = startWritingSelfCheck(current.value, input.clock.now())
      return input.repository.save({
        eventTypes: transition.eventTypes,
        expectedVersion: command.expectedVersion,
        writing: transition.writing,
      })
    },
  }
}

async function readCurrentWriting(
  repository: WritingRepository,
  input: Parameters<WritingRepository["findById"]>[0]
): Promise<Result<Writing, WritingApplicationError>> {
  const writing = await repository.findById(input)
  return writing === null ? err({ kind: "writing-not-found" }) : ok(writing)
}
