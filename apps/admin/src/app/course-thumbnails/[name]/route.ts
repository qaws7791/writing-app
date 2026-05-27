import { readFile } from "node:fs/promises"
import { join } from "node:path"

type CourseThumbnailRouteContext = {
  params: Promise<{
    name: string
  }>
}

const thumbnailNamePattern = /^[a-z0-9-]+\.png$/

export async function GET(
  _request: Request,
  { params }: CourseThumbnailRouteContext
) {
  const { name } = await params

  if (!thumbnailNamePattern.test(name)) {
    return new Response(null, { status: 404 })
  }

  try {
    const bytes = await readFile(
      join(process.cwd(), "../web/public/course-thumbnails", name)
    )

    return new Response(bytes, {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
        "content-type": "image/png",
      },
    })
  } catch {
    return new Response(null, { status: 404 })
  }
}
