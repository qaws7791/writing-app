import { Suspense } from "react"
import JourneysView from "@/views/journeys-view"

export default function JourneysPage() {
  return (
    <Suspense>
      <JourneysView />
    </Suspense>
  )
}
