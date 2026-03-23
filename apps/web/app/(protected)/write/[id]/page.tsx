import WritingPageClient from "./writing-page-client"

export default async function WriteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <WritingPageClient draftId={Number(id)} />
}
