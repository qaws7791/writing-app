import WritingNewPageClient from "../new/writing-new-page-client"

export default async function WriteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <WritingNewPageClient draftId={Number(id)} />
}
