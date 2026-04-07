import { redirect } from "next/navigation"
import WritingEditorView from "@/views/writing-editor-view"

export default async function WritingEditPage({
  params,
}: {
  params: Promise<{ writingId: string }>
}) {
  const { writingId } = await params

  if (!writingId) {
    redirect("/")
  }

  return <WritingEditorView writingId={writingId} />
}
