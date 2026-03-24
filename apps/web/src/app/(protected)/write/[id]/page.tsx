import WritingPageView from "@/views/writing-page-view"

export default async function WriteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <WritingPageView draftId={Number(id)} />
}
