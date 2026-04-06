import { redirect } from "next/navigation"
import SessionDetailClientPage from "./client"

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ journeyId: string; sessionId: string }>
}) {
  const { journeyId, sessionId } = await params

  if (!journeyId || !sessionId) {
    redirect("/")
  }

  return <SessionDetailClientPage journeyId={journeyId} sessionId={sessionId} />
}
