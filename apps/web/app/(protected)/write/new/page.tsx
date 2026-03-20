import WritingNewPageClient from "./writing-new-page-client"

export default async function WritingNewPage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string }>
}) {
  const params = await searchParams
  const initialPromptId = params.prompt ? Number(params.prompt) : null

  return <WritingNewPageClient initialPromptId={initialPromptId} />
}
