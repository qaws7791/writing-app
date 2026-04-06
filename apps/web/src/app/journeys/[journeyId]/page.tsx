import { redirect } from "next/navigation"
import JourneyDetailClientPage from "./client"

export default async function JourneyDetailPage({
  params,
}: {
  params: Promise<{ journeyId: string }>
}) {
  const { journeyId } = await params

  if (!journeyId) {
    redirect("/")
  }

  return <JourneyDetailClientPage journeyId={journeyId} />
}
