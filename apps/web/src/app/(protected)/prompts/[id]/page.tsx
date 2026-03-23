import PromptDetailPageClient from "./prompt-detail-page-client"

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const promptId = Number(id)

  return <PromptDetailPageClient promptId={promptId} />
}
