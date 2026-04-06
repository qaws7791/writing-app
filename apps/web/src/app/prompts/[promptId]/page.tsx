import { redirect } from "next/navigation"
import PromptDetailClientPage from "./client"

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ promptId: string }>
}) {
  const { promptId } = await params
  const id = Number(promptId)

  if (!Number.isInteger(id) || id <= 0) {
    redirect("/")
  }

  return <PromptDetailClientPage promptId={id} />
}
