import { executeBatch, type DatabaseStatement } from "@workspace/db/batch"
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

export async function seedWritingDatabase(
  database: WritingAppDatabase
): Promise<void> {
  const transaction = database
  for (const task of defaultWritingTaskSeed) {
    const statements: DatabaseStatement[] = []
    const taskId = writingTaskIdSchema.parse(task.taskId)
    const publicationId = writingTaskPublicationIdSchema.parse(task.id)
    const existing = await transaction
      .select({ id: writingTasks.id })
      .from(writingTasks)
      .where(eq(writingTasks.id, taskId))
      .get()
    if (existing !== undefined) continue

    statements.push(
      transaction.insert(writingTasks).values({
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
    )
    statements.push(
      transaction.insert(writingTaskPublications).values({
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
    )
    statements.push(
      transaction
        .update(writingTasks)
        .set({ latestPublicationId: publicationId })
        .where(eq(writingTasks.id, taskId))
    )
    await executeBatch(database, statements)
  }
}
