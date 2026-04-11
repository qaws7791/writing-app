import WritingEditorView from "@/views/writing-editor-view"

export default async function WritingNewEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ promptId?: string }>
}) {
  const { promptId } = await searchParams
  const promptIdNumber = promptId ? Number(promptId) : undefined
  const resolvedPromptId =
    promptIdNumber && Number.isInteger(promptIdNumber) && promptIdNumber > 0
      ? promptIdNumber
      : undefined

  return <WritingEditorView promptId={resolvedPromptId} />
}
