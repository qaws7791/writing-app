import PromptDetailView from "@/views/prompt-detail-view"

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PromptDetailView promptId={Number(id)} />
}
