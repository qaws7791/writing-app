import { notFound } from "next/navigation"
import { z } from "zod"
import PromptDetailView from "@/views/prompt-detail-view"

const paramsSchema = z.object({ id: z.string().min(1) })

export default async function PromptDetailPage({
  params,
}: PageProps<"/prompts/[id]">) {
  const parsed = paramsSchema.safeParse(await params)
  if (!parsed.success) notFound()
  const { id } = parsed.data
  return <PromptDetailView promptId={Number(id)} />
}
