import { Suspense } from "react"
import MyJourneysView from "@/views/my-journeys-view"

export default function MyJourneysPage() {
  return (
    <Suspense>
      <MyJourneysView />
    </Suspense>
  )
}
