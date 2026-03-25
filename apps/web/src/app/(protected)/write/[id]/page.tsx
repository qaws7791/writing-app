import { notFound } from "next/navigation"
import { z } from "zod"
import WritingPageView from "@/views/writing-page-view"

const paramsSchema = z.object({ id: z.string().min(1) })

export default async function WriteDetailPage({
  params,
}: PageProps<"/write/[id]">) {
  const parsed = paramsSchema.safeParse(await params)
  if (!parsed.success) notFound()
  const { id } = parsed.data
  return <WritingPageView draftId={Number(id)} />
}
