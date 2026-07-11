import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { createCourseThumbnailHandler } from "@/app/course-thumbnails/[name]/course-thumbnail-handler"

export const runtime = "nodejs"

export const GET = createCourseThumbnailHandler({
  readThumbnailFile: readFile,
  thumbnailDirectory: join(
    process.cwd(),
    "..",
    "web",
    "public",
    "course-thumbnails"
  ),
})
