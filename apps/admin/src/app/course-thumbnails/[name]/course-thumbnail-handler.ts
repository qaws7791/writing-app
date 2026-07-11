import type { Buffer } from "node:buffer"
import { join } from "node:path"

import { courseVisualKeyValues } from "@workspace/contracts/content"

const courseVisualKeys = new Set<string>(courseVisualKeyValues)

type ThumbnailReader = (path: string) => Promise<Buffer>

export function createCourseThumbnailHandler({
  readThumbnailFile,
  thumbnailDirectory,
}: {
  readonly readThumbnailFile: ThumbnailReader
  readonly thumbnailDirectory: string
}) {
  const thumbnailPromises = new Map<CourseVisualKey, Promise<Buffer>>()

  return async function GET(
    _request: Request,
    {
      params,
    }: {
      readonly params: Promise<{ readonly name: string }>
    }
  ): Promise<Response> {
    const { name } = await params
    const visualKey = name.endsWith(".png") ? name.slice(0, -4) : name

    if (!isCourseVisualKey(visualKey)) {
      return new Response("Not Found", { status: 404 })
    }

    const bytes = await readCourseThumbnail(visualKey)
    if (bytes === null) {
      return new Response("Not Found", { status: 404 })
    }

    return new Response(Uint8Array.from(bytes).buffer, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "image/png",
      },
    })
  }

  async function readCourseThumbnail(
    visualKey: CourseVisualKey
  ): Promise<Buffer | null> {
    const cached = thumbnailPromises.get(visualKey)
    if (cached !== undefined) {
      return cached
    }

    const pending = readThumbnailFile(
      join(thumbnailDirectory, `${visualKey}.png`)
    )
    thumbnailPromises.set(visualKey, pending)

    try {
      return await pending
    } catch (error) {
      thumbnailPromises.delete(visualKey)
      if (isMissingFileError(error)) {
        return null
      }
      throw error
    }
  }
}

function isCourseVisualKey(value: string): value is CourseVisualKey {
  return courseVisualKeys.has(value)
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as Error & { readonly code?: string }).code === "ENOENT"
  )
}

type CourseVisualKey = (typeof courseVisualKeyValues)[number]
