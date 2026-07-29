import { z } from "zod"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import type {
  LearnerDeletionMarker,
  LearnerDeletionMarkerStorePort,
} from "@workspace/identity/ports"
import type { IdGenerator } from "@workspace/kernel/clock"
import { err, ok } from "@workspace/kernel/result"
import type { PrivateObjectStorage } from "@workspace/storage/private-object-storage"

const deletionMarkerSchema = z
  .object({
    requestedAt: z.iso.datetime(),
    userId: userIdSchema,
  })
  .strict()

export function createS3DeletionMarkerStore(input: {
  readonly idGenerator: IdGenerator<string>
  readonly objectStorage: PrivateObjectStorage
  readonly prefix: string
}): LearnerDeletionMarkerStorePort {
  const prefix = normalizePrivatePrefix(input.prefix)

  return {
    async readAll() {
      try {
        const listed = await input.objectStorage.listObjectKeys(`${prefix}/`)
        if (listed.isErr()) {
          return err({
            cause: listed.error,
            kind: "deletion-marker-storage-failed",
          })
        }

        const markers = await Promise.all(
          listed.value.map(async (objectKey) => {
            const object = await input.objectStorage.getObject(objectKey)
            if (object.isErr()) {
              throw new Error("private marker object read failed")
            }
            return parseDeletionMarker(object.value)
          })
        )
        return ok(sortDeletionMarkers(markers))
      } catch (cause) {
        return err({ cause, kind: "deletion-marker-storage-failed" })
      }
    },
    async record(marker) {
      try {
        const body = new TextEncoder().encode(
          JSON.stringify({
            requestedAt: marker.requestedAt.toISOString(),
            userId: marker.userId,
          })
        )
        const objectKey = `${prefix}/${marker.requestedAt.getTime()}-${encodeURIComponent(input.idGenerator.next())}.json`
        const stored = await input.objectStorage.putObject({
          body,
          contentType: "application/json",
          objectKey,
        })
        return stored.isErr()
          ? err({
              cause: stored.error,
              kind: "deletion-marker-storage-failed",
            })
          : ok(undefined)
      } catch (cause) {
        return err({ cause, kind: "deletion-marker-storage-failed" })
      }
    },
  }
}

export function createInMemoryDeletionMarkerStore(): LearnerDeletionMarkerStorePort {
  const markers: LearnerDeletionMarker[] = []

  return {
    async readAll() {
      return ok(sortDeletionMarkers(markers))
    },
    async record(marker) {
      markers.push(
        // readAll shares stored marker objects, so property reassignment must not corrupt later reads.
        Object.freeze({
          requestedAt: new Date(marker.requestedAt),
          userId: marker.userId,
        })
      )
      return ok(undefined)
    },
  }
}

function parseDeletionMarker(bytes: Uint8Array): LearnerDeletionMarker {
  const value: unknown = JSON.parse(new TextDecoder().decode(bytes))
  const parsed = deletionMarkerSchema.parse(value)
  return {
    requestedAt: new Date(parsed.requestedAt),
    userId: parsed.userId,
  }
}

function sortDeletionMarkers(
  markers: readonly LearnerDeletionMarker[]
): readonly LearnerDeletionMarker[] {
  return [...markers].sort(
    (left, right) =>
      left.requestedAt.getTime() - right.requestedAt.getTime() ||
      left.userId.localeCompare(right.userId)
  )
}

function normalizePrivatePrefix(value: string): string {
  const normalized = value.replace(/^\/+|\/+$/gu, "")
  if (
    normalized.length === 0 ||
    normalized.split("/").some((segment) => !/^[A-Za-z0-9._-]+$/u.test(segment))
  ) {
    throw new Error("삭제 marker private prefix가 올바르지 않습니다.")
  }
  return normalized
}
