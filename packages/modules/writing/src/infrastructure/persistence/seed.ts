import { eq } from "drizzle-orm"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  writingTaskIdSchema,
  writingTaskPublicationIdSchema,
} from "@workspace/contracts/writing/writing"

import {
  writingTaskPublications,
  writingTasks,
} from "#writing/infrastructure/persistence/schema"
import { defaultWritingTaskSeed } from "#writing/infrastructure/persistence/seed-tasks"

const defaultSeedTime = new Date("2026-08-13T00:00:00.000Z")

export function seedWritingDatabase(database: WritingAppDatabase): void {
  database.transaction((transaction) => {
    for (const task of defaultWritingTaskSeed) {
      const taskId = writingTaskIdSchema.parse(task.taskId)
      const publicationId = writingTaskPublicationIdSchema.parse(task.id)
      const existing = transaction
        .select({ id: writingTasks.id })
        .from(writingTasks)
        .where(eq(writingTasks.id, taskId))
        .get()
      if (existing !== undefined) continue

      transaction
        .insert(writingTasks)
        .values({
          audience: task.audience,
          createdAt: defaultSeedTime,
          difficulty: task.difficulty,
          domain: task.domain,
          editVersion: 1,
          goalChars: task.goalChars,
          id: taskId,
          latestPublicationId: null,
          minChars: task.minChars,
          requiredElementsJson: JSON.stringify(task.requiredElements),
          situation: task.situation,
          title: task.title,
          typeName: task.typeName,
          updatedAt: defaultSeedTime,
        })
        .run()
      transaction
        .insert(writingTaskPublications)
        .values({
          audience: task.audience,
          difficulty: task.difficulty,
          domain: task.domain,
          goalChars: task.goalChars,
          id: publicationId,
          minChars: task.minChars,
          publishedAt: defaultSeedTime,
          requiredElementsJson: JSON.stringify(task.requiredElements),
          situation: task.situation,
          taskId,
          title: task.title,
          typeName: task.typeName,
        })
        .run()
      transaction
        .update(writingTasks)
        .set({ latestPublicationId: publicationId })
        .where(eq(writingTasks.id, taskId))
        .run()
    }
  })
}
