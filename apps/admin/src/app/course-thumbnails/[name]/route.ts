import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { courseVisualKeyValues } from "@workspace/contracts/content"

export const runtime = "nodejs"

const courseVisualKeys = new Set<string>(courseVisualKeyValues)
const thumbnailDirectory = join(
  process.cwd(),
  "..",
  "web",
  "public",
  "course-thumbnails"
)

export async function GET(
  _request: Request,
  {
    params,
  }: {
    readonly params: Promise<{
      readonly name: string
    }>
  }
): Promise<Response> {
  const { name } = await params
  const visualKey = name.endsWith(".png") ? name.slice(0, -4) : name

  if (!isCourseVisualKey(visualKey)) {
    return new Response("Not Found", { status: 404 })
  }

  const bytes = await readFile(join(thumbnailDirectory, `${visualKey}.png`))

  return new Response(bytes, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/png",
    },
  })
}

function isCourseVisualKey(value: string): value is CourseVisualKey {
  return courseVisualKeys.has(value)
}

type CourseVisualKey = (typeof courseVisualKeyValues)[number]
