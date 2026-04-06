import { redirect } from "next/navigation"
import WritingDetailClientPage from "./client"

export default async function WritingDetailPage({
  params,
}: {
  params: Promise<{ writingId: string }>
}) {
  const { writingId } = await params

  if (!writingId) {
    redirect("/")
  }

  return <WritingDetailClientPage writingId={writingId} />
}
