import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import { err, ok } from "@workspace/kernel/result"
import type {
  WritingTaskId,
  WritingTaskPublicationId,
} from "@workspace/types/ids"

import type {
  WritingAdminApplication,
  WritingRepository,
} from "#writing/application/ports/writing-ports"
import {
  createWritingTaskDraft,
  publishWritingTask,
  saveWritingTaskDraft,
} from "#writing/domain/writing-task"

export function createWritingAdminApplication(input: {
  readonly clock: Clock
  readonly publicationIdGenerator: IdGenerator<WritingTaskPublicationId>
  readonly repository: WritingRepository
  readonly taskIdGenerator: IdGenerator<WritingTaskId>
}): WritingAdminApplication {
  return {
    async createTask() {
      const draft = createWritingTaskDraft({
        id: input.taskIdGenerator.next(),
        now: input.clock.now(),
      })
      await input.repository.createTask(draft)
      return draft
    },
    async getTask(taskId) {
      const draft = await input.repository.findTaskById(taskId)
      return draft === null
        ? err({ kind: "writing-task-not-found" })
        : ok(draft)
    },
    listTasks(filter) {
      return input.repository.listTasks(filter)
    },
    async publishTask(command) {
      const current = await input.repository.findTaskById(command.taskId)
      if (current === null) return err({ kind: "writing-task-not-found" })
      if (current.editVersion !== command.expectedEditVersion) {
        return err({ kind: "writing-task-version-conflict" })
      }

      const published = publishWritingTask(current, {
        id: input.publicationIdGenerator.next(),
        now: input.clock.now(),
      })
      if ("kind" in published) return err(published)

      const saved = await input.repository.publishTask({
        draft: published.draft,
        expectedEditVersion: command.expectedEditVersion,
        publication: published.publication,
      })
      if (saved.isErr()) return err(saved.error)
      return ok({ draft: saved.value, publication: published.publication })
    },
    async saveTask(command) {
      const current = await input.repository.findTaskById(command.taskId)
      if (current === null) return err({ kind: "writing-task-not-found" })
      if (current.editVersion !== command.expectedEditVersion) {
        return err({ kind: "writing-task-version-conflict" })
      }

      const draft = saveWritingTaskDraft(current, {
        audience: command.audience,
        difficulty: command.difficulty,
        domain: command.domain,
        goalChars: command.goalChars,
        minChars: command.minChars,
        now: input.clock.now(),
        requiredElements: command.requiredElements,
        situation: command.situation,
        title: command.title,
        typeName: command.typeName,
      })
      return input.repository.saveTask({
        draft,
        expectedEditVersion: command.expectedEditVersion,
      })
    },
  }
}
